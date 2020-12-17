const autobetLib_native = require("./bin/autobetLib.node");

// Set the autobetlib version
const autobetlib_version = require('./package.json').version;
autobetLib_native.lib_setAutobetlibVersion(autobetlib_version);

/**
 * Get the caller file and line
 *
 * @returns {callerInfo | undefinedCallerInfo} the caller info
 */
//function getFileLine() {
    /**
     * Create a caller info
     *
     * @param {string} file the caller file
     * @param {number} line the caller line
     */
    /*function callerInfo(file, line) {
        this.file = file;
        this.line = line;
    }*/

    /**
     * Create a undefined caller info
     */
    /*function undefinedCallerInfo() {
        this.file = undefined;
        this.line = undefined;
    }

    // Get the stack using an error
    const err = new Error();
    const stack = err.stack.toString().split(/\r\n|\n/);

    // Check if the stack trace is long enough
    if (stack.length >= 4) {
        const fileLineRegex = /[a-zA-Z]+\.(js|ts):[0-9]+:[0-9]+/;
        let obj = stack[3].match(fileLineRegex);
        if (obj != null) {
            obj = obj[0].split(":");
            const file = obj[0];
            const line = Number.parseInt(obj[1]);
            return new callerInfo(file, line);
        } else {
            return new undefinedCallerInfo();
        }
    } else {
        return new undefinedCallerInfo();
    }
}*/

module.exports = {
    init: async function () {
        return await autobetLib_native.lib_init();
    },
    start: async function () {
        await autobetLib_native.lib_start();
    },
    startWebServer: async function () {
        return await autobetLib_native.lib_startWebServer();
    },
    getGtaRunning: function () {
        return autobetLib_native.lib_node_get_gta_running();
    },
    loadWinnings: async function () {
        await autobetLib_native.lib_loadWinnings();
    },
    getIP: function () {
        return autobetLib_native.lib_node_getIP();
    },
    openWebsite: function () {
        autobetLib_native.lib_open_website();
    },
    stopped: function () {
        return autobetLib_native.lib_node_stopped();
    },
    getTimeRunning: function () {
        return autobetLib_native.lib_node_get_time();
    },
    setStarting: function (starting) {
        autobetLib_native.lib_set_starting(starting);
    },
    startBetting: function () {
        autobetLib_native.lib_node_js_start_script();
    },
    stopBetting: function () {
        autobetLib_native.lib_node_js_stop_script();
    },
    callbacks: {
        setGtaRunningCallback: function (callback) {
            autobetLib_native.lib_setSet_gta_running(callback).catch(() => {
            });
        },
        setAddMoneyCallback: function (callback) {
            autobetLib_native.lib_setAddMoneyCallback(callback).catch(() => {
            });
        },
        setAllMoneyMadeCallback: function (callback) {
            autobetLib_native.lib_setSetAllMoneyMadeCallback(callback).catch(() => {
            });
        },
        setUiKeycombStartCallback: function (callback) {
            autobetLib_native.lib_setUiKeycombStartCallback(callback).catch(() => {
            });
        },
        setUiKeycombStopCallback: function (callback) {
            autobetLib_native.lib_setUiKeycombStopCallback(callback).catch(() => {
            });
        },
        setQuitCallback: function (quit) {
            autobetLib_native.lib_setQuitCallback(quit);
        },
        setExceptionCallback: function (exception) {
            autobetLib_native.lib_setExceptionCallback(exception).catch(() => {
            });
        },
        setBettingExceptionCallback: function (callback) {
            autobetLib_native.lib_setBettingExceptionCallback(callback).catch(() => {
            });
        }
    },
    customBettingFunction: {
        setBettingPositionCallback: function (func) {
            autobetLib_native.lib_setBettingPositionCallback(func).catch(() => {
            });
        },
        setUseBettingFunction: function (val) {
            autobetLib_native.lib_setUseBettingFunction(val);
        }
    },
    logging: {
        setLogCallback: function (log) {
            autobetLib_native.lib_setLogCallback(log).catch(() => {
            });
        },
        isLoggingToFile: function () {
            return autobetLib_native.lib_node_logToFile();
        },
        setLogToFile: function (logToFile) {
            autobetLib_native.lib_node_setLogToFile(logToFile);
        },
        isLoggingToConsole: function () {
            return autobetLib_native.lib_node_logToConsole();
        },
        setLogToConsole: function (logToConsole) {
            autobetLib_native.lib_node_setLogToConsole(logToConsole);
        },
        debug: function (file, message) {
            //const info = getFileLine();
            //autobetLib_native.lib_node_debug(info.file, info.line, message);
            autobetLib_native.lib_node_debug(file, 1, message);
        },
        warn: function (file, message) {
            //const info = getFileLine();
            //autobetLib_native.lib_node_warn(info.file, info.line, message);
            autobetLib_native.lib_node_warn(file, 1, message);
        },
        error: function (file, message) {
            //const info = getFileLine();
            //autobetLib_native.lib_node_error(info.file, info.line, message);
            autobetLib_native.lib_node_error(file, 1, message);
        }
    },
    settings: {
        setDebugFull: async function (debugFull) {
            return await autobetLib_native.lib_setDebugFull(debugFull);
        },
        setWebServer: async function (webServer) {
            return await autobetLib_native.lib_setWebServer(webServer);
        },
        webServerActivated: function () {
            return autobetLib_native.lib_node_getWebServer();
        },
        webServerRunning: function () {
            return autobetLib_native.lib_webServerRunning();
        },
        setTimeSleep: function (timeSleep) {
            autobetLib_native.lib_setTimeSleep(timeSleep);
        },
        getTimeSleep: function () {
            return autobetLib_native.lib_getTimeSleep();
        },
        saveSettings: async function () {
            await autobetLib_native.lib_saveSettings();
        }
    },
    quit: function () {
        autobetLib_native.lib_napi_quit();
    },
    shutdown: async function () {
        await autobetLib_native.lib_stop();
    },
    setOddTranslations: function () {
        try {
            const translations = [];
            const translations_file = require('./odd_translations.json');
            for (let lang in translations_file) {
                if (translations_file.hasOwnProperty(lang)) {
                    translations.push(translations_file[lang]);
                }
            }

            autobetLib_native.lib_setOddTranslations(translations);
        } catch (e) {
        }
    }
};