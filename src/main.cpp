//
// Created by markus on 26/12/2019.
//

#include "main.hpp"
#include "utils.hpp"
#include "updater/updater.hpp"
#include "debug.hpp"
#include "autostop.hpp"
#include "updater/verifyFile.hpp"
#include "cmdParser.hpp"
#include "settings.hpp"

#include <chrono>
#include <thread>
#include <cmath>
#include <future>
#include <fstream>
#include <algorithm>

#ifdef AUTOBET_WINDOWS

#   include <windows.h>
#   include <shellapi.h>

#endif

// Detect heap corruption
#if !defined(NDEBUG) && defined(AUTOBET_WINDOWS)

#   include <crtdbg.h>
#   include <cassert>

#   define ASSERT_MEM_OK() assert(_CrtCheckMemory())
#endif

#ifndef BUILD_CPPJSLIB
#   define CPPJSLIB_ENABLE_WEBSOCKET
#endif //BUILD_CPPJSLIB

#include <CppJsLib.hpp>
#include <ai.h>

#include "logger.hpp"

// Macro for comparing a string to a command line argument
#define CMP_ARGV(str) strcmp(argv[i], str) == 0

// x-Pos for the increase bet button (>) since the scaling is not 100% accurate
#define POS_1_1 2160
#define POS_1_2 2240

using namespace logger;

// Every location to a horse to bet on
const unsigned short int yLocations[6] = {464, 628, 790, 952, 1114, 1276};

CppJsLib::WebGUI *ui;
CppJsLib::WebGUI *webUi;

std::thread *bt = nullptr;
std::thread *wt = nullptr;

settings::posConfigArr *pArr = nullptr;

utils::Application *electron = nullptr;

unsigned short int xPos = 0, yPos = 0, width = 0, height = 0, racesWon = 0, racesLost = 0;
__int64 winnings_all = 0L;
int winnings = 0;
unsigned int time_running = 0;
bool gtaVRunning, running, stopping, starting, keyCombListen, runLoops, debug_full;
float multiplierW, multiplierH;
unsigned int bettingPos = POS_1_1;
int customBettingPos = -1;
unsigned int time_sleep = 36, clicks = 31;

// Functions from js =======================
std::function<void(bool)> set_gta_running;
std::function<void()> ui_keycomb_start = {};
std::function<void()> ui_keycomb_stop = {};

std::function<void(int)> setAllMoneyMade;
std::function<void(int)> addMoney;

typedef struct winnings_buf_s {
    __int64 buf1;
    __int64 winnings;
    __int64 buf2;
} winnings_buf;

/**
 * Kill the program and close all connections
 *
 * @param _exit if exit() shall be called
 */
void kill(bool _exit = true) {
#ifdef ASSERT_MEM_OK
    ASSERT_MEM_OK();
#endif //ASSERT_MEM_OK
    // Add a failsafe thread to kill the program if something in this function takes too long
    std::thread killThread([]() {
        std::this_thread::sleep_for(std::chrono::seconds(15));
        exit(1);
    });
    // Detach the thread
    killThread.detach();

    if (electron) {
        StaticLogger::debug("Killing electron");
        if (!electron->kill()) {
            StaticLogger::warning("Could not kill electron");
        } else {
            StaticLogger::debug("Killed electron");
        }
        delete electron;
    }

    // Abort any downloads
    updater::abortDownload();

    delete pArr;

    // If the threads for doing the first AI prediction did not finish, detach them
    // so they don't throw an exception
    if (bt)
        bt->detach();

    if (wt)
        wt->detach();

    // Set every possible bool to false
    keyCombListen = false;
    runLoops = false;
    running = false;

    // Stop the web servers, so they don't occupy the ports they use
    StaticLogger::debug("Stopping web servers");
    if (CppJsLib::util::stop(ui, true, 5)) {
        StaticLogger::debug("Stopped ui web server");
        delete ui;
    } else {
        StaticLogger::warning("Could not stop ui web server");
    }

    if (webUi && CppJsLib::util::stop(webUi, true, 5)) {
        StaticLogger::debug("Stopped web ui web server");
        delete webUi;
    } else {
        StaticLogger::warning("Could not stop web ui web server");
    }

    // Delete the AIs
    StaticLogger::debug("Deleting Betting AI");
    tf::BettingAI::deleteAi();
    StaticLogger::debug("Deleted Betting AI");

    StaticLogger::debug("Deleting Winnings AI");
    tf::WinningsAI::deleteAi();
    StaticLogger::debug("Deleted Winnings AI");

    // Sleep
    std::this_thread::sleep_for(std::chrono::milliseconds(50));

    // Delete the logger so it closes the file stream, if open
    StaticLogger::destroy();

    if (debug_full) {
        StaticLogger::create();
        debug::finish();
        StaticLogger::destroy();
    }

#ifdef ASSERT_MEM_OK
    ASSERT_MEM_OK();
#endif

    if (_exit) {
        exit(0);
    }
}

/**
 * Get this PCs IP address
 *
 * @return this PCs IP address was a string in the IPv4 format, e.g. xxx.xxx.xxx.xxx
 */
std::string getIP() {
    utils::IPv4 iPv4;
    if (!utils::getOwnIP(iPv4)) {
        StaticLogger::error("Could not retrieve own IP!");
        return "";
    }
    return iPv4.to_string();
}

