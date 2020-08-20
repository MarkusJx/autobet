const autobetLib_native = require("./bin/autobetLib.node");

module.exports = {
    /**
     * Initialize everything
     *
     * @param argv {String[]} the command-line arguments to pass through
     * @return {Promise<void>} true, if the startup was successful
     */
    init: function (argv) {
        return new Promise((resolve, reject) => {
            if (autobetLib_native.lib_init(argv)) {
                resolve();
            } else {
                reject();
            }
        });
    },
    /**
     * Start the main loop
     */
    start: function () {
        autobetLib_native.lib_start();
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
     */
    loadWinnings: function () {
        autobetLib_native.lib_loadWinnings();
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
     * Set the callback function to get if GTA is running
     *
     * @param callback {function(boolean): void} the callback function
     */
    setGtaRunningCallback: function (callback) {
        autobetLib_native.lib_setSet_gta_running(callback);
    },
    /**
     * Set the callback function to add money
     *
     * @param callback {function(Number): void} the callback function
     * @return {void}
     */
    setAddMoneyCallback: function (callback) {
        autobetLib_native.lib_setAddMoneyCallback(callback);
    },
    /**
     * Set the callback function to set all money made
     *
     * @param callback {function(Number): void} the callback function
     * @return {void}
     */
    setAllMoneyMadeCallback: function (callback) {
        autobetLib_native.lib_setSetAllMoneyMadeCallback(callback);
    },
    /**
     * Set the callback function to the script being started
     *
     * @param callback {function(): void} the callback function
     * @return {void}
     */
    setUiKeycombStartCallback: function (callback) {
        autobetLib_native.lib_setUiKeycombStartCallback(callback);
    },
    /**
     * Set the callback function to the script being stopped
     *
     * @param callback {function(): void} the callback function
     * @return {void}
     */
    setUiKeycombStopCallback: function (callback) {
        autobetLib_native.lib_setUiKeycombStopCallback(callback);
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
        autobetLib_native.lib_setExceptionCallback(exception);
    },
    /**
     * Quit
     */
    quit: function () {
        autobetLib_native.lib_napi_quit();
    },
    /**
     * Start the shutdown hook
     */
    shutdown: function () {
        autobetLib_native.lib_stop();
    }
};