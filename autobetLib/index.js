const autobetLib_native = require("./bin/autobetLib.node");

/**
 * Get the caller file and line
 * 
 * @returns {callerInfo | undefinedCallerInfo} the caller info
 */
function getFileLine() {
    /**
     * Create a caller info
     * 
     * @param {string} file the caller file
     * @param {number} line the caller line
     */
    function callerInfo(file, line) {
        this.file = file;
        this.line = line;
    }

    /**
     * Create a undefined caller info
     */
    function undefinedCallerInfo() {
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
}

module.exports = {
    /**
     * Initialize everything
     *
     * @return {Promise<Boolean>} true, if the startup was successful
     */
    init: async function () {
        return await autobetLib_native.lib_init();
    },
    /**
     * Start the main loop
     *
     * @return {Promise<void>}
     */
    start: async function () {
        await autobetLib_native.lib_start();
    },
    /**
     * Start the web ui
     *
     * @return {Promise<Boolean>} true, if the web ui could be started
     */
    startWebServer: async function () {
        return await autobetLib_native.lib_startWebServer();
    },
    /**
     * Check if GTA V is running
     *
     * @returns {Boolean} true, if it is running
     */
    getGtaRunning: function () {
        return autobetLib_native.lib_node_get_gta_running();
    },
    /**
     * Load the winnings
     *
     * @return {Promise<void>}
     */
    loadWinnings: async function () {
        await autobetLib_native.lib_loadWinnings();
    },
    /**
     * Get this computer's IPv4 address
     *
     * @returns {String} the IP address as a string
     */
    getIP: function () {
        return autobetLib_native.lib_node_getIP();
    },
    /**
     * Open the web ui website
     */
    openWebsite: function () {
        autobetLib_native.lib_open_website();
    },
    /**
     * Check if the betting has been stopped
     *
     * @returns {Boolean} true, if the betting has been stopped
     */
    stopped: function () {
        return autobetLib_native.lib_node_stopped();
    },
    /**
     * Get the time the betting has been running
     *
     * @returns {Number} the time in seconds
     */
    getTimeRunning: function () {
        return autobetLib_native.lib_node_get_time();
    },
    /**
     * Set if the script is starting
     *
     * @param starting {Boolean} true, if it is starting, false otherwhise
     */
    setStarting: function (starting) {
        autobetLib_native.lib_set_starting(starting);
    },
    /**
     * Start the betting
     */
    startBetting: function () {
        autobetLib_native.lib_node_js_start_script();
    },
    /**
     * Stop the betting
     */
    stopBetting: function () {
        autobetLib_native.lib_node_js_stop_script();
    },
    /**
     * Callbacks to set
     */
    callbacks: {
        /**
         * Set the callback function to get if GTA is running
         *
         * @param callback {function(boolean): void} the callback function
         */
        setGtaRunningCallback: function (callback) {
            autobetLib_native.lib_setSet_gta_running(callback).catch(() => {
            });
        },
        /**
         * Set the callback function to add money
         *
         * @param callback {function(Number): void} the callback function
         * @return {void}
         */
        setAddMoneyCallback: function (callback) {
            autobetLib_native.lib_setAddMoneyCallback(callback).catch(() => {
            });
        },
        /**
         * Set the callback function to set all money made
         *
         * @param callback {function(Number): void} the callback function
         * @return {void}
         */
        setAllMoneyMadeCallback: function (callback) {
            autobetLib_native.lib_setSetAllMoneyMadeCallback(callback).catch(() => {
            });
        },
        /**
         * Set the callback function to the script being started
         *
         * @param callback {function(): void} the callback function
         * @return {void}
         */
        setUiKeycombStartCallback: function (callback) {
            autobetLib_native.lib_setUiKeycombStartCallback(callback).catch(() => {
            });
        },
        /**
         * Set the callback function to the script being stopped
         *
         * @param callback {function(): void} the callback function
         * @return {void}
         */
        setUiKeycombStopCallback: function (callback) {
            autobetLib_native.lib_setUiKeycombStopCallback(callback).catch(() => {
            });
        },
        /**
         * Set the callback function to stop the program
         *
         * @param quit {function(): void} the callback function
         * @return {void}
         */
        setQuitCallback: function (quit) {
            autobetLib_native.lib_setQuitCallback(quit);
        },
        /**
         * Set the callback function when an exception occurs
         *
         * @param exception {function(): void} the callback function
         * @return {void}
         */
        setExceptionCallback: function (exception) {
            autobetLib_native.lib_setExceptionCallback(exception).catch(() => {
            });
        }
    },
    /**
     * A namespace for the custom betting function
     */
    customBettingFunction: {
        /**
         * Set the callback function to get the horse to bet on
         *
         * @param func {function(string[]): number} the callback function
         * @return {void}
         */
        setBettingPositionCallback: function (func) {
            autobetLib_native.lib_setBettingPositionCallback(func).catch(() => {
            });
        },
        /**
         * Set whether to use the custom betting function
         * 
         * @param {boolean} val whether to use the function
         */
        setUseBettingFunction: function (val) {
            autobetLib_native.lib_setUseBettingFunction(val);
        }
    },
    /**
     * A logging namespace
     */
    logging: {
        /**
         * Set a logging function
         *
         * @param log {function(string): void} the logging function
         * @return {void}
         */
        setLogCallback: function (log) {
            autobetLib_native.lib_setLogCallback(log).catch(() => {
            });
        },
        /**
         * Check if the program is logging to a file
         *
         * @return {Boolean} true, if it is logging to a file
         */
        isLoggingToFile: function () {
            return autobetLib_native.lib_node_logToFile();
        },
        /**
         * Set if the program should log to a file
         *
         * @param logToFile {Boolean} true, if it should log to a file
         */
        setLogToFile: function (logToFile) {
            autobetLib_native.lib_node_setLogToFile(logToFile);
        },
        /**
         * Check if the program is logging to the console
         *
         * @return {Boolean} true, if it is logging to the console
         */
        isLoggingToConsole: function () {
            return autobetLib_native.lib_node_logToConsole();
        },
        /**
         * Set if the program should log to the console
         *
         * @param logToConsole {Boolean} true, if it should log to the console
         */
        setLogToConsole: function (logToConsole) {
            autobetLib_native.lib_node_setLogToConsole(logToConsole);
        },
        /**
         * Log a debug message
         * 
         * @param {string} message the message to log
         */
        debug: function (message) {
            const info = getFileLine();
            autobetLib_native.lib_node_debug(info.file, info.line, message);
        },
        /**
         * Log a warning message
         * 
         * @param {string} message the message to log
         */
        warn: function (message) {
            const info = getFileLine();
            autobetLib_native.lib_node_warn(info.file, info.line, message);
        },
        /**
         * Log an error message
         * 
         * @param {string} message the message to log
         */
        error: function (message) {
            const info = getFileLine();
            autobetLib_native.lib_node_error(info.file, info.line, message);
        }
    },
    /**
     * A settings namespace
     */
    settings: {
        /**
         * Set if the program should collect full debugging info
         *
         * @param debugFull {Boolean} if the program should collect full debugging info
         * @return {Promise<Boolean>} true, if the operation was successful, false otherwise
         */
        setDebugFull: async function (debugFull) {
            return await autobetLib_native.lib_setDebugFull(debugFull);
        },
        /**
         * Set if the web server should be used
         *
         * @param webServer {Boolean} true, if it should be used
         * @return {Promise<Boolean>} true, if the operation was successful, false otherwise
         */
        setWebServer: async function (webServer) {
            return await autobetLib_native.lib_setWebServer(webServer);
        },
        /**
         * Get if the web server is activated in the settings
         *
         * @return {Boolean} true, if the web server was activated
         */
        webServerActivated: function () {
            return autobetLib_native.lib_node_getWebServer();
        },
        /**
         * Check if the web server is running
         *
         * @return {Boolean} true, if it is running
         */
        webServerRunning: function () {
            return autobetLib_native.lib_webServerRunning();
        },
        /**
         * Set the time to sleep between bets
         *
         * @param timeSleep {Number} the time to sleep
         */
        setTimeSleep: function (timeSleep) {
            autobetLib_native.lib_setTimeSleep(timeSleep);
        },
        /**
         * Get the time to sleep between bets
         *
         * @return {Number} the time to sleep
         */
        getTimeSleep: function () {
            return autobetLib_native.lib_getTimeSleep();
        },
        /**
         * Save the settings
         *
         * @return {Promise<void>}
         */
        saveSettings: async function () {
            await autobetLib_native.lib_saveSettings();
        }
    },
    /**
     * Quit
     */
    quit: function () {
        autobetLib_native.lib_napi_quit();
    },
    /**
     * Start the shutdown hook
     *
     * @return {Promise<void>}
     */
    shutdown: async function () {
        await autobetLib_native.lib_stop();
    }
};