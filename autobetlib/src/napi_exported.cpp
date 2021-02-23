#include <fstream>

#include "napi_exported.hpp"
#include "webui.hpp"
#include "util/utils.hpp"
#include "debug/debug.hpp"
#include "settings.hpp"
#include "autostop.hpp"
#include "opencv_link.hpp"
#include "variables.hpp"
#include "autobetException.hpp"
#include "control.hpp"
#include "betting.hpp"
#include "logger.hpp"
#include "windowUtils.hpp"

#define NAPI_TOOLS_CALLBACK_SLEEP_TIME 100

#include "n_api/napi_tools.hpp"

using namespace logger;
using namespace napi_tools;

/**
 * The current autobetlib version
 */
std::string autobetlib_version;

bool bettingFunctionSet = false;

std::function<void()> quit = {};

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

// A callback to be called when the betting is stopped due to an error
callbacks::callback<void(std::string)> bettingExceptionCallback = nullptr;

// EndCallbacks ===========================================

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
                napi_exported::exception();
            });
            return false;
        }

        // Read the config if it exists
        if (utils::fileExists("autobet.conf")) {
            StaticLogger::debug("Settings file exists. Loading it");
            bool debug, log, web_server;
            uint32_t time_sleep;
            settings::load(debug, log, web_server, time_sleep);
            variables::webServer = web_server;
            variables::time_sleep = time_sleep;

            logger::setLogToFile(debug);
            logger::setLogToConsole(log);
        }

        // Log the current version
        if (napi_exported::getAutobetlibVersion().empty()) {
            StaticLogger::debug("Initializing autobetlib version [unknown]");
        } else {
            StaticLogger::debugStream() << "Initializing autobetlib version " << napi_exported::getAutobetlibVersion();
        }

        if (log_deleted) {
            StaticLogger::debug("The last log file was deleted since it is older than 7 days");
        }

        utils::setDpiAware();

        // Print some system information
        utils::printSystemInformation();
        utils::setCtrlCHandler([] {
            StaticLogger::debug("Shutdown event hit. Shutting down");
            quit();
        });

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
                napi_exported::exception();
            });
            return false;
        }

        StaticLogger::debug("Initializing AI");
        StaticLogger::debugStream() << "The knn was compiled using opencv version " << opencv_link::getOpenCvVersion();

        // Try to initialize the knn
        try {
            variables::knn = opencv_link::knn("resources/data/model.yml");
        } catch (const std::bad_alloc &) {
            StaticLogger::error("Could not initialize AI: Unable to allocate memory");
            utils::displayError("Could not initialize AI\nNot enough memory", [] {
                napi_exported::exception();
            });
            return false;
        } catch (...) {
            StaticLogger::error("Could not initialize AI: Unknown error");
            utils::displayError("Could not initialize AI\nUnknown error", [] {
                napi_exported::exception();
            });
            return false;
        }

        StaticLogger::debug("Successfully initialized AI");

        variables::keyCombListen = true;
        std::thread keyCombThread(control::listenForKeycomb);
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
        variables::runLoops = true;

        while (variables::runLoops) {
            try {
                betting::mainLoop();
            } catch (const autobetException &e) {
                StaticLogger::errorStream() << "Exception thrown in the main loop: " << e.what();
                napi_exported::exception();
                utils::displayError(e.what(), [] {
                    quit();
                });
            }

            // Sleep until the betting is started.
            // Will still call the mainLoop() every 10 seconds
            // to see if the game is running
            for (int i = 0; i < 100; i++) {
                std::this_thread::sleep_for(std::chrono::milliseconds(100));
                if (variables::running) {
                    break;
                }
            }
        }
    });
}

/**
 * Stop the autobet native module
 */
Napi::Promise stop(const Napi::CallbackInfo &info) {
    return promises::promise<void>(info.Env(), [] {
        control::kill(false);
    });
}

/**
 * Get the time the betting is running
 */
Napi::Number node_get_time(const Napi::CallbackInfo &info) {
    return Napi::Number::New(info.Env(), static_cast<double>(variables::time_running));
}

/**
 * Get if gta is running
 */
Napi::Boolean node_get_gta_running(const Napi::CallbackInfo &info) {
    return Napi::Boolean::New(info.Env(), variables::gtaVRunning);
}

/**
 * Start the betting from node.js
 */
void node_js_start_script(const Napi::CallbackInfo &) {
    control::start_script();
}

/**
 * Stop the betting from node.js
 */
void node_js_stop_script(const Napi::CallbackInfo &) {
    control::stop_script();
}

/**
 * Set if the start button was pressed in the ui
 */
void set_starting(const Napi::CallbackInfo &info) {
    CHECK_ARGS(napi_tools::napi_type::boolean);
    variables::starting = info[0].ToBoolean();
    webui::setStarting();
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
            variables::winnings_all = 0;
            control::writeWinnings();
            return;
        }

        // Initialize the ifstream
        std::ifstream ifs("winnings.dat", std::ios::in | std::ios::binary);
        if (!ifs.good()) {
            StaticLogger::error("Unable to open winnings file. Flags: " + std::to_string(ifs.flags()));
            goto writeWinnings;
        }

        // Read the file
        int64_t winnings_all;
        ifs.read((char *) &winnings_all, sizeof(int64_t));
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

        variables::winnings_all = winnings_all;
        StaticLogger::debugStream() << "Read winnings: " << variables::winnings_all;
        napi_exported::setAllMoneyMade(static_cast<int>(variables::winnings_all));
    });
}