/**
 * Start the web servers
 */
void startWebServers() {
    StaticLogger::debug("Starting ui web server");
    ui->check_ports = false;
    bool res = ui->start(8025, 8026, "localhost", false);
    if (res) {
        StaticLogger::debug("Successfully started ui");
    } else {
        StaticLogger::error("Could not start ui");
        utils::displayError("Could not start UI web server\nA log file may contain further information", [] {
            exit(1);
        });
    }

    // Run webUi->start in a separate thread so it can check if its ports are occupied
    std::thread([] {
        if (webUi) {
            StaticLogger::debug("Starting web ui web server");
            bool res = webUi->start(8027, 8028, getIP(), false);
            if (res) {
                StaticLogger::debug("Successfully started webUi");
            } else {
                StaticLogger::warning("Could not start webUi");
            }
        } else {
            StaticLogger::warning("Not starting web ui web server since it does not exist");
        }
    }).detach();
}

/**
 * Write winnings_all to winnings.dat
 */
void writeWinnings() {
    std::ofstream ofs("winnings.dat", std::ios::out | std::ios::binary);
    if (!ofs.good()) {
        StaticLogger::error("Unable to open winnings file. Flags: " + std::to_string(ofs.flags()));
        return;
    }

    //winnings_buf buf;
    //memset(&buf, 0, sizeof(winnings_buf));
    //buf.winnings = winnings_all;

    ofs.write((char *) &winnings_all, sizeof(__int64));
    if (ofs.fail()) {
        StaticLogger::warning("Winnings file stream fail bit was set, this is not good");
    }
    ofs.flush();

    ofs.close();
    if (ofs.is_open()) {
        StaticLogger::error("Unable to close winnings file");
    }
}

/**
 * Load winnings_all from binary file winnings.dat
 */
void loadWinnings() {
    StaticLogger::debug("Loading winnings from file");

    if (!utils::fileExists("winnings.dat")) {
        StaticLogger::debug("Winnings file does not exist, creating it");
        writeWinnings:
        winnings_all = 0;
        writeWinnings();
        return;
    }

    std::ifstream ifs("winnings.dat", std::ios::in | std::ios::binary);
    if (!ifs.good()) {
        StaticLogger::error("Unable to open winnings file. Flags: " + std::to_string(ifs.flags()));
        goto writeWinnings;
    }

    //winnings_buf buf;
    //memset(&buf, 0, sizeof(winnings_buf));

    ifs.read((char *) &winnings_all, sizeof(__int64));
    if (ifs.fail()) {
        StaticLogger::warning("File stream fail bit was set, rewriting file");
        goto writeWinnings;
    }

    if (ifs.eof()) {
        StaticLogger::warning("Winnings file end has been reached, rewriting file");
        goto writeWinnings;
    }

    /*if (buf.buf1 != 0 || buf.buf2 != 0) {
        StaticLogger::warning("Winnings buffer is not zero, rewriting file");
        goto writeWinnings;
    }*/

    //winnings_all = buf.winnings;

    ifs.close();

    if (ifs.is_open()) {
        StaticLogger::error("Unable to close winnings file");
    }

    StaticLogger::debug("Read winnings: " + std::to_string(winnings_all));
}

/**
 * Get GTA V window positions and size and write them to their variables
 */
void set_positions() {
    StaticLogger::debug("Getting positions of GTA V window");
    // Definition of width, height, x, y pos of window and multiplier of positions
    utils::windowSize ws;
    utils::getWindowSize(ws);
    xPos = ws.xPos;
    yPos = ws.yPos;
    width = ws.width;
    height = ws.height;
    StaticLogger::debug("Got positions: x: " + std::to_string(xPos) + ", y: " + std::to_string(yPos) + ", w: " +
                        std::to_string(width) + ", h: " + std::to_string(height));

    utils::windowSize screenSize;
    utils::getActiveScreen(xPos + (width / 2), yPos + (height / 2), screenSize);

    StaticLogger::debug("Got active screen width: " + std::to_string(screenSize.width) + " and height: " +
                        std::to_string(screenSize.height));

    if (customBettingPos <= 0 && pArr->size <= 0) {
        double r = (double) width / screenSize.width;
        StaticLogger::debug("Ratio: " + std::to_string(r));

        if (r > 1.01) {
            StaticLogger::error("Ratio is bigger than 1.0, this should not happen");
        } else {
            if (r > 0.625) {
                bettingPos = POS_1_1;
            } else {
                bettingPos = POS_1_2;
            }
        }
    } else if (customBettingPos > 0) {
        bettingPos = customBettingPos;
    } else {
        bettingPos = pArr->getNext(width);
    }

    multiplierW = (float) width / 2560.0f;
    multiplierH = (float) height / 1440.0f;
}

/**
 * Emulate a mouse left click
 *
 * @param x the x-coordinate of the mouse pointer
 * @param y the y-coordinate of the mouse pointer
 * @param move if the mouse should be moved
 */
