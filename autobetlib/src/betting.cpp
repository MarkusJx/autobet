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
#include "web/webui.hpp"
#include "napi_exported.hpp"
#include "historic_data.hpp"
#include "control.hpp"
#include "betting.hpp"
#include "logger.hpp"

using namespace logger;

// The width of the game window
int32_t width = 0;
// The height of the game window
int32_t height = 0;
// The number of races won since the program was started
int32_t racesWon = 0;
// The number of races lost since the program was started
int32_t racesLost = 0;

// The previous status of the game window,
// with -1 being unset, 0 being closed
// and 1 being opened
int previous_game_status = -1;

// Whether the betting was running previously
bool was_running = true;

/**
 * Get GTA V window positions and size and write them to their variables
 */
void set_positions() {
    //StaticLogger::debug("Getting positions of GTA V window");

    bool shouldLog = true;
    try {
        // Definition of width, height, x, y pos of window and multiplier of positions
        windowUtils::windowSize ws = utils::getWindowSize();
        shouldLog = variables::xPos != ws.xPos || variables::yPos != ws.yPos || width != ws.width ||
                    height != ws.height;

        variables::xPos = ws.xPos;
        variables::yPos = ws.yPos;
        width = ws.width;
        height = ws.height;

        if (shouldLog) {
            StaticLogger::debugStream() << "Got positions: " << ws.toString();
        }
    } catch (const std::exception &e) {
        StaticLogger::warningStream() << "utils::getWindowSize threw an exception: " << e.what()
                                      << ". Therefore, setting all window info values to zero";
        variables::xPos = 0;
        variables::yPos = 0;
        width = 0;
        height = 0;
    }

    windowUtils::windowSize screenSize = utils::getActiveScreen(variables::xPos + (width / 2),
                                                                variables::yPos + (height / 2));

    if (shouldLog) {
        StaticLogger::debugStream() << "Got active screen width: " << screenSize.width << " and height: "
                                    << screenSize.height;
    }

    variables::multiplierW = (float) width / 2560.0f;
    variables::multiplierH = (float) height / 1440.0f;
}

/**
 * Set the GTA V running variable in C++ and JS
 *
 * @param val the new value
 */
void setGtaVRunning(bool val) {
    // Only send data to the web listeners if something has changed
    static bool prev = false;
    try {
        if (val != prev) {
            prev = val;
            webui::setGtaRunning(val);
        }

        variables::gtaVRunning = val;
        napi_exported::setGtaRunning(val);
    } catch (const std::exception &e) {
        StaticLogger::errorStream() << "Exception thrown: " << e.what();
    }
}

