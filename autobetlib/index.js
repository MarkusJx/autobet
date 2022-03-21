const autobetLib_native = require("./bin/autobetLib.node");

// Set the autobetlib version
const autobetlib_version = require('./package.json').version;
autobetLib_native.lib_setAutobetlibVersion(autobetlib_version);

const navStrategy = {
    MOUSE: 0,
    CONTROLLER: 1
};

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
        },
        getUpnpEnabled: function () {
            return autobetLib_native.lib_getUpnpEnabled();
        },
        setUpnpEnabled: function (enabled) {
            return autobetLib_native.lib_setUpnpEnabled(enabled);
        }
    },
    windows: {
        getOpenWindows: async function() {
            return await autobetLib_native.lib_getAllOpenWindows();
        },
        setGameWindowName: function(programName, processName) {
            return autobetLib_native.lib_setGameWindow(programName, processName);
        },
        getGameWindowName: function() {
            return autobetLib_native.lib_getGameWindow();
        }
    },
    uiNavigation: {
        navigationStrategy: navStrategy,
        setNavigationStrategy: function (strategy) {
            let n = -1;
            switch (strategy) {
                case navStrategy.MOUSE:
                    n = 0;
                    break;
                case navStrategy.CONTROLLER:
                    n = 1;
                    break;
            }

            return autobetLib_native.lib_setNavigationStrategy(n);
        },
        getNavigationStrategy: async function () {
            const strategy = await autobetLib_native.lib_getNavigationStrategy();
            //console.log("Strategy: " + strategy);
            if (strategy < 0) {
                return navStrategy.MOUSE;
            } else {
                return strategy;
            }
        },
        clicks: {
            setClickSleep: async function (time) {
                await autobetLib_native.lib_setClickSleep(time);
            },
            setAfterClickSleep: async function (time) {
                await autobetLib_native.lib_setAfterClickSleep(time);
            },
            getClickSleep: function () {
                return autobetLib_native.lib_getClickSleep();
            },
            getAfterClickSleep: function () {
                return autobetLib_native.lib_getAfterClickSleep();
            }
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
                    translations.push(...translations_file[lang]);
                }
            }

            autobetLib_native.lib_setOddTranslations(translations);
        } catch (e) {
        }
    },
    programIsRunning: function () {
        return autobetLib_native.lib_programIsRunning();
    },
    maySupportHttps: function () {
        return autobetLib_native.lib_maySupportHttps();
    },
    getCertificateInfo: function () {
        return autobetLib_native.lib_getCertificateInfo();
    },
    getCollectHistoricData: function () {
        return autobetLib_native.lib_getCollectHistoricData();
    },
    setCollectHistoricData: function (val) {
        return autobetLib_native.lib_setCollectHistoricData(val);
    }
};