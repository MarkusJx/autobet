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
#include <filesystem>

#define NO_NAPI

#include "web/webui.hpp"
#include "util/utils.hpp"
#include "autostop.hpp"
#include "exposed_methods.hpp"
#include "storage/settings.hpp"
#include "web/upnp.hpp"
#include "util/recurring_job.hpp"
#include "logger.hpp"

#define PUBLIC_KEY_FILE utils::get_or_create_documents_folder() + "\\ssl_public.pem"
#define PRIVATE_KEY_FILE utils::get_or_create_documents_folder() + "\\ssl_private.pem"

using namespace markusjx::autobet;

static std::unique_ptr<markusjx::cppJsLib::Server> webUi = nullptr;
static std::unique_ptr<util::recurring_job> upnp_refresher;
static std::shared_ptr<web::upnp> upnp_client;
static std::mutex mtx;
static bool is_https = false;
static uint16_t port = 8027;
static uint16_t websocket_port = 8028;
static bool upnp_used = false;
static std::string ip_address;
static std::mutex certificate_mutex;
static std::shared_ptr<autobet::web::certificate> certificate;

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

AUTOBET_UNUSED void webui::set_js_start_script(std::function<void()> fn) {
    js_start_script = std::move(fn);
}

AUTOBET_UNUSED void webui::set_js_stop_script(std::function<void()> fn) {
    js_stop_script = std::move(fn);
}

AUTOBET_UNUSED void webui::set_get_races_won(std::function<int()> fn) {
    get_races_won = std::move(fn);
}

AUTOBET_UNUSED void webui::set_get_races_lost(std::function<int()> fn) {
    get_races_lost = std::move(fn);
}

AUTOBET_UNUSED void webui::set_get_all_winnings(std::function<int()> fn) {
    get_all_winnings = std::move(fn);
}

AUTOBET_UNUSED void webui::set_get_current_winnings(std::function<int()> fn) {
    get_current_winnings = std::move(fn);
}

AUTOBET_UNUSED void webui::set_get_time(std::function<int()> fn) {
    get_time = std::move(fn);
}

AUTOBET_UNUSED void webui::set_get_gta_running(std::function<bool()> fn) {
    get_gta_running = std::move(fn);
}

AUTOBET_UNUSED void webui::set_get_running(std::function<int()> fn) {
    get_running = std::move(fn);
}

bool webui::initialized() {
    return webUi.operator bool();
}

bool webui::running() {
    if (webUi) {
        return webUi->running();
    } else {
        return false;
    }
}

std::string &get404Page(const std::string &base_dir) {
    static std::string page;
    if (page.empty()) {
        std::ifstream stream(base_dir + "/404.html");
        std::stringstream buffer;
        buffer << stream.rdbuf();
        stream.close();
        page = buffer.str();
    }

    return page;
}

/**
 * Try to start the web ui
 *
 * @return true, if the operation was successful
 */
