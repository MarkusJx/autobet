/*
 * This file contains all definitions for the
 * web ui. Those have been moved from main.cpp
 * to fix a Heisenbug, which would cause the program
 * to crash for some reason when a client connects
 * to the web ui if and only if the application
 * was built in release mode.
 */

#include <CppJsLib.hpp>
#include <memory>

#include "webui.hpp"
#include "logger.hpp"
#include "util/utils.hpp"
#include "autostop.hpp"

std::unique_ptr<markusjx::cppJsLib::Server> webUi = nullptr;

// web functions ==========================================

std::function<void(bool)> webSetGtaRunning = nullptr;
std::function<void(int)> webSetWinnings = nullptr;
std::function<void(int64_t)> webSetWinningsAll = nullptr;
std::function<void(int)> webSetRacesWon = nullptr;
std::function<void(int)> webSetRacesLost = nullptr;
std::function<void()> webSetStarted = nullptr;
std::function<void()> webSetStopped = nullptr;
std::function<void()> webSetStopping = nullptr;
std::function<void()> webSetStarting = nullptr;
std::function<void(int)> webSetAutostopMoney = nullptr;
std::function<void(int)> webSetAutostopTime = nullptr;

std::function<void()> js_start_script = nullptr;
std::function<void()> js_stop_script = nullptr;
std::function<int()> get_races_won = nullptr;
std::function<int()> get_races_lost = nullptr;
std::function<int()> get_all_winnings = nullptr;
std::function<int()> get_current_winnings = nullptr;
std::function<int()> get_time = nullptr;
std::function<bool()> get_gta_running = nullptr;
std::function<int()> get_running = nullptr;

/**
 * Set all imported webUi functions to nullptr
 */
void destroyImportedWebFunctions() {
    webSetGtaRunning = nullptr;
    webSetWinnings = nullptr;
    webSetWinningsAll = nullptr;
    webSetRacesWon = nullptr;
    webSetRacesLost = nullptr;
    webSetStarted = nullptr;
    webSetStopped = nullptr;
    webSetStopping = nullptr;
    webSetStarting = nullptr;
    webSetAutostopMoney = nullptr;
    webSetAutostopTime = nullptr;
}

void webui::setGtaRunning(bool val) {
    try {
        if (webSetGtaRunning) webSetGtaRunning(val);
    } catch (const std::exception &e) {
        logger::StaticLogger::error(e.what());
    }
}

void webui::setWinnings(int val) {
    try {
        if (webSetWinnings) webSetWinnings(val);
    } catch (const std::exception &e) {
        logger::StaticLogger::error(e.what());
    }
}

void webui::setWinningsAll(int64_t val) {
    try {
        if (webSetWinningsAll) webSetWinningsAll(val);
    } catch (const std::exception &e) {
        logger::StaticLogger::error(e.what());
    }
}

void webui::setRacesWon(int val) {
    try {
        if (webSetRacesWon) webSetRacesWon(val);
    } catch (const std::exception &e) {
        logger::StaticLogger::error(e.what());
    }
}

void webui::setRacesLost(int val) {
    try {
        if (webSetRacesLost) webSetRacesLost(val);
    } catch (const std::exception &e) {
        logger::StaticLogger::error(e.what());
    }
}

void webui::setStarted() {
    try {
        if (webSetStarted) webSetStarted();
    } catch (const std::exception &e) {
        logger::StaticLogger::error(e.what());
    }
}

void webui::setStopped() {
    try {
        if (webSetStopped) webSetStopped();
    } catch (const std::exception &e) {
        logger::StaticLogger::error(e.what());
    }
}

void webui::setStopping() {
    try {
        if (webSetStopping) webSetStopping();
    } catch (const std::exception &e) {
        logger::StaticLogger::error(e.what());
    }
}

void webui::setStarting() {
    try {
        if (webSetStarting) webSetStarting();
    } catch (const std::exception &e) {
        logger::StaticLogger::error(e.what());
    }
}

void webui::setAutostopMoney(int val) {
    try {
        if (webSetAutostopMoney) webSetAutostopMoney(val);
    } catch (const std::exception &e) {
        logger::StaticLogger::error(e.what());
    }
}

void webui::setAutostopTime(int val) {
    try {
        if (webSetAutostopTime) webSetAutostopTime(val);
    } catch (const std::exception &e) {
        logger::StaticLogger::error(e.what());
    }
}

void webui::set_js_start_script(std::function<void()> fn) {
    js_start_script = std::move(fn);
}