void leftClick(unsigned int x, unsigned int y, bool move = true) {
    // Only click if the program is running and not trying to stop or the user paused the betting
    // so the mouse is not moved while the user is using it
    if (runLoops) {
        // Apply the multipliers to the x and y coords so they fit to any window size
        // because the built-in values are for a 1440p config
        x = (int) round((float) x * multiplierW) + xPos;
        y = (int) round((float) y * multiplierH) + yPos;
        if (!utils::leftClick((int) x, (int) y, move)) {
            StaticLogger::error("utils::leftClick returned abnormal signal");
        }
    } else {
        StaticLogger::debug("Should click now but the program is about to stop, doing nothing");
    }
}

/**
 * Place a bet on a horse
 *
 * @param y the y position where to click
 */
void place_bet(int y, bool evalBettingPos) {
    StaticLogger::debug("Placing bet");
    leftClick(634, y);
    std::this_thread::sleep_for(std::chrono::milliseconds(100));

    if (evalBettingPos) {
        StaticLogger::debug("Searching for increase bet (>) position");
        utils::windowSize ws;
        utils::getWindowSize(ws);
        int res = utils::findIncreaseBetButton(ws, multiplierH);
        if (res > 0) {
            StaticLogger::debug("Increase bet position found: " + std::to_string(res));
            bettingPos = res;
        }
    }

    leftClick(bettingPos, 680);

    // Calculate distance between betting pos and actual cursor pos since windows tends to not
    // move the cursor the way it should
    POINT p;
    GetCursorPos(&p);

    int dist = (int) (((float) bettingPos - (float) p.x) / multiplierW);
    leftClick(bettingPos + dist, 680);

    for (int i = 0; i < clicks - 1; i++) {
        leftClick(bettingPos + dist, 680, false);
    }

    std::this_thread::sleep_for(std::chrono::milliseconds(100));
    leftClick(1765, 1050);
}

/**
 * Go back from the winnings screen to the betting screen
 */
void reset() {
    leftClick(1286, 1304);
    std::this_thread::sleep_for(std::chrono::milliseconds(100));
    leftClick(1905, 1187);
    std::this_thread::sleep_for(std::chrono::milliseconds(100));
}

/**
 * Set the GTA V running variable in C and JS
 *
 * @param val the new value
 */
void setGtaVRunning(bool val) {
    gtaVRunning = val;
    set_gta_running(val);
}

/**
 * Get the position of the horse to bet on
 *
 * @param src the source HBITMAP as a void pointer because <windows.h> throws errors
 * @return the y-coordinate to click or -1 if this one should be skipped
 */
short get_pos(void *src) {
    // Join both threads for predicting the first image
    if (bt || wt) {
        // Close the threads. Source: https://stackoverflow.com/a/33017819
        if (bt) {
            auto future = std::async(std::launch::async, &std::thread::join, bt);
            if (future.wait_for(std::chrono::seconds(5)) == std::future_status::timeout) {
                // bt is still alive, destroy everything
                StaticLogger::error("bt could not be closed");
                utils::displayError("An error occurred while initializing the AIs", [] {
                    kill(true);
                });
            } else {
                // bt is now d-e-a-d
                delete bt;
                bt = nullptr;
            }
        }

        if (wt) {
            auto future = std::async(std::launch::async, &std::thread::join, wt);
            if (future.wait_for(std::chrono::seconds(5)) == std::future_status::timeout) {
                // wt is still alive, destroy everything
                StaticLogger::error("wt could not be closed");
                utils::displayError("An error occurred while initializing the AIs", [] {
                    kill(true);
                });
            } else {
                // wt is now d-e-a-d
                delete wt;
                wt = nullptr;
            }
        }
    }

    // Write the src to the debug zip folder
    if (debug_full) {
        utils::bitmap *bmp = utils::convertHBitmap(width, height, src);
        debug::writeImage(bmp);
        delete bmp;
    }

    short res[6] = {-1, -1, -1, -1, -1, -1};
    unsigned short yCoord, xCoord, _width, _height;
    StaticLogger::debug("AI results:");
    for (unsigned short i = 0; i < 6; i++) {
        yCoord = (int) round((float) yLocations[i] * multiplierH);
        _height = (int) round((float) 46 * multiplierH);
        xCoord = (int) round(240 * multiplierW);
        _width = (int) round(110 * multiplierW);
        // Crop the screenshot
        utils::bitmap *b = utils::crop(xCoord, yCoord, _width, _height, src);

        // Write bitmap object to debug zip folder
        if (debug_full) {
            debug::writeImage(b);
        }

        // Predict it
        short b_res = tf::BettingAI::predict(b->data, b->size);
        StaticLogger::debug(std::to_string(b_res));

        // Delete the bitmap object
        delete b;

        // Check if the current result already exist, so there are not multiple >10/1 odds ore there is a evens
        // if one of this occurs, bet not on this one
        short *s = std::find(std::begin(res), std::end(res), b_res);
        if (b_res <= 5 && s != std::end(res)) { // If this is 5/1 or higher (%!) and exists multiple times, skip
            return -1;
        }

        res[i] = b_res;
    }

    // If evens exist, only bet if the second highest percentage is lower than 4/1 (basically only 4/1 or 5/1)
    if (std::find(std::begin(res), std::end(res), 1) != std::end(res)) {
        short lowest = -1;
        for (short re : res) {
            // Set lowest if res[s] is smaller than lowest and not equal to 1 (evens), since this will always be lower,
            // but the second lowest percentage is to be searched for.
            if ((lowest == -1 || re < lowest) && re != 1) {
                lowest = re;
            }
        }

        // If the second lowest percentage is lower than 4/1 (so 2/1 or 3/1), do not bet, it ain't worth it. Trust me.
        if (lowest < 4) {
            return -1;
        }
    }

    // Return the y-position of the lowest chance to bet on
    short lowest[2] = {res[0], 0};
    for (short i = 1; i < 6; i++) {
        if (lowest[0] > res[i]) {
            lowest[0] = res[i];
            lowest[1] = i;
        }
    }

    return (short) yLocations[lowest[1]];
}