bool webui::startWebUi(const std::string &ip) {
    std::unique_lock lock(mtx);
    try {
        // Set the base directory to the appropriate directory
        // depending on whether the program is packed or not
        std::string base_dir;
        if (utils::fileExists("web-ui/out")) {
            base_dir = "web-ui/out";
        } else if (utils::fileExists("resources/web")) {
            base_dir = "resources/web";
        } else {
            logger::StaticLogger::error("No web folder was found. Unable to start web ui web server");
            return false;
        }

#ifdef CPPJSLIB_ENABLE_HTTPS
        const std::filesystem::path public_key = PUBLIC_KEY_FILE;
        const std::filesystem::path private_key = PRIVATE_KEY_FILE;

        if (webui::supports_https()) {
            logger::StaticLogger::debug("The private and public key files exist, starting the server with ssl enabled");
            webUi = std::make_unique<markusjx::cppJsLib::SSLServer>(base_dir, public_key.string(),
                                                                    private_key.string());
            is_https = true;
        } else {
            logger::StaticLogger::debug(
                    "The private and public key files do not exist, starting the server with ssl disabled");
            webUi = std::make_unique<markusjx::cppJsLib::Server>(base_dir);
            is_https = false;
        }
#else
        webUi = std::make_unique<markusjx::cppJsLib::Server>(base_dir);
        is_https = false;
#endif //CPPJSLIB_ENABLE_HTTPS
        webUi->setLogger([](const std::string &s) {
            logger::StaticLogger::simpleDebug(s);
        });

        webUi->setError([](const std::string &s) {
            logger::StaticLogger::simpleError(s);
        });

        webUi->getHttpServer()->set_default_headers(
                {
                        {"Cache-Control", "max-age=31536000"}
                }
        );

        webUi->getHttpServer()->set_error_handler([base_dir](const auto &, auto &res) {
            if (res.status == 404) {
                res.set_content(get404Page(base_dir), "text/html");
            }
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

    // Expose methods for notifications
    using namespace markusjx::autobet::exposed_methods;
    webUi->expose(get_app_server_key);
    webUi->expose(push_notifications_subscribe);
    webUi->expose(push_notifications_unsubscribe);

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

    logger::StaticLogger::debug("Starting the web ui web server");

    // Set the port if set in the settings
    if (settings::has_key(AUTOBET_SETTINGS_WEB_UI_PORT)) {
        port = settings::read<uint16_t>(AUTOBET_SETTINGS_WEB_UI_PORT);
    }

    // Set the websocket port if set in the settings
    if (settings::has_key(AUTOBET_SETTINGS_WEB_UI_WEBSOCKET_PORT)) {
        websocket_port = settings::read<uint16_t>(AUTOBET_SETTINGS_WEB_UI_WEBSOCKET_PORT);
    }

    if (settings::has_key(AUTOBET_SETTINGS_ENABLE_UPNP) && settings::read<bool>(AUTOBET_SETTINGS_ENABLE_UPNP)) {
        logger::StaticLogger::debug("UPnP was enabled via the settings, exposing the ports via UPnP");
        // Expose the ports for one hour
        upnp_client = std::make_shared<web::upnp>(ip, port, websocket_port, std::chrono::hours(1));
        try {
            // Add the port mappings
            upnp_client->add_port_mappings();
            upnp_used = true;

            // Refresh the port mappings each hour
            upnp_refresher = std::make_unique<util::recurring_job>([upnp_client = upnp_client] {
                logger::StaticLogger::debug("Refreshing ports exposed via upnp");
                upnp_client->add_port_mappings();
            }, boost::chrono::hours(1));

            // Start the runner
            upnp_refresher->start();
        } catch (const std::exception &e) {
            logger::StaticLogger::errorStream() << "Could not expose the ports via upnp: " << e.what();
            upnp_client.reset();
            upnp_used = false;
        }
    } else {
        upnp_used = false;
    }

    logger::StaticLogger::debugStream() << "Starting web ui web server with ip " << ip << ", port " << port
                                        << " and websocket port " << websocket_port;

    try {
        // We're building with websocket protocol support by default.
        // This may only be disabled when boost is not installed
        // or the BOOST_ROOT environment variable is not set.
#ifdef CPPJSLIB_ENABLE_WEBSOCKET
//#       pragma message("INFO: Building with websocket support")
        logger::StaticLogger::debug("Starting with websocket enabled");
        bool res = webUi->start(port, ip, websocket_port, false);
#else
        //#       pragma message("INFO: Building without websocket support")
                logger::StaticLogger::debug("Starting with websocket disabled");
                bool res = webUi->start(port, ip, 0, false);
#endif // CPPJSLIB_ENABLE_WEBSOCKET

        // Check the result, if it is set to true, everything is ok
        if (res) {
            logger::StaticLogger::debug("Successfully started the web ui http server");
            ip_address = ip;
            return true;
        } else {
            logger::StaticLogger::warning("Could not start the web ui http server");
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
    std::unique_lock lock(mtx);
    // Set all imported functions to nullptr
    destroyImportedWebFunctions();

    // Stop the web servers, so they don't occupy the ports they use
    if (webUi) {
        std::promise<void> stopPromise;
        webUi->stop(stopPromise);
        std::future<void> stopFuture = stopPromise.get_future();

        // Wait for five seconds to join the server
        if (stopFuture.wait_for(std::chrono::seconds(5)) == std::future_status::timeout) {
            logger::StaticLogger::warning("Could not stop web ui web server");
        } else {
            logger::StaticLogger::debug("Stopped web ui web server");
        }

        // Reset the pointer
        webUi.reset();

        if (upnp_used && upnp_refresher && upnp_client) {
            logger::StaticLogger::debug("UPnP was used to expose ports, removing port mappings");
            try {
                // Try to delete the port mappings
                upnp_client->delete_port_mappings();
            } catch (const std::exception &e) {
                logger::StaticLogger::errorStream() << "Could not remove the ports via upnp: " << e.what();
            }

            // Join the refresher task runner thread
            logger::StaticLogger::debug("Trying to join the refresher thread");
            if (upnp_refresher->try_join_for(boost::chrono::milliseconds(2000))) {
                logger::StaticLogger::debug("Successfully joined the refresher thread");
            } else {
                logger::StaticLogger::debug("Could not join the refresher thread");
            }
        }

        // Cleanup
        upnp_client.reset();
        upnp_refresher.reset();
        return true;
    } else {
        logger::StaticLogger::debug("Could not stop web ui web server since it was not running");
        return false;
    }
}

bool webui::supports_https() {
    const std::filesystem::path public_key = PUBLIC_KEY_FILE;
    const std::filesystem::path private_key = PRIVATE_KEY_FILE;

    std::unique_lock lock(certificate_mutex);
    if (std::filesystem::exists(private_key) && std::filesystem::exists(public_key)) {
        if (certificate && certificate->certificates_valid()) {
            logger::StaticLogger::debug("The cached certificates are still valid");
            return true;
        } else {
            logger::StaticLogger::debug("Reloading the certificates");
            try {
                certificate = std::make_shared<autobet::web::certificate>(public_key.string(), private_key.string());
                logger::StaticLogger::debug("The certificates are valid, ssl is supported");
                return true;
            } catch (const autobet::web::opensslException &e) {
                logger::StaticLogger::errorStream() << "Could not open the certificates: " << e.what();
                logger::StaticLogger::errorStream() << "Openssl error: " << e.getOpensslErr();
                return false;
            } catch (const std::exception &e) {
                logger::StaticLogger::errorStream() << "Could not open the certificates: " << e.what();
                return false;
            }
        }
    } else {
        logger::StaticLogger::debug("At least one of the certificate files does not exist, ssl is not supported");
        return false;
    }
}

bool webui::https() {
    return is_https;
}

std::shared_ptr<autobet::web::certificate> webui::get_certificate() {
    std::unique_lock lock(certificate_mutex);
    return certificate;
}

uint16_t webui::get_port() {
    return port;
}

std::string webui::get_ip() {
    std::string address = webui::https() ? "https://" : "http://";
    return address.append(ip_address).append(":").append(std::to_string(webui::get_port()));
}