/**
 * Get the IP address of this machine from the node process
 */
Napi::String node_getIP(const Napi::CallbackInfo &info) {
    return Napi::String::New(info.Env(), utils::getIP());
}

/**
 * Open the web ui
 */
void open_website(const Napi::CallbackInfo &) {
    std::string addr = "http://";
    addr.append(utils::getIP()).append(":8027");
    if (utils::openWebsite(addr)) {
        StaticLogger::debug("Opened website");
    } else {
        StaticLogger::error("Unable to open Web page");
    }
}

Napi::Boolean node_stopped(const Napi::CallbackInfo &info) {
    return Napi::Boolean::New(info.Env(), control::stopped());
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
        // Use a raw callback in here, as any other callback would get deleted
        auto *q = new callbacks::javascriptCallback<void()>(info);
        quit = [q] {
            control::kill(false);
            std::this_thread::sleep_for(std::chrono::milliseconds(100));
            q->asyncCall();
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
 * Set the bettingExceptionCallback, which is called whenever
 * the betting is stopped due to an exception thrown
 */
Napi::Promise setBettingExceptionCallback(const Napi::CallbackInfo &info) {
    if (bettingExceptionCallback) throw Napi::Error::New(info.Env(), "bettingExceptionCallback is already defined");
    TRY
        bettingExceptionCallback = callbacks::callback<void(std::string)>(info);
        return bettingExceptionCallback.getPromise();
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
            if (!variables::debug_full) {
                if (!debug::init()) {
                    StaticLogger::error("Could not create debug folder. Cannot collect debug information");
                    return false;
                }
                variables::debug_full = true;
            }
            return true;
        } else {
            // Only destroy if debug_full is already running
            if (variables::debug_full) {
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
                variables::debug_full = false;
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
            variables::webServer = true;
            if (!webui::initialized()) {
                // If web ui isn't already started, start it
                return webui::startWebUi(utils::getIP());
            } else {
                // The web server already exists
                StaticLogger::warning("Tried to start webUi server, but it already is running");
                return false;
            }
        } else {
            variables::webServer = false;
            return webui::reset();
        }
    });
}

/**
 * Start the web server
 */
