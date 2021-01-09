#include <chrono>
#include <thread>
#include <cmath>
#include <future>
#include <fstream>
#include <memory>
#include <Windows.h>

#include "main.hpp"
#include "util/utils.hpp"
#include "debug/debug.hpp"
#include "autostop.hpp"
#include "autobetException.hpp"
#include "opencv_link.hpp"
#include "variables.hpp"
#include "webui.hpp"
#include "napi_exported.hpp"
#include "control.hpp"
#include "betting.hpp"
#include "logger.hpp"

using namespace logger;

// Every location to a horse to bet on.
// These also double as the upper y-location of the image
// to crop to extract the odd of the horse
const uint16_t yLocations[6] = {452, 616, 778, 940, 1102, 1264};

int32_t xPos = 0, yPos = 0, width = 0, height = 0, racesWon = 0, racesLost = 0;
float multiplierW, multiplierH;

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
    StaticLogger::debugStream() << "Got positions: {x: " << xPos << ", y: " << yPos << ", w: " << width << ", h: "
                                << height << "}";

    utils::windowSize screenSize;
    utils::getActiveScreen(xPos + (width / 2), yPos + (height / 2), screenSize);

    StaticLogger::debugStream() << "Got active screen width: " << screenSize.width << " and height: "
                                << screenSize.height;

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
    if (variables::runLoops) {
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
    try {
        // Only tell the web listeners changes, not stuff they already know
        if (val != variables::gtaVRunning) webui::setGtaRunning(val);

        variables::gtaVRunning = val;
        napi_exported::setGtaRunning(val);
    } catch (const std::exception &e) {
        StaticLogger::errorStream() << "Exception thrown: " << e.what();
    }
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
short get_pos(const std::shared_ptr<void> &src) {
    // Write the src to the debug zip folder
    if (variables::debug_full) {
        utils::bitmap bmp = utils::convertHBitmap(width, height, src.get());
        debug::writeImage(bmp);
    }

    std::vector<std::string> odds(6);
    uint16_t yCoord, xCoord, _width, _height;
    for (int i = 0; i < 6; i++) {
        yCoord = static_cast<uint16_t>(std::round((float) yLocations[i] * multiplierH));
        _height = static_cast<uint16_t>(std::round((float) 60 * multiplierH));
        xCoord = static_cast<uint16_t>(std::round(230 * multiplierW));
        _width = static_cast<uint16_t>(std::round(120 * multiplierW));

        // Crop the screenshot
        utils::bitmap b = utils::crop(xCoord, yCoord, _width, _height, src.get());

        // Write bitmap object to debug zip folder
        if (variables::debug_full) {
            debug::writeImage(b);
        }

        odds[i] = variables::knn.predict(b, multiplierW, multiplierH);
        if (!opencv_link::knn::isOdd(odds[i])) {
            StaticLogger::errorStream() << "Knn did not return an odd: " << (odds[i].empty() ? "[empty]" : odds[i]);
            throw autobetException("Knn did not return an odd: " + (odds[i].empty() ? "[empty]" : odds[i]));
        } else {
            // Translate the odd
            odds[i] = opencv_link::knn::translateOdd(odds[i]);
            StaticLogger::debugStream() << "Odd prediction: " << odds[i];
        }
    }

    if (napi_exported::isBettingFunctionSet()) {
        // Call the bettingPositionCallback
        std::promise<int> promise = napi_exported::getBettingPosition(odds);
        std::future<int> future = promise.get_future();

        // Wait for max 10 seconds
        std::future_status status = future.wait_for(std::chrono::seconds(10));

        // Check if the result is ready, if so, use it
        if (status == std::future_status::ready) {
            const int res = future.get();
            StaticLogger::debugStream() << "The custom betting function returned: " << res;

            if (res < -1) {
                StaticLogger::warning(
                        "The custom betting function returned a result < -1, falling back to the default implementation");
                return getBasicBettingPosition(odds);
            } else {
                // Return the yLocation at res
                return yLocations[res];
            }
        } else {
            StaticLogger::warning(
                    "The custom betting function did not finish within 10 seconds, falling back to the default function");
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

    try {
        // If the amount to add is not zero add it to winnings and winnings_all
        if (amount != 0) {
            variables::winnings += amount;
            variables::winnings_all += amount;

            webui::setWinnings(variables::winnings);
            webui::setWinningsAll(variables::winnings_all);

            napi_exported::setAllMoneyMade(static_cast<int>(variables::winnings_all));
            control::writeWinnings();

            // If the amount is not negative count it as a won race
            if (amount > 0) {
                racesWon++;
                webui::setRacesWon(racesWon);
            }
        } else {
            // Add a lost race
            racesLost++;
            webui::setRacesLost(racesLost);
        }

        napi_exported::addMoney(amount);
    } catch (const std::exception &e) {
        StaticLogger::errorStream() << "Exception thrown: " << e.what();
    }
}

/**
 * Get the winnings
 */
void getWinnings() {
    // Set coordinates, width and height to get the image from.
    // These values are based on the positions on a 2560x1440 screen.
    // They are then scaled to the current game resulution and rounded.
    // If the images cropped are too small/big/wrong placed,
    // these values probably should be changed.
    auto yCoord = static_cast<short>(std::round(1060.0f * multiplierH));
    auto _height = static_cast<short>(std::round(86.0f * multiplierH));
    auto xCoord = static_cast<short>(std::round(1286.0f * multiplierW));
    auto _width = static_cast<short>(std::round(304.0f * multiplierW));

    // Take a screenshot and crop the image
    std::shared_ptr<void> src(utils::TakeScreenShot(xPos, yPos, width, height), DeleteObject);
    utils::bitmap bmp = utils::crop(xCoord, yCoord, _width, _height, src.get());

    if (variables::debug_full) {
        utils::bitmap b = utils::convertHBitmap(width, height, src.get());
        debug::writeImage(b);
        debug::writeImage(bmp);
    }

    // Delete the original screenshot
    src.reset();

    // Get the prediction and check if its an actual odd.
    // For further information on how an odd looks like,
    // take a look at the implementation of opencv_link::knn::isWinning(1)
    std::string pred;
    try {
        pred = variables::knn.predict(bmp, multiplierW, multiplierH);
    } catch (std::exception &e) {
        StaticLogger::errorStream() << "Could not predict the winnings. Error: " << e.what();
        return;
    }

    if (!opencv_link::knn::isWinning(pred)) {
        StaticLogger::errorStream() << "The knn prediction was not a winning: " << pred;
        return;
    }

    // Convert the prediction to an integer
    const int res = opencv_link::knn::winningToInt(pred);
    StaticLogger::debugStream() << "Winnings prediction: " << res;

    // Update the winnings
    updateWinnings(res);
}

/**
 * Skip this bet
 */
void skipBet() {
    StaticLogger::debug("Should not bet on this one, skipping...");
    std::this_thread::sleep_for(std::chrono::milliseconds(100));
    leftClick(633, 448);

    // Sleep between clicks as the game cannot accept so many clicks in quick succession
    // Also, this helps making our clicks seem more human.
    // Just so we going the safer route as of not getting banned.
    // Rockstar would probably not ban anyone for using this,
    // since they are incompetent as fuck, despite having billions of dollars.
    std::this_thread::sleep_for(std::chrono::milliseconds(100));
    leftClick(1720, 1036);
}

void betting::mainLoop() {
    // Stop the betting as a lambda
    const auto stopBetting = [] {
        try {
            napi_exported::keyCombStop();
            webui::setStopping();
        } catch (const std::exception &e) {
            StaticLogger::errorStream() << "Exception thrown: " << e.what();
        }
        variables::running = false;
    };

    // Check if the game is running
    if (utils::isProcessRunning("GTA5.exe")) {
        StaticLogger::debug("GTA V running");
        setGtaVRunning(true);

        // Set the game's positions
        set_positions();
        utils::windowSize ws;

        // A note to my C Professor: I've learned my lesson,
        // this is not a while(TRUE) loop. It never was, honestly.
        while (variables::running) {
            // Get the position to bet on
            short pos = -2;
            std::string lastError;

            // If the call fails, retry 3 times, reset in between. This is just in case the
            // Game is stuck on the 'transaction pending' screen, so if it is stuck, retry.
            // Will try to reset (go back to the betting screen) and sleep 5 seconds.
            // If this doesn't help, the betting will be stopped.
            for (int i = 0; i < 3; i++) {
                try {
                    // Take a screen shot
                    std::shared_ptr<void> src(utils::TakeScreenShot(xPos, yPos, width, height), DeleteObject);
                    pos = get_pos(src);
                    break;
                } catch (const std::exception &e) {
                    lastError = "Could not get the position to bet on. Error: ";
                    lastError.append(e.what());

                    StaticLogger::errorStream() << lastError;
                    StaticLogger::debug("Assuming the game is stuck, resetting...");
                    reset();

                    StaticLogger::debug("Sleeping for 5 seconds");
                    std::this_thread::sleep_for(std::chrono::seconds(5));
                }
            }

            // Check if the position could be retrieved
            if (pos == -2) {
                StaticLogger::error(
                        "Could not get the position to bet on, retried 3 times, which did not help, stopping betting.");
                napi_exported::bettingException(lastError);
                stopBetting();
                break;
            }

            if (pos != -1) {
                // If the user somehow managed to hammer the stop button in ~100ms, stop
                if (!variables::running) break;

                // Plot twist: pos is actually the y-position
                // of the button of the horse to bet on
                place_bet(pos);
                StaticLogger::debugStream() << "Running: " << std::boolalpha << variables::running;

                // Updating winnings by -10000 since betting costs 100000
                updateWinnings(-10000);
                if (!variables::running) continue;

                // Only sleep 1/2 of the time at once, so we can
                // stop earlier when the user requests to stop
                StaticLogger::debugStream() << "Sleeping for " << variables::time_sleep << " seconds";
                std::this_thread::sleep_for(std::chrono::seconds(variables::time_sleep / 2));
                if (!variables::running) {
                    // Program is not running anymore, stop it
                    StaticLogger::debugStream() << "The script has been stopped, skipping after "
                                                << (variables::time_sleep / 2) << " seconds...";
                    continue;
                }

                // Sleep through the last half
                std::this_thread::sleep_for(std::chrono::seconds((int) ceil((double) variables::time_sleep / 2.0)));

                StaticLogger::debug("Getting winnings");
                // Update the winnings and return to the betting screen
                getWinnings();

                if (!variables::running) continue;
                reset();
                if (autostop::checkStopConditions()) {
                    stopBetting();
                    break;
                }
            } else {
                // Should not bet, skip
                skipBet();
                updateWinnings(-100);
                StaticLogger::debugStream() << "Sleeping for " << variables::time_sleep << " seconds";
                std::this_thread::sleep_for(std::chrono::seconds(variables::time_sleep / 2));
                if (!variables::running) continue;
                std::this_thread::sleep_for(
                        std::chrono::seconds(static_cast<int>(ceil(static_cast<double>(variables::time_sleep / 2.0)))));

                // Update the winnings and return to the betting screen
                getWinnings();
                reset();
            }

            // Check if the game is in focus
            bool foreground;
            errno_t err = utils::isForeground(foreground);
            if (err == 0) {
                if (!foreground) {
                    StaticLogger::debug("GTA V is not the currently focused window. Betting will be stopped");
                    napi_exported::bettingException("GTA V is not the currently focused window.");
                    stopBetting();
                    break;
                }
            } else {
                StaticLogger::warning("Could not get foreground window. Assuming GTA V is in foreground");
            }

            // Check if the game is still opened
            utils::getWindowSize(ws);
            if ((ws.width == 0 && ws.height == 0) || !utils::isProcessRunning("GTA5.exe")) {
                StaticLogger::debug("The game seems to be closed, stopping betting");
                stopBetting();
            }
        }

        // Set stopped
        variables::stopping = false;
        webui::setStopped();
        StaticLogger::debug("Betting is now paused");
    } else {
        // The Game is not running, tell it everyone and sleep some time
        StaticLogger::debug("GTA V not running");
        if (variables::running && variables::stopping) {
            variables::stopping = false;
            variables::running = false;
        }
        setGtaVRunning(false);
        std::this_thread::sleep_for(std::chrono::milliseconds(100));
    }
}

// Web server functions ===================================
void js_start_script() {
    control::start_script();
}

void js_stop_script() {
    control::stop_script();
}

int get_races_won() {
    return static_cast<int>(racesWon);
}

int get_races_lost() {
    return static_cast<int>(racesLost);
}

int get_all_winnings() {
    return static_cast<int>(variables::winnings_all);
}

int get_current_winnings() {
    return variables::winnings;
}

int get_time() {
    return static_cast<int>(variables::time_running);
}

bool get_gta_running() {
    return variables::gtaVRunning;
}

int get_running() {
    if (variables::running && !variables::stopping) {  //running
        return 1;
    } else if (variables::starting && !variables::running && !variables::stopping) { //starting
        return 2;
    } else if (!variables::running && !variables::stopping) { //stopped
        return -1;
    } else { //stopping
        return 0;
    }
}

void betting::setWebUiFunctions() {
    // Set the web ui exported functions
    webui::set_js_start_script(js_start_script);
    webui::set_js_stop_script(js_stop_script);
    webui::set_get_races_won(get_races_won);
    webui::set_get_races_lost(get_races_lost);
    webui::set_get_all_winnings(get_all_winnings);
    webui::set_get_current_winnings(get_current_winnings);
    webui::set_get_time(get_time);
    webui::set_get_gta_running(get_gta_running);
    webui::set_get_running(get_running);
}

// ========================================================
