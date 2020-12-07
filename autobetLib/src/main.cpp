#include "main.hpp"
#include "utils.hpp"
#include "debug.hpp"
#include "autostop.hpp"
#include "settings.hpp"
#include "autobetException.hpp"
#include "opencv_link/opencv_link.hpp"

#include <chrono>
#include <thread>
#include <cmath>
#include <future>
#include <fstream>
#include <algorithm>
#include <memory>

#ifdef AUTOBET_WINDOWS

#   include <windows.h>
#   include <shellapi.h>

#endif

#include <CppJsLib.hpp>
#include "logger.hpp"

#define NAPI_TOOLS_CALLBACK_SLEEP_TIME 100
#include "n_api/napi_tools.hpp"

using namespace logger;
using namespace napi_tools;

// Every location to a horse to bet on
const uint16_t yLocations[6] = {464, 628, 790, 952, 1114, 1276};

std::unique_ptr<CppJsLib::WebGUI> webUi = nullptr;
opencv_link::knn knn = nullptr;

uint16_t xPos = 0, yPos = 0, width = 0, height = 0, racesWon = 0, racesLost = 0;
int64_t winnings_all = 0L;
int winnings = 0;
bool gtaVRunning, running, stopping, starting, keyCombListen, runLoops;
bool debug_full = false, webServer = true;
float multiplierW, multiplierH;
uint32_t time_sleep = 36, time_running = 0;
bool bettingFunctionSet = false;

// Callbacks ==============================================

// A callback to set if gta is running
callbacks::callback<void(bool)> setGtaRunningCallback = nullptr;

// A callback to set all money made
callbacks::callback<void(int)> setAllMoneyMadeCallback = nullptr;

// A callback to add money made this session
callbacks::callback<void(int)> addMoneyCallback = nullptr;

// A callback so signal the betting has started
callbacks::callback<void()> uiKeycombStartCallback = nullptr;

// A callback to signal the betting has stopped
callbacks::callback<void()> uiKeycombStopCallback = nullptr;

// A callback to be called if an exception is thrown
// and the program is unable to continue
callbacks::callback<void()> exceptionCallback = nullptr;

// A callback to log to the fake console
callbacks::callback<void(std::string)> logCallback = nullptr;

// A callback with a custom betting function
callbacks::callback<int(std::vector<std::string>)> bettingPositionCallback = nullptr;

// EndCallbacks ===========================================

/**
 * Kill the program and close all connections
 *
 * @param _exit if exit() shall be called
 */
void kill(bool _exit = true) {
    if (setGtaRunningCallback) setGtaRunningCallback.stop();
    if (setAllMoneyMadeCallback) setAllMoneyMadeCallback.stop();
    if (addMoneyCallback) addMoneyCallback.stop();
    if (uiKeycombStartCallback) uiKeycombStartCallback.stop();
    if (uiKeycombStopCallback) uiKeycombStopCallback.stop();
    if (exceptionCallback) exceptionCallback.stop();
    if (logCallback) logCallback.stop();
    if (bettingPositionCallback) bettingPositionCallback.stop();

    // Set every possible bool to false
    keyCombListen = false;
    runLoops = false;
    running = false;

    // Stop the web servers, so they don't occupy the ports they use
    if (webUi) {
        if (!CppJsLib::util::stop(webUi.get(), true, 5)) {
            StaticLogger::warning("Could not stop web ui web server");
        } else {
            StaticLogger::debug("Stopped web ui web server");
        }

        webUi.reset();
    } else {
        StaticLogger::warning("Could not stop web ui web server");
    }

    // Delete the AI
    StaticLogger::debug("Deleting ai");
    knn.reset();
    StaticLogger::debug("Deleted ai");

    // Sleep
    std::this_thread::sleep_for(std::chrono::milliseconds(50));

    // Delete the logger so it closes the file stream, if open
    StaticLogger::destroy();

    if (debug_full) {
        StaticLogger::create(LoggerMode::MODE_FILE, LogLevel::debug, "autobet_debug.log", "wt");
        debug::finish();
        StaticLogger::destroy();
    }

    if (_exit) {
        exit(0);
    }
}

std::function<void()> quit = {};

/**
 * Write winnings_all to winnings.dat
 */