/**
 * Update winnings and winnings_all
 *
 * @param amount the amount to add
 */
void updateWinnings(int amount) {
    StaticLogger::debug("Updating winnings by " + std::to_string(amount));

    // If the amount to add is not zero add it to winnings and winnings_all
    if (amount != 0) {
        winnings += amount;
        winnings_all += amount;

        setAllMoneyMade(winnings_all);

        // If the amount is not negative count it as a won race
        if (amount > 0) {
            racesWon++;
        }
    } else {
        // Add a lost race
        racesLost++;
    }

    addMoney(amount);
}

/**
 * Get the winnings
 */
void getWinnings() {
    auto yCoord = (short) round(1060.0f * multiplierH);
    auto _height = (short) round(86.0f * multiplierH);
    auto xCoord = (short) round(1286.0f * multiplierW);
    auto _width = (short) round(304.0f * multiplierW);

    void *src = utils::TakeScreenShot(xPos, yPos, width, height);
    utils::bitmap *bmp = utils::crop(xCoord, yCoord, _width, _height, src);

    if (debug_full) {
        utils::bitmap *b = utils::convertHBitmap(width, height, src);
        debug::writeImage(b);
        debug::writeImage(bmp);
        delete b;
    }

    short res = tf::WinningsAI::predict(bmp->data, bmp->size);
    StaticLogger::debug("Winnings prediction: " + std::to_string(res));
    DeleteObject(src);
    delete bmp;

    // Update the winnings
    updateWinnings(1000 * (int) res);
}

/**
 * Skip this bet
 */
void skipBet(bool evalBettingPos) {
    StaticLogger::debug("Should not bet on this one, skipping...");
    std::this_thread::sleep_for(std::chrono::milliseconds(100));
    leftClick(633, 448);

    if (evalBettingPos) {
        StaticLogger::debug("Searching for increase bet (>) position");
        utils::windowSize ws;
        utils::getWindowSize(ws);
        int res = utils::findIncreaseBetButton(ws, multiplierH);
        if (res > 0) {
            StaticLogger::debug("Increase bet position found: " + std::to_string(res));
            bettingPos = res;
        }
    }

    std::this_thread::sleep_for(std::chrono::milliseconds(100));
    leftClick(1720, 1036);
}

/**
 * The main loop
 */
void mainLoop() {
    // Check if the game is running
    if (utils::isProcessRunning("GTA5.exe")) {
        StaticLogger::debug("GTA V running");
        setGtaVRunning(true);
        // Set the game's positions
        set_positions();
        utils::windowSize ws;
        bool justStarted = true;

        while (running) {
            // Take a screen shot
            void *src = utils::TakeScreenShot(xPos, yPos, width, height);
            // Get the position to bet on
            short pos = get_pos(src);
            DeleteObject(src);
            if (pos != -1) {
                if (!running) {
                    break;
                }
                place_bet(pos, justStarted && customBettingPos <= 1 && pArr->size <= 0);
                if (justStarted)
                    justStarted = false;
                // Updating winnings by -10000 because betting costs 100000
                updateWinnings(-10000);
                if (!running) {
                    break;
                }
                StaticLogger::debug("Sleeping for 36 seconds");
                std::this_thread::sleep_for(std::chrono::seconds(time_sleep / 2));
                if (!running) {
                    // Program is not running anymore, stop it
                    StaticLogger::debug(
                            "The script has been stopped, skipping after " + std::to_string(time_sleep / 2) +
                            " seconds...");
                    break;
                }
                std::this_thread::sleep_for(std::chrono::seconds((int) ceil((double) time_sleep / 2.0)));
                if (!running) {
                    break;
                }
                // Update the winnings and return to the betting screen
                getWinnings();
                reset();
                if (autostop::checkStopConditions()) {
                    break;
                }
            } else {
                skipBet(justStarted && customBettingPos <= 1 && pArr->size <= 0);
                if (justStarted)
                    justStarted = false;
                StaticLogger::debug("Sleeping for " + std::to_string(time_sleep) + " seconds");
                std::this_thread::sleep_for(std::chrono::seconds(time_sleep));
                reset();
            }

            // Check if the game is in focus
            bool foreground;
            errno_t err = utils::isForeground(foreground);
            if (err == 0) {
                if (!foreground) {
                    StaticLogger::debug("GTA V is not the currently focused window. Betting will be stopped");
                    ui_keycomb_stop();
                    running = false;
                    break;
                }
            } else {
                StaticLogger::warning("Could not get foreground window. Assuming GTA V is in foreground");
            }

            // Check if the game is still opened
            utils::getWindowSize(ws);
            if ((ws.width == 0 && ws.height == 0) || !utils::isProcessRunning("GTA5.exe")) {
                StaticLogger::debug("The game seems to be closed, stopping betting");
                ui_keycomb_stop();
                running = false;
            }
        }
        stopping = false;
        StaticLogger::debug("Betting is now paused");
    } else {
        // The Game is not running, tell it everyone and sleep some time
        StaticLogger::debug("GTA V not running");
        if (running && stopping) {
            stopping = false;
            running = false;
        }
        setGtaVRunning(false);
        std::this_thread::sleep_for(std::chrono::milliseconds(100));
    }
}