void webui::set_js_stop_script(std::function<void()> fn) {
    js_stop_script = std::move(fn);
}

void webui::set_get_races_won(std::function<int()> fn) {
    get_races_won = std::move(fn);
}

void webui::set_get_races_lost(std::function<int()> fn) {
    get_races_lost = std::move(fn);
}

void webui::set_get_all_winnings(std::function<int()> fn) {
    get_all_winnings = std::move(fn);
}

void webui::set_get_current_winnings(std::function<int()> fn) {
    get_current_winnings = std::move(fn);
}

void webui::set_get_time(std::function<int()> fn) {
    get_time = std::move(fn);
}

void webui::set_get_gta_running(std::function<bool()> fn) {
    get_gta_running = std::move(fn);
}

void webui::set_get_running(std::function<int()> fn) {
    get_running = std::move(fn);
}

bool webui::initialized() {
    return webUi.operator bool();
}

bool webui::running() {
    return webUi->running();
}

/**
 * Try to start the web ui
 *
 * @return true, if the operation was successful
 */
bool webui::startWebUi(const std::string &ip) {
    try {
        // Set the base directory to the appropriate directory
        // depending on whether the program is packed or not
        std::string base_dir;
        if (utils::fileExists("web")) {
            base_dir = "web";
        } else if (utils::fileExists("resources/web")) {
            base_dir = "resources/web";
        } else {
            logger::StaticLogger::error("No web folder was found. Unable to start web ui web server");
            return false;
        }

        webUi = std::make_unique<markusjx::cppJsLib::Server>(base_dir);
        webUi->setLogger([](const std::string &s) {
            logger::StaticLogger::simpleDebug(s);
        });

        webUi->setError([](const std::string &s) {
            logger::StaticLogger::simpleError(s);
        });
    } catch (const std::exception &e) {
        // This should not happen on a modern system
        logger::StaticLogger::errorStream() << "Unable to create instance of web ui web server. Error: " << e.what();
        webUi.reset();
        return false;
    }

    logger::StaticLogger::debug("Exposing functions to the webUi");

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

    // Import some functions, ignore their results
    webUi->import(webSetGtaRunning, false);
    webUi->import(webSetWinnings, false);
    webUi->import(webSetWinningsAll, false);
    webUi->import(webSetRacesWon, false);
    webUi->import(webSetRacesLost, false);
    webUi->import(webSetStarted, false);
    webUi->import(webSetStopped, false);
    webUi->import(webSetStopping, false);
    webUi->import(webSetStarting, false);
    webUi->import(webSetAutostopMoney, false);
    webUi->import(webSetAutostopTime, false);

    logger::StaticLogger::debug("Starting web ui web server");

    try {
        // We're building with websocket protocol support by default.
        // This may only be disabled when boost is not installed
        // or the BOOST_ROOT environment variable is not set.
#ifdef CPPJSLIB_ENABLE_WEBSOCKET
#       pragma message("INFO: Building with websocket support")
        logger::StaticLogger::debug("Starting with websocket enabled");
        bool res = webUi->start(8027, ip, 8028, false);
#else
#       pragma message("INFO: Building without websocket support")
        logger::StaticLogger::debug("Starting with websocket disabled");
        bool res = webUi->start(8027, ip, 0, false);
#endif // CPPJSLIB_ENABLE_WEBSOCKET

        // Check the result, if it is set to true, everything is ok
        if (res) {
            logger::StaticLogger::debug("Successfully started webUi");
            return true;
        } else {
            logger::StaticLogger::warning("Could not start webUi");
            webUi.reset();

            // Set all functions to nullptr
            destroyImportedWebFunctions();

            return false;
        }
    } catch (const std::exception &e) {
        logger::StaticLogger::errorStream() << "Exception thrown: " << e.what();
        return false;
    }
}

bool webui::reset() {
    // Stop the web servers, so they don't occupy the ports they use
    if (webUi) {
        std::promise<void> stopPromise;
        webUi->stop(stopPromise);
        std::future<void> stopFuture = stopPromise.get_future();

        if (stopFuture.wait_for(std::chrono::seconds(5)) == std::future_status::timeout) {
            logger::StaticLogger::warning("Could not stop web ui web server");
        } else {
            logger::StaticLogger::debug("Stopped web ui web server");
        }

        webUi.reset();
        return true;
    } else {
        logger::StaticLogger::warning("Could not stop web ui web server");
        return false;
    }

    destroyImportedWebFunctions();
}
