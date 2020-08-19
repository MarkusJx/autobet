const autobetLib_native = require("./bin/autobetLib.node");

module.exports = {
    /**
     * Initialize everything
     *
     * @param argv {String[]} the command-line arguments to pass through
     * @return {Boolean} true, if the startup was successful
     */
    init: function(argv) {
        return autobetLib_native.lib_init(argv);
    },
    /**
     * Start the main loop
     */
    start: function () {
        autobetLib_native.lib_start();
    },
    /**
     * Start the shutdown hook
     */
    shutdown: function () {
        autobetLib_native.lib_stop();
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
     * @param callback {function(boolean): void} the callback function
     * @return {void}
     */
    setAddMoneyCallback: function(callback) {
        autobetLib_native.lib_setAddMoneyCallback(callback);
    },
    /**
     * Set the callback function to set all money made
     *
     * @param callback {function(boolean): void} the callback function
     * @return {void}
     */
    setAllMoneyMadeCallback: function (callback) {
        autobetLib_native.lib_setSetAllMoneyMadeCallback(callback);
    },
    /**
     * Set the callback function to the script being started
     *
     * @param callback {function(boolean): void} the callback function
     * @return {void}
     */
    setUiKeycombStartCallback: function (callback) {
        autobetLib_native.lib_setUiKeycombStartCallback(callback);
    },
    /**
     * Set the callback function to the script being stopped
     *
     * @param callback {function(boolean): void} the callback function
     * @return {void}
     */
    setUiKeycombStopCallback: function (callback) {
        autobetLib_native.lib_setUiKeycombStopCallback(callback);
    }
};