/**
 * Check if the betting has been stopped
 *
 * @return if the betting has been stopped
 */
bool stopped() {
    return !running && !stopping;
}

/**
 * start the betting
 */
void start_script() {
    StaticLogger::debug("Starting script");
    // Only start if it is not already running or stopping
    if (!running && !stopping) {
        StaticLogger::debug("Set running to true");
        ui_keycomb_start();
        running = true;
    }

    std::thread([] {
        while (!stopped()) {
            std::this_thread::sleep_for(std::chrono::seconds(1));
            time_running++;
        }
    }).detach();
}

/**
 * stop the betting
 */
void stop_script() {
    // Only stop if it is running and not stopping
    if (running && !stopping) {
        StaticLogger::debug("Waiting for main thread to finish");
        ui_keycomb_stop();
        running = false;
        stopping = true;
    }
}

// ui functions ===========================================

/**
 * Add a second to the time running
 * @deprecated cpp now handles this in a thread
 */
//void add_sec() {
//time_running++;
//}

void set_starting(bool val) {
    starting = val;
}

/**
 * open the web ui
 */
void open_website() {
    std::string addr = "http://";
    addr.append(getIP()).append(":8027");
    HINSTANCE hst = ShellExecuteA(nullptr, TEXT("open"), TEXT(addr.c_str()), nullptr, nullptr, 0);
    if (reinterpret_cast<intptr_t>(hst) <= 32) {
        StaticLogger::error("Unable to open Web page");
    } else {
        StaticLogger::debug("Opened website");
    }
}

// Web server functions ===================================
void js_start_script() {
    start_script();
}

void js_stop_script() {
    stop_script();
}

int get_races_won() {
    return racesWon;
}

int get_races_lost() {
    return racesLost;
}

int get_all_winnings() {
    return (int) winnings_all;
}

int get_current_winnings() {
    return winnings;
}

int get_time() {
    return (int) time_running;
}

bool get_gta_running() {
    return gtaVRunning;
}

int get_running() {
    if (running && !stopping) {  //running
        return 1;
    } else if (starting && !running && !stopping) { //starting
        return 2;
    } else if (!running && !stopping) { //stopped
        return -1;
    } else { //stopping
        return 0;
    }
}
// ========================================================

/**
 * listen for key combination presses
 */
void listenForKeycomb() {
    auto startStop = []() {
        if (!starting) {
            if (!running && !stopping) {
                if (!gtaVRunning) {
                    StaticLogger::debug(
                            "Tried to start the script while the game was not running, skipping this request");
                    return;
                }
                start_script();
            } else {
                stop_script();
            }
        } else {
            StaticLogger::debug(
                    "Keycomb to start was triggered, but the 'start' button was already pressed at this time, ignoring the event");
        }
    };

#ifdef AUTOBET_WINDOWS
    while (keyCombListen) {
        if (unsigned(GetKeyState(VK_SHIFT)) & unsigned(0x8000)) {
            if (unsigned(GetKeyState(VK_CONTROL)) & unsigned(0x8000)) {
                if (unsigned(GetKeyState(VK_F10)) & unsigned(0x8000)) {
                    startStop();
                    std::this_thread::sleep_for(std::chrono::milliseconds(1000));
                } else if (unsigned(GetKeyState(VK_F9)) & unsigned(0x8000)) {
                    break;
                }
            }
        }

        // Sleep for 50 milliseconds to reduce cpu usage
        std::this_thread::sleep_for(std::chrono::milliseconds(50));
    }
#endif

    // Kill the program if SHIFT+CTRL+F9 is pressed, this on activates if break on the loop is called
    // and keyCombListen is still true, if it is false, the program is about to stop already
    if (keyCombListen) {
        kill();
    }
}

/**
 * Perform AI self test
 */
void selfTestAI() {
    StaticLogger::debug("Performing AI self test");
    if (!tf::BettingAI::initialized()) {
        if (!tf::BettingAI::initAi()) {
#ifdef ASSERT_MEM_OK
            ASSERT_MEM_OK();
#endif //ASSERT_MEM_OK
            StaticLogger::error("Unable to initialize Betting AI");
            goto label1;
        }
    }

    tf::BettingAI::selfTest("data/1.png");

    label1:
    if (!tf::WinningsAI::initialized()) {
        if (!tf::WinningsAI::initAi()) {
            StaticLogger::error("Unable to initialize Winnings AI");
            return;
        }
    }

    short res = tf::WinningsAI::selfTest("data/40.png");
    StaticLogger::debug("Winnings AI self-test result (40): " + std::to_string(res));
}

/**
 * main function
 *
 * @param argc command line argument count
 * @param argv command kine arguments
 * @return exit code
 */
int main(int argc, char *argv<::>) <%
#ifndef NDEBUG
    LoggerMode lMode = MODE_CONSOLE;