void writeWinnings() {
    StaticLogger::debug("Writing winnings");
    std::ofstream ofs("winnings.dat", std::ios::out | std::ios::binary);
    if (!ofs.good()) {
        StaticLogger::error("Unable to open winnings file. Flags: " + std::to_string(ofs.flags()));
        return;
    }

    ofs.write((char *) &winnings_all, sizeof(__int64));
    if (ofs.fail()) {
        StaticLogger::warning("Winnings file stream fail bit was set, this is not good");
    }
    ofs.flush();

    ofs.close();
    if (ofs.is_open()) {
        StaticLogger::error("Unable to close winnings file");
    } else {
        StaticLogger::debug("Wrote winnings");
    }
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
    StaticLogger::debugStream() << "Got positions: {x: " << xPos << ", y: " << yPos << ", w: " << width << ", h: " << height << "}";

    utils::windowSize screenSize;
    utils::getActiveScreen(xPos + (width / 2), yPos + (height / 2), screenSize);

    StaticLogger::debugStream() << "Got active screen width: " << screenSize.width << " and height: " << screenSize.height;

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
void place_bet(int y) {
    StaticLogger::debug("Placing bet");
    leftClick(634, y);
    std::this_thread::sleep_for(std::chrono::milliseconds(100));

    // 25/08/2020: Today I found out, you could just press tab to place a max bet. Now, that I have invested
    // many hours into setting positions for the 'increase bet' button, this is not very nice. I've even used
    // vXbox to simulate a xBox controller, which is now completely useless. I will not include this fact in any
    // changelog or commit message, this is the only place where anyone can find this shit. If you just found it:
    // good for you, keep it a secret, I don't want anyone to know how dumb I really am. Have a nice day.
    // I am definitely not having a nice day at this point. F*ck.
    if (!utils::pressTab()) {
        StaticLogger::error("Could not press the tab key");
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
 * Set the GTA V running variable in C++ and JS
 *
 * @param val the new value
 */
void setGtaVRunning(bool val) {
    gtaVRunning = val;
    setGtaRunningCallback(val);
}

short getBasicBettingPosition(const std::vector<std::string> &odds) {
    // Results to fill in, every number in the array can be between 1 and 10,
    // 1 represents evens, 2 represents 2/1 etc. 10 represents 10/1 and lower
    short res[6] = {-1, -1, -1, -1, -1, -1};
    for (unsigned short i = 0; i < 6; i++) {
        // Get the odd as a short
        const short b_res = opencv_link::knn::oddToShort(odds[i]);

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
 * Get the position of the horse to bet on
 *
 * @param src the source HBITMAP as a void pointer because <windows.h> throws errors
 * @return the y-coordinate to click or -1 if this one should be skipped
 */
short get_pos(void *src) {
    // Write the src to the debug zip folder
    if (debug_full) {
        utils::bitmap bmp = utils::convertHBitmap(width, height, src);
        debug::writeImage(bmp);
    }

    std::vector<std::string> odds(6);
    unsigned short yCoord, xCoord, _width, _height;
    for (int i = 0; i < 6; i++) {
        yCoord = (int) round((float) yLocations[i] * multiplierH);
        _height = (int) round((float) 46 * multiplierH);
        xCoord = (int) round(240 * multiplierW);
        _width = (int) round(110 * multiplierW);

        // Crop the screenshot
        utils::bitmap b = utils::crop(xCoord, yCoord, _width, _height, src);

        // Write bitmap object to debug zip folder
        if (debug_full) {
            debug::writeImage(b);
        }

        odds[i] = knn.predict(b, multiplierW, multiplierH);
        if (!opencv_link::knn::isOdd(odds[i])) {
            StaticLogger::errorStream() << "Knn did not return an odd: " << odds[i];
            throw autobetException("Knn did not return an odd");
        } else {
            StaticLogger::debugStream() << "Odd prediction: " << odds[i];
        }
    }

    if (bettingFunctionSet) {
        // Call the bettingPositionCallback
        std::promise<int> promise = bettingPositionCallback(odds);
        std::future<int> future = promise.get_future();

        // Wait for max 10 seconds
        std::future_status status = future.wait_for(std::chrono::seconds(10));

        // Check if the result is ready, if so, use it
        if (status == std::future_status::ready) {
            const int res = future.get();
            StaticLogger::debugStream() << "The custom betting function returned: " << res;

            if (res < -1) {
                StaticLogger::warning("The custom betting function returned a result < -1, falling back to the default implementation");
                return getBasicBettingPosition(odds);
            } else {
                // Return the yLocation at res
                return yLocations[res];
            }
        } else {
            StaticLogger::warning("The custom betting function did not finish within 10 seconds, falling back to the default function");
            return getBasicBettingPosition(odds);
        }
    } else {
        return getBasicBettingPosition(odds);
    }
}

/**
 * Update winnings and winnings_all
 *
 * @param amount the amount to add
 */
void updateWinnings(int amount) {
    StaticLogger::debugStream() << "Updating winnings by " << amount;

    // If the amount to add is not zero add it to winnings and winnings_all
    if (amount != 0) {
        winnings += amount;
        winnings_all += amount;

        setAllMoneyMadeCallback(winnings_all);
        writeWinnings();

        // If the amount is not negative count it as a won race
        if (amount > 0) {
            racesWon++;
        }
    } else {
        // Add a lost race
        racesLost++;
    }

    addMoneyCallback(amount);
}

/**
 * Get the winnings
 */
void getWinnings() {
    auto yCoord = (short) round(1060.0f * multiplierH);
    auto _height = (short) round(86.0f * multiplierH);
    auto xCoord = (short) round(1286.0f * multiplierW);
    auto _width = (short) round(304.0f * multiplierW);

    // Take a screenshot and crop the image
    void *src = utils::TakeScreenShot(xPos, yPos, width, height);
    utils::bitmap bmp = utils::crop(xCoord, yCoord, _width, _height, src);

    if (debug_full) {
        utils::bitmap b = utils::convertHBitmap(width, height, src);
        debug::writeImage(b);
        debug::writeImage(bmp);
    }

    // Delete the original screenshot
    DeleteObject(src);

    // Get the prediction and check if its legit
    const std::string pred = knn.predict(bmp, multiplierW, multiplierH);
    if (!opencv_link::knn::isWinning(pred)) {
        StaticLogger::errorStream() << "The knn prediction was not a winning: " << pred;
        return;
    }

    // Convert the prediction to an integer
    const int res = opencv_link::knn::winningToInt(pred);
    StaticLogger::debugStream() << "Winnings prediction: " << res;

    // Update the winnings
    updateWinnings(1000 * res);
}

/**
 * Skip this bet
 */
void skipBet() {
    StaticLogger::debug("Should not bet on this one, skipping...");
    std::this_thread::sleep_for(std::chrono::milliseconds(100));
    leftClick(633, 448);

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
                place_bet(pos);
                StaticLogger::debugStream() << "Running: " << std::boolalpha << running;
                if (!running) continue;
                // Updating winnings by -10000 since betting costs 100000
                updateWinnings(-10000);
                if (!running) {
                    continue;
                }
                StaticLogger::debugStream() << "Sleeping for " << time_sleep << " seconds";
                std::this_thread::sleep_for(std::chrono::seconds(time_sleep / 2));
                if (!running) {
                    // Program is not running anymore, stop it
                    StaticLogger::debugStream() << "The script has been stopped, skipping after " << (time_sleep / 2) << " seconds...";
                    continue;
                }

                std::this_thread::sleep_for(std::chrono::seconds((int) ceil((double) time_sleep / 2.0)));
                if (!running) {
                    continue;
                }

                StaticLogger::debug("Getting winnings");
                // Update the winnings and return to the betting screen
                getWinnings();
                reset();
                if (autostop::checkStopConditions()) {
                    running = false;
                    continue;
                }
            } else {
                // Should not bet, skip
                skipBet();
                StaticLogger::debugStream() << "Sleeping for " << time_sleep << " seconds";
                std::this_thread::sleep_for(std::chrono::seconds(time_sleep));
                reset();
            }

            // Check if the game is in focus
            bool foreground;
            errno_t err = utils::isForeground(foreground);
            if (err == 0) {
                if (!foreground) {
                    StaticLogger::debug("GTA V is not the currently focused window. Betting will be stopped");
                    uiKeycombStopCallback();
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
                uiKeycombStopCallback();
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
 * Start the betting
 */
void start_script() {
    StaticLogger::debug("Starting script");
    // Only start if it is not already running or stopping
    if (!running && !stopping) {
        StaticLogger::debug("Set running to true");
        uiKeycombStartCallback();
        running = true;
    }

    // Count the time running
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
        uiKeycombStopCallback();
        running = false;
        stopping = true;
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

// ======= node functions =================================

/**
 * Get the time the betting is running
 */
Napi::Number node_get_time(const Napi::CallbackInfo &info) {
    return Napi::Number::New(info.Env(), (double) time_running);
}

/**
 * Get if gta is running
 */
Napi::Boolean node_get_gta_running(const Napi::CallbackInfo &info) {
    return Napi::Boolean::New(info.Env(), gtaVRunning);
}

/**
 * Start the betting from node.js
 */
void node_js_start_script(const Napi::CallbackInfo &info) {
    start_script();
}

/**
 * Stop the betting from node.js
 */
void node_js_stop_script(const Napi::CallbackInfo &info) {
    stop_script();
}

/**
 * Set if the start button was pressed in the ui
 */
void set_starting(const Napi::CallbackInfo &info) {
    CHECK_ARGS(napi_tools::napi_type::boolean);
    starting = info[0].ToBoolean();
}

/**
 * Load winnings_all from binary file winnings.dat
 */
Napi::Promise loadWinnings(const Napi::CallbackInfo &info) {
    return promises::promise<void>(info.Env(), [] {
        StaticLogger::debug("Loading winnings from file");

        // If the file does not exist, write a new one
        if (!utils::fileExists("winnings.dat")) {
            StaticLogger::debug("Winnings file does not exist, creating it");
            writeWinnings:
            winnings_all = 0;
            writeWinnings();
            return;
        }

        // Initialize the ifstream
        std::ifstream ifs("winnings.dat", std::ios::in | std::ios::binary);
        if (!ifs.good()) {
            StaticLogger::error("Unable to open winnings file. Flags: " + std::to_string(ifs.flags()));
            goto writeWinnings;
        }

        // Read the file
        ifs.read((char *) &winnings_all, sizeof(__int64));
        if (ifs.fail()) {
            StaticLogger::warning("File stream fail bit was set, rewriting file");
            goto writeWinnings;
        }

        if (ifs.eof()) {
            StaticLogger::warning("Winnings file end has been reached, rewriting file");
            goto writeWinnings;
        }

        // Finish up
        ifs.close();

        if (ifs.is_open()) {
            StaticLogger::error("Unable to close winnings file");
        }

        StaticLogger::debugStream() << "Read winnings: " << winnings_all;
        setAllMoneyMadeCallback(winnings_all);
    });
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
 * Get the IP address of this machine from the node process
 */
Napi::String node_getIP(const Napi::CallbackInfo &info) {
    return Napi::String::New(info.Env(), getIP());
}

/**
 * Open the web ui
 */
void open_website(const Napi::CallbackInfo &) {
    std::string addr = "http://";
    addr.append(getIP()).append(":8027");
    HINSTANCE hst = ShellExecuteA(nullptr, TEXT("open"), TEXT(addr.c_str()), nullptr, nullptr, 0);
    if (reinterpret_cast<intptr_t>(hst) <= 32) {
        StaticLogger::error("Unable to open Web page");
    } else {
        StaticLogger::debug("Opened website");
    }
}

Napi::Boolean node_stopped(const Napi::CallbackInfo &info) {
    return Napi::Boolean::New(info.Env(), stopped());
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

#pragma message(TODO(Maybe add custom key combinations))
#ifdef AUTOBET_WINDOWS
#   pragma message("INFO: Building on windows")
    while (keyCombListen) {
        // If SHIFT+CTRL+F9 is pressed, start/stop, if SHIFT+CTRL+F10 is pressed, quit
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
        quit();
    }
}

/**
 * Try to start the web ui
 * 
 * @return true, if the operation was successful
 */
bool startWebUi() {
    try {
        // Set the base directory to the appropriate directory
        // depending on whether the program is packed or not
        std::string base_dir;
        if (utils::fileExists("web")) {
            base_dir = "web";
        } else if (utils::fileExists("resources/web")) {
            base_dir = "resources/web";
        } else {
            StaticLogger::error("No web folder was found. Unable to start web ui web server");
            return false;
        }

        webUi = std::make_unique<CppJsLib::WebGUI>(base_dir);
    } catch (std::bad_alloc &e) {
        // This should not happen on a modern system
        StaticLogger::errorStream() << "Unable to create instance of web ui web server. Error: " << e.what();
        webUi.reset();
        return false;
    }

    StaticLogger::debug("Exposing functions to the webUi");

    // Expose a lot of functions
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

    StaticLogger::debug("Starting web ui web server");

    // We're building with websocket protocol support by default.
    // This may only be disabled when boost is not installed
    // or the BOOST_ROOT environment variable is not set.
#ifdef CPPJSLIB_ENABLE_WEBSOCKET
#   pragma message("INFO: Building with websocket support")
    StaticLogger::debug("Starting with websocket enabled");
    bool res = webUi->start(8027, 8028, getIP(), false);
#else
#   pragma message("INFO: Building without websocket support")
    StaticLogger::debug("Starting with websocket disabled");
    bool res = webUi->start(8027, getIP(), false);
#endif // CPPJSLIB_ENABLE_WEBSOCKET

    // Check the result, if it is set to true, everything is ok
    if (res) {
        StaticLogger::debug("Successfully started webUi");
        return true;
    } else {
        StaticLogger::warning("Could not start webUi");
        webUi.reset();
        return false;
    }
}

/**
 * Initialize autobet
 */
Napi::Promise init(const Napi::CallbackInfo &info) {
    return promises::promise<bool>(info.Env(), [] {
        // Delete the log if it is was last written more than 7 days ago
        bool log_deleted = debug::checkLogAge();
        try {
            StaticLogger::create();
        } catch (std::bad_alloc &) {
            utils::displayError("Unable to create Logger", [] {
                exceptionCallback();
            });
            return false;
        }

        // Read the config if it exists
        if (utils::fileExists("autobet.conf")) {
            StaticLogger::debug("Settings file exists. Loading it");
            bool debug, log;
            settings::load(debug, log, webServer, time_sleep);
            logger::setLogToFile(debug);
            logger::setLogToConsole(log);
        }

        // Log the current version
        StaticLogger::debugStream() << "Initializing Autobet version " << AUTOBET_VERSION;

        if (log_deleted) {
            StaticLogger::debug("The last log file was deleted since it is older than 7 days");
        }

        utils::setDpiAware();

        // Set CppJsLib loggers
        CppJsLib::setLogger([](const std::string &s) {
            StaticLogger::debug(s);
        });

        CppJsLib::setError([](const std::string &s) {
            StaticLogger::error(s);
        });

        // Print some system information
        utils::printSystemInformation();
        utils::setCtrlCHandler([] {
            StaticLogger::debug("Shutdown event hit. Shutting down");
            quit();
        });

        // Init autostop
        autostop::init(&winnings, &time_running);

#ifndef NDEBUG
#       pragma message("INFO: Building in debug mode")
        StaticLogger::warning("Program was compiled in debug mode");
#else
#       pragma message("INFO: Building in release mode")
#endif //NDEBUG
        // Check if model.yml exists
        if (!utils::fileExists("resources/data/model.yml")) {
            StaticLogger::error("Could not initialize AI: model.yml not found");
            utils::displayError("Could not initialize AI\nmodel.yml not found."
                                "\nReinstalling the program might fix this error", [] {
                exceptionCallback();
            });
            return false;
        }

        StaticLogger::debug("Initializing AI");
        StaticLogger::debugStream() << "The knn was compiled using opencv version " << opencv_link::getOpenCvVersion();

        // Try to initialize the knn
        try {
            knn = opencv_link::knn("resources/data/model.yml");
        } catch (std::bad_alloc &e) {
            StaticLogger::error("Could not initialize AI: Unable to allocate memory");
            utils::displayError("Could not initialize AI\nNot enough memory", [] {
                exceptionCallback();
            });
            return false;
        } catch (...) {
            StaticLogger::error("Could not initialize AI: Unknown error");
            utils::displayError("Could not initialize AI\nUnknown error", [] {
                exceptionCallback();
            });
            return false;
        }

        StaticLogger::debug("Successfully initialized AI");

        keyCombListen = true;
        std::thread keyCombThread(listenForKeycomb);
        keyCombThread.detach();

        return true;
    });
}

/**
 * Start the main loop
 */
Napi::Promise start(const Napi::CallbackInfo &info) {
    // This promise will probably never resolve
    return promises::promise<void>(info.Env(), [] {
        runLoops = true;

        while (runLoops) {
            try {
                mainLoop();
            } catch (autobetException &e) {
                exceptionCallback();
                utils::displayError(e.what(), [] {
                    quit();
                });
            }

            // Sleep until the betting is started.
            // Will still call the mainLoop() every 10 seconds
            // to see if the game is running
            for (int i = 0; i < 100; i++) {
                std::this_thread::sleep_for(std::chrono::milliseconds(100));
                if (running) {
                    break;
                }
            }
        }
    });
}

/**
 * Quit.
 */
void node_quit() {
    quit();
}

/**
 * Log to the node process.
 * Used to log to the fake console in the ui.
 */
[[maybe_unused]] void node_log(const std::string &val) {
    if (logCallback) logCallback(val);
}

/**
 * Stop the autobet native module
 */
Napi::Promise stop(const Napi::CallbackInfo &info) {
    return promises::promise<void>(info.Env(), [] {
        kill(false);
    });
}

// Set callbacks ==========================================

/**
 * Set the setGtaRunningCallback, which is called every time
 * the running state of the game changes
 */
Napi::Promise setSet_gta_running(const Napi::CallbackInfo &info) {
    if (setGtaRunningCallback) throw Napi::Error::New(info.Env(), "setGtaRunningCallback is already defined");
    TRY
        setGtaRunningCallback = callbacks::callback<void(bool)>(info);

        return setGtaRunningCallback.getPromise();
    CATCH_EXCEPTIONS
}

/**
 * Set the addMoneyCallback, which is called every time
 * some money is made or lost
 */
Napi::Promise setAddMoneyCallback(const Napi::CallbackInfo &info) {
    if (addMoneyCallback) throw Napi::Error::New(info.Env(), "addMoneyCallback is already defined");
    TRY
        addMoneyCallback = callbacks::callback<void(int)>(info);

        return addMoneyCallback.getPromise();
    CATCH_EXCEPTIONS
}

/**
 * Set the setAllMoneyMadeCallback, which is called every
 * time the overall money made value is changed
 */
Napi::Promise setSetAllMoneyMadeCallback(const Napi::CallbackInfo &info) {
    if (setAllMoneyMadeCallback) throw Napi::Error::New(info.Env(), "setAllMoneyMadeCallback is already defined");
    TRY
        setAllMoneyMadeCallback = callbacks::callback<void(int)>(info);

        return setAllMoneyMadeCallback.getPromise();
    CATCH_EXCEPTIONS
}

/**
 * Set the uiKeycombStartCallback, which is called every time
 * the betting is started using a key combination
 */
Napi::Promise setUiKeycombStartCallback(const Napi::CallbackInfo &info) {
    if (uiKeycombStartCallback) throw Napi::Error::New(info.Env(), "uiKeycombStartCallback is already defined");
    TRY
        uiKeycombStartCallback = callbacks::callback<void()>(info);

        return uiKeycombStartCallback.getPromise();
    CATCH_EXCEPTIONS
}

/**
 * Set the uiKeycombStopCallback, which is called every time
 * the betting is stopped using a key combination
 */
Napi::Promise setUiKeycombStopCallback(const Napi::CallbackInfo &info) {
    if (uiKeycombStopCallback) throw Napi::Error::New(info.Env(), "uiKeycombStopCallback is already defined");
    TRY
        uiKeycombStopCallback = callbacks::callback<void()>(info);

        return uiKeycombStopCallback.getPromise();
    CATCH_EXCEPTIONS
}

/**
 * Set the quit callback, which is used to quit the program
 */
void setQuitCallback(const Napi::CallbackInfo &info) {
    TRY
        callbacks::callback<void()> q(info);
        quit = [&q] {
            kill(false);
            std::this_thread::sleep_for(std::chrono::milliseconds(100));
            q();
        };
    CATCH_EXCEPTIONS
}

/**
 * Set the exception callback
 */
Napi::Promise setExceptionCallback(const Napi::CallbackInfo &info) {
    if (exceptionCallback) throw Napi::Error::New(info.Env(), "exceptionCallback is already defined");
    TRY
        exceptionCallback = callbacks::callback<void()>(info);

        return exceptionCallback.getPromise();
    CATCH_EXCEPTIONS
}

/**
 * Set the log callback, which is used to log to the fake console
 */
Napi::Promise setLogCallback(const Napi::CallbackInfo &info) {
    if (logCallback) throw Napi::Error::New(info.Env(), "logCallback is already defined");
    TRY
        logCallback = callbacks::callback<void(std::string)>(info);

        return logCallback.getPromise();
    CATCH_EXCEPTIONS
}

/**
 * Set the bettingPositionCallback, which is used
 * to get the horse to bet on, if a custom betting function is defined
 */
Napi::Promise setBettingPositionCallback(const Napi::CallbackInfo &info) {
    if (bettingPositionCallback) throw Napi::Error::New(info.Env(), "bettingPositionCallback is already defined");
    TRY
        bettingPositionCallback = callbacks::callback<int(std::vector<std::string>)>(info);

        return bettingPositionCallback.getPromise();
    CATCH_EXCEPTIONS
}

/**
 * Set whether to use a custom betting function
 */
void setUseBettingFunction(const Napi::CallbackInfo &info) {
    CHECK_ARGS(napi_tools::napi_type::boolean);
    bettingFunctionSet = info[0].ToBoolean();
}

/**
 * Quit from n-api
 */
void napi_quit(const Napi::CallbackInfo &) {
    quit();
}

/**
 * Set whether to log to a file
 */
void node_setLogToFile(const Napi::CallbackInfo &info) {
    CHECK_ARGS(napi_tools::napi_type::boolean);
    logger::setLogToFile(info[0].ToBoolean());
}

/**
 * Check if the program is logging to a file
 */
Napi::Boolean node_logToFile(const Napi::CallbackInfo &info) {
    return Napi::Boolean::New(info.Env(), logger::logToFile());
}

/**
 * Set whether to log to the fake console in the ui
 */
void node_setLogToConsole(const Napi::CallbackInfo &info) {
    CHECK_ARGS(napi_tools::napi_type::boolean);
    logger::setLogToConsole(info[0].ToBoolean());
}

/**
 * Check if the program is logging to the fake console in th ui
 */
Napi::Boolean node_logToConsole(const Napi::CallbackInfo &info) {
    return Napi::Boolean::New(info.Env(), logger::logToConsole());
}

/**
 * Set debugging with images and more information
 */
Napi::Promise setDebugFull(const Napi::CallbackInfo &info) {
    CHECK_ARGS(napi_tools::napi_type::boolean);
    // If set_debug_full is set to true, full debug should be enabled
    bool set_debug_full = info[0].ToBoolean();
    return promises::promise<bool>(info.Env(), [set_debug_full] {
        if (set_debug_full) {
            // Check if debug_full is not already set, if not init debugging
            if (!debug_full) {
                if (!debug::init()) {
                    StaticLogger::error("Could not create debug folder. Cannot collect debug information");
                    return false;
                }
                debug_full = true;
            }
            return true;
        } else {
            // Only destroy if debug_full is already running
            if (debug_full) {
                // In order to finish the logging and write the log file to the zip,
                // the current logger must be destroyed, to write all data to the
                // log file and copy it to the zip. Another logger instance is created
                // during the copy process to log potential errors during this operation
                StaticLogger::debug("Destroying logger in order to write log to debug zip");
                StaticLogger::destroy();
                StaticLogger::create(LoggerMode::MODE_FILE, LogLevel::debug, "autobet_debug.log", "wt");
                debug::finish();
                StaticLogger::destroy();
                StaticLogger::create();
                debug_full = false;
            }
            return true;
        }
    });
}

/**
 * Start the web server
 */
Napi::Promise setWebServer(const Napi::CallbackInfo &info) {
    CHECK_ARGS(napi_tools::napi_type::boolean);
    // If start_web_server is set to true, the web server should be started
    bool start_web_server = info[0].ToBoolean();
    return promises::promise<bool>(info.Env(), [start_web_server] {
        if (start_web_server) {
            // Try to start the web ui
            webServer = true;
            if (!webUi) {
                // If web ui isn't already started, start it
                return startWebUi();
            } else {
                // The web server already exists
                StaticLogger::warning("Tried to start webUi server, but it already is running");
                return false;
            }
        } else {
            webServer = false;
            if (webUi) {
                // Try to stop the web server
                if (!CppJsLib::util::stop(webUi.get(), true, 5)) {
                    StaticLogger::warning("Could not stop web ui web server");
                } else {
                    StaticLogger::debug("Stopped web ui web server");
                }

                // Delete the instance from existence
                webUi.reset();
                return true;
            } else {
                StaticLogger::warning("Tried to stop webUi server, but it does not exist");
                return false;
            }
        }
    });
}

/**
 * Start the web server
 */
Napi::Promise startWebServer(const Napi::CallbackInfo &info) {
    return promises::promise<bool>(info.Env(), [] {
        if (webServer) {
            StaticLogger::debug("Trying to start web ui");
            if (startWebUi()) {
                StaticLogger::debug("Web ui started");
                return true;
            } else {
                StaticLogger::warning("Web ui could not be started");
                return false;
            }
        } else {
            // Tried to start the web server when it was not enabled. Weird.
            StaticLogger::warning("Web ui was disabled, not starting the web server");
            return false;
        }
    });
}

Napi::Boolean node_getWebServer(const Napi::CallbackInfo &info) {
    return Napi::Boolean::New(info.Env(), webServer);
}

/**
 * Check if the web server is running
 */
Napi::Boolean webServerRunning(const Napi::CallbackInfo &info) {
    if (webUi) {
        return Napi::Boolean::New(info.Env(), webUi->isRunning());
    } else {
        return Napi::Boolean::New(info.Env(), false);
    }
}

/**
 * Set the time to sleep between bets
 */
void setTimeSleep(const Napi::CallbackInfo &info) {
    CHECK_ARGS(napi_tools::napi_type::number);
    time_sleep = info[0].ToNumber().operator unsigned int();
}

/**
 * Get the time to sleep between bets
 */
Napi::Number getTimeSleep(const Napi::CallbackInfo &info) {
    return Napi::Number::New(info.Env(), time_sleep);
}

/**
 * Save the settings
 */
Napi::Promise saveSettings(const Napi::CallbackInfo &info) {
    return promises::promise<void>(info.Env(), [] {
        settings::save(logger::logToFile(), logger::logToConsole(), webServer, time_sleep);
    });
}

/**
 * A class for storing a file, line and message to log from node
 */
class file_line_message {
public:
    /**
     * Create a file_line_message
     * 
     * @param info to CallbackInfo to convert
     */
    explicit file_line_message(const Napi::CallbackInfo &info) {
        // Allow undefined for the first two args, string for the last one
        CHECK_ARGS(undefined | string, undefined | number, string);
        if (info[0].IsUndefined() || info[1].IsUndefined()) {
            file = "unknown";
            line = 0;
        } else {
            // In this case, only accept string, number and string
            CHECK_ARGS(string, number, string);
            file = info[0].ToString();
            line = info[1].ToNumber();
        }

        message = info[2].ToString();
    }

    std::string file;
    int line;
    std::string message;
};

/**
 * Print a debug message from node.js
 */
Napi::Value node_debug(const Napi::CallbackInfo &info) {
    if (!logger::logToFile() && !logger::logToConsole())
        return info.Env().Undefined();
    file_line_message dt(info);

    return promises::promise<void>(info.Env(), [&dt] {
        StaticLogger::_debug(dt.file.c_str(), dt.line, dt.message);
    });
}

/**
 * Print a warning message from node.js
 */
Napi::Value node_warn(const Napi::CallbackInfo &info) {
    if (!logger::logToFile() && !logger::logToConsole())
        return info.Env().Undefined();
    file_line_message dt(info);

    return promises::promise<void>(info.Env(), [&dt] {
        StaticLogger::_warning(dt.file.c_str(), dt.line, dt.message);
    });
}

/**
 * Print an error message from node.js
 */
Napi::Value node_error(const Napi::CallbackInfo &info) {
    if (!logger::logToFile() && !logger::logToConsole())
        return info.Env().Undefined();
    file_line_message dt(info);

    return promises::promise<void>(info.Env(), [&dt] {
        StaticLogger::_error(dt.file.c_str(), dt.line, dt.message);
    });
}

#define export(func) exports.Set(std::string("lib_") + #func, Napi::Function::New(env, func))

/**
 * Export all functions
 */
Napi::Object InitAll(Napi::Env env, Napi::Object exports) {
    export(init);
    export(start);
    export(stop);

    export(node_get_gta_running);
    export(loadWinnings);
    export(node_getIP);
    export(open_website);
    export(node_stopped);
    export(node_get_time);
    export(set_starting);
    export(node_js_start_script);
    export(node_js_stop_script);

    export(setSet_gta_running);
    export(setAddMoneyCallback);
    export(setSetAllMoneyMadeCallback);
    export(setUiKeycombStartCallback);
    export(setUiKeycombStopCallback);
    export(setQuitCallback);
    export(setExceptionCallback);
    export(setLogCallback);
    export(setBettingPositionCallback);

    export(napi_quit);

    export(node_logToFile);
    export(node_setLogToFile);
    export(node_logToConsole);
    export(node_setLogToConsole);

    export(setDebugFull);
    export(setWebServer);
    export(startWebServer);
    export(node_getWebServer);
    export(webServerRunning);
    export(setTimeSleep);
    export(getTimeSleep);
    export(saveSettings);
    export(setUseBettingFunction);

    export(node_debug);
    export(node_warn);
    export(node_error);

    try {
        quit = [] {
            kill(true);
        };
    } catch (std::exception &e) {
        throw Napi::Error::New(env, e.what());
    } catch (...) {
        throw Napi::Error::New(env, "An unknown exception occurred");
    }

    return exports;
}

NODE_API_MODULE(autobetLib, InitAll)