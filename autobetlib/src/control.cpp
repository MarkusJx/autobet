#include <fstream>
#include <windows.h>

#include "control.hpp"
#include "napi_exported.hpp"
#include "variables.hpp"
#include "web/webui.hpp"
#include "debug/debug.hpp"
#include "storage/settings.hpp"
#include "logger.hpp"

using namespace logger;

void control::kill(bool _exit) {
    napi_exported::stopCallbacks();

    // Set every possible bool to false
    variables::keyCombListen = false;
    variables::runLoops = false;
    variables::running = false;

    webui::reset();

    // Delete the AI
    StaticLogger::debug("Deleting ai");
    variables::knn.reset();
    StaticLogger::debug("Deleted ai");

    // Sleep
    std::this_thread::sleep_for(std::chrono::milliseconds(50));

    // Delete the logger, so it closes the file stream, if open
    StaticLogger::destroy();

    if (variables::debug_full) {
        StaticLogger::create(LoggerMode::MODE_FILE, LogLevel::debug, "autobet_debug.log", "wt");
        debug::finish();
        StaticLogger::destroy();
    }

    if (_exit) {
        exit(0);
    }
}

void control::start_script() {
    StaticLogger::debug("Starting script");

    try {
        // Only start if it is not already running or stopping
        if (!variables::running && !variables::stopping) {
            StaticLogger::debug("Set running to true");
            napi_exported::keyCombStart();
            webui::setStarted();
            variables::running = true;
        }

        // Count the time running
        std::thread([] {
            while (!stopped()) {
                std::this_thread::sleep_for(std::chrono::seconds(1));
                variables::time_running++;
            }
        }).detach();
    } catch (const std::exception &e) {
        StaticLogger::errorStream() << "Exception thrown: " << e.what();
    }
}

void control::stop_script() {
    // Only stop if it is running and not stopping
    if (variables::running && !variables::stopping) {
        try {
            napi_exported::keyCombStop();
            webui::setStopping();
        } catch (const std::exception &e) {
            StaticLogger::errorStream() << "Exception thrown: " << e.what();
        }
        StaticLogger::debug("Waiting for main thread to finish");
        variables::running = false;
        variables::stopping = true;
    }
}

void control::writeWinnings() {
    StaticLogger::debug("Writing winnings");

    try {
        settings::write("winningsAll", variables::winnings_all.load());
    } catch (const std::exception &e) {
        StaticLogger::errorStream() << "Could not write the winnings: " << e.what();
    }
}

void control::listenForKeycomb() {
    auto startStop = []() {
        if (!variables::starting) {
            if (!variables::running && !variables::stopping) {
                if (!variables::gtaVRunning) {
                    StaticLogger::debug(
                            "Tried to start the script while the game was not running, skipping this request");
                    return;
                }
                start_script();
            } else {
                stop_script();
            }
        } else {
            StaticLogger::debug("Keycomb to start was triggered, but the 'start' button was already"
                                "pressed at this time, ignoring the event");
        }
    };

    while (variables::keyCombListen) {
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

    // Kill the program if SHIFT+CTRL+F9 is pressed, this on activates if break on the loop is called
    // and keyCombListen is still true, if it is false, the program is about to stop already
    if (variables::keyCombListen) {
        napi_exported::node_quit();
    }
}

bool control::stopped() {
    return !variables::running && !variables::stopping;
}