Napi::Promise startWebServer(const Napi::CallbackInfo &info) {
    return promises::promise<bool>(info.Env(), [] {
        if (variables::webServer) {
            StaticLogger::debug("Trying to start web ui");
            if (webui::startWebUi(utils::getIP())) {
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
    return Napi::Boolean::New(info.Env(), variables::webServer);
}

/**
 * Check if the web server is running
 */
Napi::Boolean webServerRunning(const Napi::CallbackInfo &info) {
    if (webui::initialized()) {
        return Napi::Boolean::New(info.Env(), webui::running());
    } else {
        return Napi::Boolean::New(info.Env(), false);
    }
}

/**
 * Set the time to sleep between bets
 */
void setTimeSleep(const Napi::CallbackInfo &info) {
    CHECK_ARGS(napi_tools::napi_type::number);
    variables::time_sleep = info[0].ToNumber().operator unsigned int();
}

/**
 * Get the time to sleep between bets
 */
Napi::Number getTimeSleep(const Napi::CallbackInfo &info) {
    return Napi::Number::New(info.Env(), variables::time_sleep);
}

/**
 * Save the settings
 */
Napi::Promise saveSettings(const Napi::CallbackInfo &info) {
    return promises::promise<void>(info.Env(), [] {
        settings::save(logger::logToFile(), logger::logToConsole(), variables::webServer, variables::time_sleep);
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
            file = info[0].ToString().Utf8Value();
            line = info[1].ToNumber().Int32Value();
        }

        message = info[2].ToString().Utf8Value();
    }

    std::string file;
    int32_t line;
    std::string message;
};

/**
 * Print a debug message from node.js
 */
Napi::Value node_debug(const Napi::CallbackInfo &info) {
    if (!logger::logToFile() && !logger::logToConsole())
        return info.Env().Undefined();
    file_line_message dt(info);

    return promises::promise<void>(info.Env(), [dt] {
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

    return promises::promise<void>(info.Env(), [dt] {
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

    return promises::promise<void>(info.Env(), [dt] {
        StaticLogger::_error(dt.file.c_str(), dt.line, dt.message);
    });
}

/**
 * Set the current autobetlib version
 */
void setAutobetlibVersion(const Napi::CallbackInfo &info) {
    CHECK_ARGS(string);
    TRY
        autobetlib_version = info[0].ToString().Utf8Value();
    CATCH_EXCEPTIONS
}

/**
 * Set the odd translations map
 */
void setOddTranslations(const Napi::CallbackInfo &info) {
    CHECK_ARGS(array);
    auto arr = info[0].As<Napi::Array>();
    std::map<std::string, std::string> translations;
    for (uint32_t i = 0; i < arr.Length(); i++) {
        auto obj = arr.Get(i).As<Napi::Object>();
        translations.insert_or_assign(obj.Get("from").ToString(), obj.Get("to").ToString());
    }

    StaticLogger::debug("Setting odd translations");
    opencv_link::knn::setOddTranslations(translations);
}

/**
 * Check if autobet is already running
 */
Napi::Boolean programIsRunning(const Napi::CallbackInfo &info) {
    TRY
        bool val = utils::isAlreadyRunning("autobet");
        if (val) {
            utils::displayError("Autobet is already running", [] {
                try {
                    control::kill(true);
                } catch (...) {}
            });
        }

        return Napi::Boolean::New(info.Env(), val);
    CATCH_EXCEPTIONS
}

Napi::Promise getAllOpenWindows(const Napi::CallbackInfo &info) {
    using map_type = std::map<std::u16string, std::vector<std::string>>;
    return promises::promise<map_type>(info.Env(), [] {
        map_type res;
        for (const auto &w : windowUtils::getAllOpenWindows()) {
            std::wstring w_program_name = w->getProgramName();
            std::u16string program_name(w_program_name.begin(), w_program_name.end());
            for (const auto &p : w->getProcesses()) {
                if (res.contains(program_name)) {
                    res.at(program_name).push_back(p->getWindowName());
                } else {
                    std::vector<std::string> to_insert;
                    to_insert.push_back(p->getWindowName());

                    res.insert_or_assign(program_name, to_insert);
                }
            }
        }

        return res;
    });
}

void setGameWindow(const Napi::CallbackInfo &info) {
    CHECK_ARGS(string, string);
    try {
        std::string program_name = info[0].ToString();
        std::string process_name = info[1].ToString();

        variables::setProgramName(program_name);
        variables::setProcessName(process_name);
    } catch (const std::exception &e) {
        StaticLogger::errorStream() << e.what();
    }
}

void setNavigationStrategy(const Napi::CallbackInfo &info) {
    CHECK_ARGS(number);
    TRY
        int n = info[0].ToNumber();
        switch (n) {
            case 0:
                variables::navigationStrategy = std::make_shared<uiNavigationStrategies::mouseNavigationStrategy>();
                break;
            case 1:
                variables::navigationStrategy = std::make_shared<uiNavigationStrategies::controllerNavigationStrategy>();
                break;
            default:
                throw std::runtime_error("Invalid number supplied");
        }
    CATCH_EXCEPTIONS
}

#define export(func) exports.Set("lib_" #func, Napi::Function::New(env, func))

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
    export(setBettingExceptionCallback);

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

    export(setAutobetlibVersion);
    export(setOddTranslations);
    export(programIsRunning);

    export(getAllOpenWindows);
    export(setGameWindow);
    export(setNavigationStrategy);

    try {
        betting::setWebUiFunctions();
        variables::setProgramName("GTA5.exe");
        variables::setProcessName("Grand Theft Auto V");

        quit = [] {
            try {
                control::kill(true);
            } catch (...) {}
        };
    } catch (std::exception &e) {
        throw Napi::Error::New(env, e.what());
    } catch (...) {
        throw Napi::Error::New(env, "An unknown exception occurred");
    }

    return exports;
}

NODE_API_MODULE(autobetLib, InitAll)

// Functions to call node functions

void napi_exported::node_quit() {
    quit();
}

void napi_exported::node_log(const std::string &val) {
    if (logCallback) logCallback(val);
}

void napi_exported::stopCallbacks() {
    if (setGtaRunningCallback) setGtaRunningCallback.stop();
    if (setAllMoneyMadeCallback) setAllMoneyMadeCallback.stop();
    if (addMoneyCallback) addMoneyCallback.stop();
    if (uiKeycombStartCallback) uiKeycombStartCallback.stop();
    if (uiKeycombStopCallback) uiKeycombStopCallback.stop();
    if (exceptionCallback) exceptionCallback.stop();
    if (logCallback) logCallback.stop();
    if (bettingPositionCallback) bettingPositionCallback.stop();
    if (bettingExceptionCallback) bettingExceptionCallback.stop();
}

bool napi_exported::isBettingFunctionSet() {
    return bettingFunctionSet;
}

std::string napi_exported::getAutobetlibVersion() {
    return autobetlib_version;
}

void napi_exported::setGtaRunning(bool val) {
    setGtaRunningCallback(val);
}

std::promise<int> napi_exported::getBettingPosition(const std::vector<std::string> &v) {
    return bettingPositionCallback(v);
}

void napi_exported::setAllMoneyMade(int val) {
    setAllMoneyMadeCallback(val);
}

void napi_exported::addMoney(int val) {
    addMoneyCallback(val);
}

void napi_exported::keyCombStart() {
    uiKeycombStartCallback();
}

void napi_exported::keyCombStop() {
    uiKeycombStopCallback();
}

void napi_exported::bettingException(const std::string &err) {
    bettingExceptionCallback(err);
}

void napi_exported::exception() {
    try {
        if (exceptionCallback) exceptionCallback();
    } catch (...) {}
}