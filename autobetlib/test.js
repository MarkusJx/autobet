'use strict';
const autobetLib = require("./index");
const SegfaultHandler = require('segfault-handler');

SegfaultHandler.registerHandler();

/**
 * Whether GTA is running
 */
let gta_running = false;

/**
 * A function to be called when a fatal exception is thrown
 */
function exception() {
    console.log("exception() called");
    autobetLib.shutdown();
}

//try {
async function setQuitCallback() {
    autobetLib.callbacks.setQuitCallback(() => {
        console.log("Quit callback called");
        process.exit();
    });
}

setQuitCallback();

// Set the betting exception callback function
autobetLib.callbacks.setBettingExceptionCallback((err) => {
    console.log(`BettingExceptionCallback called: ${err}`);
});

let moneyMade = 0;
let won = 0;
let lost = 0;

// Set the exception callback
autobetLib.callbacks.setExceptionCallback(exception);

function makeSumsDisplayable(sum, k = false) {
    const negative = sum < 0;
    sum = Math.abs(sum);

    let res;

    if (sum >= 1000000000) { // One billion
        res = (sum / 1000000000).toFixed(2) + "B";
    } else if (sum >= 1000000) { // One million
        res = (sum / 1000000).toFixed(2) + "M";
    } else if (k && sum >= 1000) { // One thousand
        res = (sum / 1000).toFixed(2) + "K";
    } else {
        res = sum;
    }

    if (negative) {
        return "-$" + res;
    } else {
        return "$" + res;
    }
}

// Set the add money callback
autobetLib.callbacks.setAddMoneyCallback(addMoney);

function addMoney(value) {
    if (value !== 0) {
        moneyMade += value;
        if (value > 0) won++;
    } else {
        lost++;
    }
    updateValues();
}

// Set the all money made callback
autobetLib.callbacks.setAllMoneyMadeCallback(setAllMoneyMade);

function setAllMoneyMade(value) {
    console.log(`Setting all money made: ${makeSumsDisplayable(value)}`)
}

function updateValues() {
    console.log("Money per hour: " + makeSumsDisplayable(getMoneyPerHour(), true) + "/hr");
    console.log("Races won: " + won);
    console.log("Win percentage: " + Math.round((won / (won + lost)) * 1000) / 10 + "%");
}

function getMoneyPerHour() {
    return moneyMade * (3600 / time);
}

// Set the 'set gta running' callback
autobetLib.callbacks.setGtaRunningCallback(set_gta_running);

function set_gta_running(val) {
    gta_running = val;
    console.log(`Gta running: ${val}`);
}

function setQRCode(ip) {
    console.log(`Set QR code: ${ip}`);
}

function setIPs() {
    let ip = autobetLib.getIP();
    setQRCode(ip);
}

async function main() {
    // Initialize
    let initialized = await autobetLib.init();
    if (initialized) {
        autobetLib.logging.debug("main.js", "autobetlib initialized.");
    } else {
        autobetLib.logging.error("main.js", "Could not initialize");
    }

    // Load the winnings
    await autobetLib.loadWinnings();

    autobetLib.logging.setLogToConsole(true);

    // Set switches checked
    console.log("Time sleep: " + autobetLib.settings.getTimeSleep());
    console.log("Is logging to file: " + autobetLib.logging.isLoggingToFile());
    console.log("Is logging to console: " + autobetLib.logging.isLoggingToConsole());

    // Check the web server activated and start it if activated
    console.log("Web server activated: " + autobetLib.settings.webServerActivated());
    if (autobetLib.settings.webServerActivated()) {
        console.log("Starting web server");
        initialized = await autobetLib.startWebServer();
        if (initialized) {
            autobetLib.logging.debug("main.js", "Web server started.");
            setIPs();
        } else {
            autobetLib.logging.error("main.js", "Could not start web server");
        }
    }

    autobetLib.setOddTranslations();

    autobetLib.start();
}

// Run the main function
main().then(() => {
    autobetLib.logging.debug("main.js", "JS main function finished");
}, () => {
    // main failed
    autobetLib.shutdown();
});

// Set a callback for logging to "console"
autobetLib.logging.setLogCallback((msg) => {
    console.log("Message to log: " + msg);
});
/*} catch (e) {
    autobetLib.logging.error("main.js", `Js exception thrown: ${e.message}`);
    exception();
}*/