#else
    LoggerMode lMode = MODE_NONE;
#endif //NDEBUG
    char *updateArgs = nullptr;
    bool debug, runUpdate, afterUpdate, headless, no_web_server, show_cmd, save_settings, run_configurator;
    bool store_config_json, load_config_json;

    // Development args, do not use
    bool signInstaller, checkSignature;
    {
        bool delete_settings;
        cmdParser p(22);

        p.addHeading("General options");
        p.addReplace('_', ':');
        p.addCommand(debug, "Show log in cmd and save log file");
        p.addCommand(debug_full, "Show log in cmd, save log file and some debugging images into a zip folder");
        p.addCommand(headless, "Run the program in headless mode (without UI)");

        p.addReplace('_', '-');
        p.addCommand(no_web_server, "Start without web server");
        p.addCommand(show_cmd, "Start and show the log (similar to --debug just without saving it)");

        p.addHeading("\nSettings");
        p._addCommand(customBettingPos,
                      "Set a custom increase bet (>) position (one-time value). Overwrites any other option.",
                      "set-custom-betting-pos");
        std::vector<int> cb;
        p._addCommand(cb, "Set increase bet (>) position templates for different game resolutions",
                      "set-betting-pos-template", " <gameWidth, pos>...");
        p.addCommand(time_sleep, "Set the sleep time during which the race is running");
        p.addCommand(clicks, "Set the number of clicks to place a bet (if not 10000$ are placed)");
        p.addCommand(run_configurator, "Run the configuration tool");
        p.addCommand(store_config_json, "Store a config file as json on the users Desktop");
        p.addCommand(load_config_json, "Load a json config file from the users Desktop");
        p.addCommand(save_settings, "Save the current settings given by the command line");
        p.addCommand(delete_settings, "Delete the settings file");

        p.addHeading("\nUpdate options (Do not use)");
        std::vector<std::string> uArgsV;
        p.addCommand(afterUpdate, "Clean up after update");
        p.addCommandCheckSet(runUpdate, uArgsV, "Run the update");

        p.addHeading("Development options (Do not use)");
        p.addCommand(signInstaller, "Sign a installer file");
        p.addCommand(checkSignature, "Check a signature");

        p.parse(argc, argv);

        if (cb.size() > 1) {
            if (cb.size() % 2 == 0) {
                std::map<int, int> m;
                for (int i = 0; i < cb.size(); i += 2) {
                    auto it = m.find(cb[i]);
                    if (it != m.end())
                        it->second = cb[i + 1];
                    else
                        m.insert(std::make_pair(cb[i], cb[i + 1]));
                    std::cout << "Added position conf width " << cb[i] << " and pos " << cb[i + 1] << std::endl;
                }
                pArr = new settings::posConfigArr(m);
            } else {
                std::cerr << "Cannot use values of set-betting-pos-template, number of args is not even" << std::endl;
            }
        }

        if (runUpdate && !uArgsV.empty()) {
            updateArgs = strdup(uArgsV[0].c_str());
        }

        if (delete_settings && utils::fileExists("autobet.conf")) {
            remove("autobet.conf");
        }
    }

    if (debug_full || debug) {
        lMode = MODE_BOTH;
    } else if (headless || run_configurator) {
        lMode = MODE_CONSOLE;
    }

    <%
        HWND consoleWnd = GetConsoleWindow();
        DWORD dwProcessId;
        GetWindowThreadProcessId(consoleWnd, &dwProcessId);

        if (!headless && !show_cmd && GetCurrentProcessId() == dwProcessId) {
            ::ShowWindow(::GetConsoleWindow(), SW_HIDE);
        }
    %>

    try {
        StaticLogger::create(lMode, LogLevel::debug, "out.log");
    } catch (std::bad_alloc &) {
        utils::displayError("Unable to create Logger", [] {
            exit(1);
        });
    }

    if (!pArr)
        pArr = new settings::posConfigArr();
    if (utils::fileExists("autobet.conf")) {
        StaticLogger::debug("Settings file exists. Loading it");
        unsigned int t, c;
        settings::load(t, c, pArr);
        if (time_sleep == 36)
            time_sleep = t;
        if (clicks == 31)
            clicks = c;
    }

    if (store_config_json) {
        StaticLogger::debug("Storing json to Desktop");
        settings::storeConfig(time_sleep, clicks, pArr);
        return 0;
    }

    if (load_config_json) {
        StaticLogger::debug("Loading json from Desktop");
        utils::path p;
        utils::getDesktopDirectory(p);
        if (utils::fileExists(p.toString() + "\\autobet_conf.json")) {
            settings::loadConfig(time_sleep, clicks, pArr);
            settings::save(time_sleep, clicks, pArr);
        } else {
            StaticLogger::error("JSON config file does not exist");
            kill(false);
            return 1;
        }
    }

    if (save_settings) {
        StaticLogger::debug("Saving settings");
        settings::save(time_sleep, clicks, pArr);
    }

    if (headless) {
        StaticLogger::debug("running in headless mode");
    }

    if (customBettingPos > 0) {
        StaticLogger::debug("Custom betting pos set to " + std::to_string(customBettingPos));
    }

    utils::setDpiAware();

    if (run_configurator) {
        std::map<int, int> map;
        settings::configure(map);
        settings::posConfigArr arr(map);
        settings::save(time_sleep, clicks, &arr);
        exit(0);
    }

    if (signInstaller) {
        if (utils::fileExists("autobet_installer.exe") && utils::fileExists("private.pem")) {
            StaticLogger::debug("Signing installer file");
            fileCrypt::signInstaller();
            return 0;
        } else {
            StaticLogger::error("'autobet_installer.exe' or 'private.pem' does not exist");
            return 1;
        }
    }

    if (checkSignature) {
        if (utils::fileExists("autobet_installer.exe") && utils::fileExists("autobet_installer.pem")) {
            StaticLogger::debug("Checking signature...");
            if (fileCrypt::verifySignature("autobet_installer.exe",
                                           fileCrypt::getFileContent("autobet_installer.pem"))) {
                StaticLogger::debug("Signature does match");
                return 0;
            } else {
                StaticLogger::warning("Signature does not match");
                return 1;
            }
        } else {
            StaticLogger::error("'autobet_installer.exe' or 'private.pem' does not exist");
            return 1;
        }
    }

    if (debug_full) {
        if (!debug::init()) {
            StaticLogger::error("Could not create debug folder. Cannot collect debug information");
        }
    }

    StaticLogger::debug("Logging enabled");
    StaticLogger::debugStream() << "Autobet version: " << AUTOBET_CURRENT_VERSION;

    char *version = nullptr;
    if (!runUpdate && !afterUpdate && updater::check(&version)) {
        StaticLogger::debug(std::string("A new version is available: ").append(version));

        if (updater::updateDownloaded()) {
            if (updater::checkSignature(version)) {
                updater::prepareUpdate();
            } else {
                updater::deleteUpdate();
                goto downloadUpdate;
            }
        } else {
            downloadUpdate:
            std::thread([version] {
                updater::download(version);
            }).detach();
        }
    }
    free(version);

    if (runUpdate && !afterUpdate) {
        updater::installUpdate(updateArgs);

        StaticLogger::destroy();
        return 0;
    }

    free(updateArgs);

    if (afterUpdate && !runUpdate) {
        updater::cleanup();
    }

    CppJsLib::setLogger([](const std::string &s) {
        StaticLogger::debug(s);
    });

    CppJsLib::setError([](const std::string &s) {
        StaticLogger::error(s);
    });

    utils::printSystemInformation();
    utils::setCtrlCHandler([] {
        StaticLogger::debug("Shutdown event hit. Shutting down");
        kill();
    });

    autostop::init(&winnings, &time_running);