short getBasicBettingPosition(const std::vector<std::string> &odds) {
    // Results to fill in, every number in the array can be between 1 and 10,
    // 1 represents evens, 2 represents 2/1 etc. 10 represents 10/1 and lower
    std::array<short, 6> res = {-1, -1, -1, -1, -1, -1};
    for (unsigned short i = 0; i < 6; i++) {
        // Get the odd as a short
        const short b_res = opencv_link::knn::oddToShort(odds[i]);

        // Check if the current result already exist, so there are not multiple >10/1 odds ore there is an evens
        // if one of this occurs, bet not on this one
        auto s = std::find(std::begin(res), std::end(res), b_res);
        if (b_res <= 5 && s != std::end(res)) { // If this is 5/1 or higher (%!) and exists multiple times, skip
            return -1;
        }

        res[i] = b_res;
    }

    // If evens exist, only bet if the second highest percentage is lower than 4/1 (basically only 4/1 or 5/1)
    if (std::find(std::begin(res), std::end(res), 1) != std::end(res)) {
        short lowest = -1;
        for (short re: res) {
            // Set lowest if res[s] is smaller than lowest and not equal to 1 (evens), since this will always be lower,
            // but the second' lowest percentage is to be searched for.
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
    std::array<short, 2> lowest = {res[0], 0};
    for (short i = 1; i < 6; i++) {
        if (lowest[0] > res[i]) {
            lowest[0] = res[i];
            lowest[1] = i;
        }
    }

    return static_cast<short>(lowest[1]);
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
        utils::bitmap bmp = utils::convertHBitmap(width, height, src);
        debug::writeImage(bmp);
    }

    std::vector<std::string> odds(6);
    uint16_t yCoord, xCoord, _width, _height;
    for (int i = 0; i < 6; i++) {
        yCoord = static_cast<uint16_t>(std::round((float) variables::yLocations[i] * variables::multiplierH));
        _height = static_cast<uint16_t>(std::round((float) 60 * variables::multiplierH));
        xCoord = static_cast<uint16_t>(std::round(230 * variables::multiplierW));
        // Edit 24-02-2021: Extend with of the single images from 120 to 220 pixels
        _width = static_cast<uint16_t>(std::round(220 * variables::multiplierW));

        // Crop the screenshot
        utils::bitmap b = utils::crop(xCoord, yCoord, _width, _height, src);

        // Write bitmap object to debug zip folder
        if (variables::debug_full) {
            debug::writeImage(b);
        }

        odds[i] = variables::knn.predict(b, variables::multiplierW, variables::multiplierH);
        if (!opencv_link::knn::isOdd(odds[i])) {
            StaticLogger::errorStream() << "Knn did not return an odd: " << (odds[i].empty() ? "[empty]" : odds[i]);
            throw autobetException("Knn did not return an odd: " + (odds[i].empty() ? "[empty]" : odds[i]));
        } else {
            // Translate the odd
            odds[i] = opencv_link::knn::translateOdd(odds[i]);
            StaticLogger::debugStream() << "Odd prediction: " << odds[i];
        }
    }

    // Save the odds
    markusjx::autobet::historic_data::save_odds(odds);

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

            if (res < -1 || res >= static_cast<signed>(variables::yLocations.size())) {
                StaticLogger::warning(
                        "The custom betting function returned a result < -1, falling back to the default implementation");
                return getBasicBettingPosition(odds);
            } else {
                // Return the result
                return static_cast<short>(res);
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
    // They are then scaled to the current game resolution and rounded.
    // If the images cropped are too small/big/wrong placed,
    // these values probably should be changed.
    auto yCoord = static_cast<short>(std::round(1060.0f * variables::multiplierH));
    auto _height = static_cast<short>(std::round(86.0f * variables::multiplierH));
    auto xCoord = static_cast<short>(std::round(1286.0f * variables::multiplierW));
    auto _width = static_cast<short>(std::round(304.0f * variables::multiplierW));

    // Take a screenshot and crop the image
    std::shared_ptr<void> src(utils::TakeScreenShot(variables::xPos, variables::yPos, width, height), DeleteObject);
    utils::bitmap bmp = utils::crop(xCoord, yCoord, _width, _height, src);

    if (variables::debug_full) {
        utils::bitmap b = utils::convertHBitmap(width, height, src);
        debug::writeImage(b);
        debug::writeImage(bmp);
    }

    if (markusjx::autobet::historic_data::should_save()) {
        // The x-pos of the odd of the second horse
        const auto x2 = static_cast<uint16_t>(std::round(220 * variables::multiplierW));
        // The x-pos of the odd of the first horse
        const auto x1 = static_cast<uint16_t>(std::round(965 * variables::multiplierW));
        // The x-pos of the odd of the third horse
        const auto x3 = static_cast<uint16_t>(std::round(1755 * variables::multiplierW));

        // The y-pos of the odds of the second and third horse
        const auto y1 = static_cast<uint16_t>(std::round(1115 * variables::multiplierH));
        // The y-pos of the odd of the first horse
        const auto y2 = static_cast<uint16_t>(std::round(1140 * variables::multiplierH));

        // The height of the images to crop
        const auto h = static_cast<uint16_t>(std::round(75 * variables::multiplierH));
        // The width of the images to crop
        const auto w = static_cast<uint16_t>(std::round(120 * variables::multiplierW));

        const utils::bitmap second = utils::crop(x2, y1, w, h, src);
        const utils::bitmap first = utils::crop(x1, y2, w, h, src);
        const utils::bitmap third = utils::crop(x3, y1, w, h, src);

        try {
            const std::string o2 = variables::knn.predict(second, variables::multiplierW, variables::multiplierH);
            const std::string o1 = variables::knn.predict(first, variables::multiplierW, variables::multiplierH);
            const std::string o3 = variables::knn.predict(third, variables::multiplierW, variables::multiplierH);

            markusjx::autobet::historic_data::save_winning_odds(o1, o2, o3);
        } catch (const std::exception &e) {
            StaticLogger::errorStream() << "Could not predict the odds of the winning horses: " << e.what();
        }
    }

    // Delete the original screenshot
    src.reset();

    // Get the prediction and check if it's an actual odd.
    // For further information on how an odd looks like,
    // take a look at the implementation of opencv_link::knn::isWinning(1)
    std::string pred;
    try {
        pred = variables::knn.predict(bmp, variables::multiplierW, variables::multiplierH);
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

    // Save the winnings to the historic data file
    markusjx::autobet::historic_data::save_winnings(res);

    // Update the winnings
    updateWinnings(res);
}

void betting::mainLoop() {
    // Stop the betting as a lambda
    const auto stopBetting = [] {
        try {
            napi_exported::keyCombStop();
            webui::setStopped();
        } catch (const std::exception &e) {
            StaticLogger::errorStream() << "Exception thrown: " << e.what();
        }
        variables::running = false;
    };

    // Check if the game is running
    if (utils::gameIsRunning()) {
        if (previous_game_status != 1) {
            StaticLogger::debug("GTA V running");
            previous_game_status = 1;
        }

        setGtaVRunning(true);

        // Set the game's positions
        set_positions();

        if (variables::running) {
            StaticLogger::debug("Running first bet");
            // Run the first reset on the navigation strategy
            variables::navigationStrategy()->firstBet();
        }

        // A note to my C Professor: I've learned my lesson,
        // this is not a while(TRUE) loop. It never was, honestly.
        while (variables::running) {
            was_running = true;

            // Get the position to bet on
            short pos = -2;
            std::string lastError;

            // If the call fails, retry 3 times, reset in between. This is just in case the
            // Game is stuck on the 'transaction pending' screen, so if it is stuck, retry.
            // Will try to reset (go back to the betting screen) and sleep 5 seconds.
            // If this doesn't help, the betting will be stopped.
            for (int i = 0; i < 3; i++) {
                try {
                    // Take a screenshot
                    std::shared_ptr<void> src(utils::TakeScreenShot(variables::xPos, variables::yPos, width, height),
                                              DeleteObject);
                    pos = get_pos(src);
                    break;
                } catch (const std::exception &e) {
                    lastError = "Could not get the position to bet on. Error: ";
                    lastError.append(e.what());

                    StaticLogger::errorStream() << lastError;
                    StaticLogger::debug("Assuming the game is stuck, resetting...");
                    variables::navigationStrategy()->reset();

                    StaticLogger::debug("Sleeping for 5 seconds");
                    std::this_thread::sleep_for(std::chrono::seconds(5));
                }
            }

            // Save the horse on which the bet will be placed on
            markusjx::autobet::historic_data::save_bet_placed_on(pos);

            // Check if the position could be retrieved
            if (pos == -2) {
                StaticLogger::error(
                        "Could not get the position to bet on, retried 3 times, which did not help, stopping betting.");
                napi_exported::bettingException(lastError);
                variables::pushNotifications()->send_notification("Autobet - Error",
                                                                  "The betting process has been stopped due to an error");
                stopBetting();
                break;
            }

            if (pos != -1) {
                // If the user somehow managed to hammer the stop button in ~100ms, stop
                if (!variables::running) break;

                // Plot twist: pos is actually the y-position
                // of the button of the horse to bet on
                variables::navigationStrategy()->placeBet(pos);
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
                std::this_thread::sleep_for(
                        std::chrono::seconds(static_cast<int>(ceil(static_cast<double>(variables::time_sleep / 2.0)))));

                StaticLogger::debug("Getting winnings");
                // Update the winnings and return to the betting screen
                getWinnings();

                if (!variables::running) continue;
                variables::navigationStrategy()->reset();
                if (autostop::checkStopConditions()) {
                    stopBetting();
                    break;
                }
            } else {
                // Should not bet, skip
                variables::navigationStrategy()->skipBet();
                updateWinnings(-100);
                StaticLogger::debugStream() << "Sleeping for " << variables::time_sleep << " seconds";
                std::this_thread::sleep_for(std::chrono::seconds(variables::time_sleep / 2));
                if (!variables::running) continue;
                std::this_thread::sleep_for(
                        std::chrono::seconds(static_cast<int>(ceil(static_cast<double>(variables::time_sleep / 2.0)))));

                // Update the winnings and return to the betting screen
                getWinnings();
                variables::navigationStrategy()->reset();
            }

            // Check if the game is in focus
            bool foreground;
            errno_t err = utils::isForeground(foreground);
            if (err == 0) {
                // Stop the betting if the game application is not the focused window.
                // Only stop the betting if the selected game application is the default one.
                // If it is not, just issue a warning and continue as usual.
                // The problem is related to this: https://github.com/MarkusJx/autobet/issues/20#issuecomment-792301392
                if (!foreground && variables::isDefaultGameApplication()) {
                    StaticLogger::error("GTA V is not the currently focused window. Betting will be stopped");
                    napi_exported::bettingException("GTA V is not the currently focused window.");
                    stopBetting();
                    break;
                } else if (!foreground) {
                    StaticLogger::warning("GTA V is not the currently focused window. "
                                          "Ignoring this event as the currently selected game application "
                                          "is not the default one");
                }
            } else {
                StaticLogger::warning("Could not get foreground window. Assuming GTA V is in foreground");
            }

            // Check if the game is still opened
            windowUtils::windowSize ws = utils::getWindowSize();
            if ((ws.width == 0 && ws.height == 0) || !utils::gameIsRunning()) {
                StaticLogger::error("The game seems to be closed, stopping betting");
                stopBetting();
            }
        }

        // Set stopped
        variables::stopping = false;
        if (was_running) {
            StaticLogger::debug("Betting is now paused");
            was_running = false;
            webui::setStopped();
        } else {
            // Only send this message every 10-ish seconds
            static int count = 0;
            count = (count + 1 % 10);
            if (count == 0) webui::setStopped();
        }
    } else {
        // The Game is not running, tell it everyone and sleep some time
        if (previous_game_status != 0) {
            StaticLogger::debug("GTA V not running");
            previous_game_status = 0;
        }

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
