const autobetLib_native = require("./bin/autobetLib.node");

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
         * Set a position for the 'increase bet' button
         *
         * @param pos {Number} the position
         */
        setCustomBettingPos: function (pos) {
            autobetLib_native.lib_setCustomBettingPos(pos);
        },
        /**
         * Get the current position for the 'increase bet' button
         *
         * @return {Number} the position set by the user
         */
        getCustomBettingPos: function () {
            return autobetLib_native.lib_getCustomBettingPos();
        },
        /**
         * Set templates for the 'increase bet' button
         *
         * @param template {Array.<{resolution: Number, value: Number}>} the template array
         */
        setBettingPosTemplate: function (template) {
            autobetLib_native.lib_setBettingPosTemplate(template);
        },
        /**
         * Get the templates for the 'increase bet' button
         *
         * @return {Array.<{resolution: Number, value: Number}>} the template array
         */
        getBettingPosTemplate: function () {
            return autobetLib_native.lib_getBettingPosTemplate();
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
         * Set the clicks needed for a max bet
         *
         * @param clicks {Number} the number of clicks
         */
        setClicks: function (clicks) {
            autobetLib_native.lib_setClicks(clicks);
        },
        /**
         * Get the clicks needed for a max bet
         *
         * @return {Number} the number of clicks
         */
        getClicks: function () {
            return autobetLib_native.lib_getClicks();
        },
        /**
         * Save the settings
         *
         * @return {Promise<void>}
         */
        saveSettings: async function () {
            await autobetLib_native.lib_saveSettings();
        },
        /**
         * Load the settings
         *
         * @return {Promise<Boolean>} true, if the settings file exists
         */
        loadSettings: async function () {
            return await autobetLib_native.lib_loadSettings();
        }
    },
    /**
     * Controller simulation namespace
     */
    controller: {
        /**
         * Set whether to use the controller
         *
         * @param useController {Boolean} true, if the program should use it
         * @return {Promise<Boolean>} true, if the operation was successful
         */
        setUseController: async function (useController) {
            return await autobetLib_native.lib_setUseController(useController);
        },
        /**
         * Check if the program is using the controller
         *
         * @return {Boolean} true, if it is using the controller
         */
        getUseController: function () {
            return autobetLib_native.lib_getUseController();
        },
        /**
         * Check if the program could use the controller
         *
         * @return {Boolean} true if a virtual controller is plugged in
         */
        canUseController: function () {
            return autobetLib_native.lib_canUseController();
        },
        /**
         * Check if scpVBus is installed
         *
         * @return {Boolean} true, if it is installed
         */
        scpVBusInstalled: function () {
            return autobetLib_native.lib_scpVBusInstalled();
        },
        /**
         * Install scpVBus
         *
         * @return {Promise<Boolean>} true, if the installation was successful
         */
        installScpVBus: async function () {
            return await autobetLib_native.lib_installScpVBus();
        },
        /**
         * Uninstall scpVBus
         *
         * @return {Promise<Boolean>} true, if the removal was successful
         */
        uninstallScpVBus: async function () {
            return await autobetLib_native.lib_uninstallScpVBus();
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