#ifdef AUTOBET_WINDOWS
    StaticLogger::debug("Running on Windows");
#else
    StaticLogger::debug("Running on linux/mac os");
#endif //AUTOBET_WINDOWS

#ifndef NDEBUG
    StaticLogger::warning("Program was compiled in debug mode");
#endif //NDEBUG

    if (!utils::fileExists("data/betting.pb")) {
        StaticLogger::error("Could not initialize Betting AI: betting.pb not found");
        utils::displayError("Could not initialize Betting AI\nBetting.pb not found."
                            "\nReinstalling the program might fix this error", [] {
            exit(1);
        });
    }
#ifdef ASSERT_MEM_OK
    ASSERT_MEM_OK();
#endif //ASSERT_MEM_OK

    StaticLogger::debug("Initializing Betting AI");

    if (!tf::BettingAI::initAi()) {
#ifdef ASSERT_MEM_OK
        ASSERT_MEM_OK();
#endif //ASSERT_MEM_OK
        StaticLogger::error("Could not initialize Betting AI: Unable to allocate memory");
        utils::displayError("Could not initialize Betting AI\nNot enough memory", [] {
            exit(1);
        });
    } else if (tf::BettingAI::status::ok()) {
#ifdef ASSERT_MEM_OK
        ASSERT_MEM_OK();
#endif //ASSERT_MEM_OK
        StaticLogger::debug("Successfully initialized Betting AI");

        // Run the first prediction as it is painfully slow
        bt = new std::thread([] {
            StaticLogger::debug("Running first Betting AI prediction");
            void *src = utils::TakeScreenShot(0, 0, 100, 100);
            utils::bitmap *b = utils::crop(0, 0, 100, 100, src);
            DeleteObject(src);
            tf::BettingAI::predict(b->data, b->size);

            delete b;
            StaticLogger::debug("Done running first Betting AI prediction");
        });
    } else {
#ifdef ASSERT_MEM_OK
        ASSERT_MEM_OK();
#endif //ASSERT_MEM_OK
        std::string msg("Failed to initialize Betting AI. Error: ");
        msg.append(tf::BettingAI::status::getLastStatus());
        StaticLogger::error(msg);

        StaticLogger::debug("Deleting Betting AI");
        tf::BettingAI::deleteAi();
        StaticLogger::debug("Deleted Betting AI");

        utils::displayError("Could not initialize Betting AI\nCheck the log for further information", [] {
            exit(1);
        });
    }

    if (debug_full) {
        selfTestAI();
    }

    if (utils::fileExists("data/winnings.pb")) {
        StaticLogger::debug("Initializing Winnings AI");

        if (!tf::WinningsAI::initAi()) {
#ifdef ASSERT_MEM_OK
            ASSERT_MEM_OK();
#endif //ASSERT_MEM_OK
            StaticLogger::error("Could not initialize Winnings AI: Unable to allocate memory");
        } else if (tf::WinningsAI::status::ok()) {
#ifdef ASSERT_MEM_OK
            ASSERT_MEM_OK();
#endif //ASSERT_MEM_OK
            StaticLogger::debug("Successfully initialized Winnings AI");

            // Run the first prediction as it is painfully slow
            wt = new std::thread([] {
                StaticLogger::debug("Running first Winnings AI prediction");
                void *src = utils::TakeScreenShot(0, 0, 100, 100);
                utils::bitmap *b = utils::crop(0, 0, 100, 100, src);
                DeleteObject(src);
                tf::WinningsAI::predict(b->data, b->size);

                delete b;
                StaticLogger::debug("Done running first Winnings AI prediction");
            });
        } else {
#ifdef ASSERT_MEM_OK
            ASSERT_MEM_OK();
#endif //ASSERT_MEM_OK
            std::string msg("Failed to initialize Winnings AI. Error: ");
            msg.append(tf::WinningsAI::status::getLastStatus());
            StaticLogger::error(msg);

            StaticLogger::debug("Deleting Winnings AI");
            tf::WinningsAI::deleteAi();
            StaticLogger::debug("Deleted Winnings AI");
        }
    } else {
        StaticLogger::error("Could not initialize Winnings AI: winnings.pb does not exist");
    }
    keyCombListen = true;
    std::thread keyCombThread(listenForKeycomb);
    keyCombThread.detach();

#ifdef ASSERT_MEM_OK
    ASSERT_MEM_OK();
#endif //NDEBUG

    try {
#ifndef BUILD_CPPJSLIB
        CppJsLib::createWebGUI(ui, "ui");
#else
        ui = new CppJsLib::WebGUI("ui");
#endif //BUILD_CPPJSLIB
    } catch (std::bad_alloc &e) {
        StaticLogger::error(std::string("Unable to create instance of ui web server. Error: ").append(e.what()));
        utils::displayError("Could not initialize UI web server\n(Probably out of memory)", [] {
            exit(1);
        });
    }

    if (!no_web_server) {
        try {
#ifndef BUILD_CPPJSLIB
            CppJsLib::createWebGUI(webUi, "web");
#else
            webUi = new CppJsLib::WebGUI("web");
#endif //BUILD_CPPJSLIB
        } catch (std::bad_alloc &e) {
            StaticLogger::error("Unable to create instance of web ui web server. Error: " + std::string(e.what()));
            webUi = nullptr;
        }
    } else {
        StaticLogger::debug("Web ui was disabled per command-line argument, no starting the web server");
    }

#ifdef ASSERT_MEM_OK
    ASSERT_MEM_OK();
#endif //ASSERT_MEM_OK

    // Expose all functions needed for js
    ui->expose(kill);
    ui->expose(get_gta_running);
    ui->expose(loadWinnings);
    ui->expose(getIP);
    ui->expose(open_website);
    ui->expose(stopped);
    ui->expose(get_time);
    ui->expose(set_starting);
    ui->expose(js_start_script);
    ui->expose(js_stop_script);
    //ui->expose(add_sec);

    if (webUi) {
        webUi->expose(js_start_script);
        webUi->expose(js_stop_script);
        webUi->expose(get_races_won);
        webUi->expose(get_races_lost);
        webUi->expose(get_all_winnings);
        webUi->expose(get_current_winnings);
        webUi->expose(get_time);
        webUi->expose(get_gta_running);
        webUi->expose(get_running);
        webUi->expose(get_autostop_money);
        webUi->expose(get_autostop_time);
        webUi->expose(set_autostop_time);
        webUi->expose(set_autostop_money);
    } else {
        StaticLogger::warning("Not exposing any functions to web ui web server since it does not exist");
    }

    ui->import(set_gta_running);
    ui->import(ui_keycomb_start);
    ui->import(ui_keycomb_stop);
    ui->import(setAllMoneyMade);
    ui->import(addMoney);

    startWebServers();

#ifdef ASSERT_MEM_OK
    ASSERT_MEM_OK();
#endif //ASSERT_MEM_OK

    runLoops = true;

    std::function < void() > close_electron_func = []() {
        StaticLogger::debug("Electron was closed. Program should exit any minute");
        runLoops = false;
        running = false;
        std::thread closeThread([]() {
            std::this_thread::sleep_for(std::chrono::seconds(11));
            kill();
        });
        closeThread.detach();
    };

    ui->setWebSocketCloseHandler(close_electron_func);

    if (!headless) {
        // Start electron to display the UI
        electron = new utils::Application("electron-win32-x64/electron.exe");
        utils::startup(electron);

        // Add a check if electron runs to kill this program if electron is closed
        std::thread electronRunCheck([close_electron_func]() {
            while (runLoops) {
                if (!electron->isRunning()) {
                    return close_electron_func();
                }
                std::this_thread::sleep_for(std::chrono::seconds(1));
            }
        });

        electronRunCheck.detach();
    }

    while (runLoops) {
        mainLoop();
        for (int i = 0; i < 100; i++) {
            std::this_thread::sleep_for(std::chrono::milliseconds(100));
            if (running) {
                break;
            }
        }

    }

    kill(false);
    return 0;
%>
