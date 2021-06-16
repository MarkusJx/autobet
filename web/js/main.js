const startstop = document.getElementById('startstop');
mdc.ripple.MDCRipple.attachTo(startstop);

const configurebutton = document.getElementById('configurebutton');
mdc.ripple.MDCRipple.attachTo(configurebutton);

const settingsdialog = new mdc.dialog.MDCDialog(document.getElementById("settingsdialog"));

const datasaverdialog = new mdc.dialog.MDCDialog(document.getElementById("datasaverdialog"));
const enabledatasaverbutton = document.getElementById("enabledatasaverbutton");

const gtanotrunningmessage = new mdc.snackbar.MDCSnackbar(document.getElementById("gta-not-running-message"));
gtanotrunningmessage.timeoutMs = 10000;

const notconnectedmessage = new mdc.snackbar.MDCSnackbar(document.getElementById("notconnectedmessage"));
notconnectedmessage.timeoutMs = 10000;

const notconnectedlabel = document.getElementById("notconnectedlabel");

const settingsdonebutton = document.getElementById("settingsdonebutton");
const timeinput = document.getElementById("timeinput");
const moneyinput = document.getElementById("moneyinput");

const autostopenabled = document.getElementById("autostopenabled");

const autostopstatusmessage = new mdc.snackbar.MDCSnackbar(document.getElementById("autostopstatusmessage"));
autostopstatusmessage.timeoutMs = 5000;

const autostopstatuslabel = document.getElementById("autostopstatuslabel");

const moneyall = document.getElementById("moneyall");
const timeDisp = document.getElementById("time");
const winprobability = document.getElementById("winprobability");
const raceswon = document.getElementById("raceswon");
const moneythishour = document.getElementById("moneythishour");
const statusinfo = document.getElementById("statusinfo");
const moneythissession = document.getElementById("moneythissession");

var lastTime = 0;

var start = true;
var initialized = false;
var scriptRunning = -1;

var autostopTime = -1;
var autostopMoney = -1;

let gtaRunning = false;

let racesWon = 0,
    racesLost = 0;

// Add event listener to start stop button
startstop.addEventListener('click', () => {
    console.log("Running: " + gtaRunning);
    if (!gtaRunning) {
        gtanotrunningmessage.open();
        startstop.disabled = true;
    } else {
        if (start != null) {
            startstop.disabled = true;
            if (start === true) {
                cppJsLib.js_start_script();
            } else {
                cppJsLib.js_stop_script();
            }
        }
    }
});

// Add event listener to the autostop configure button
configurebutton.addEventListener('click', function() {
    if (autostopMoney !== -1) {
        moneyinput.value = autostopMoney;
    } else {
        moneyinput.value = "";
    }

    if (autostopTime !== -1) {
        timeinput.value = Math.floor(autostopTime / 3600) + ":" + Math.floor((autostopTime % 3600) / 60);
    } else {
        timeinput.value = "";
    }

    settingsdialog.open();
});

// Listen for the not running message to close to activate the start stop button again
gtanotrunningmessage.listen('MDCSnackbar:closing', () => {
    if (scriptRunning !== 0 || scriptRunning !== 2) {
        startstop.disabled = false;
    }
});

// Listen for the not connected snackbar to close, just to open again to annoy the user
notconnectedmessage.listen('MDCSnackbar:closing', () => {
    let lastMessage = notconnectedlabel.innerText;
    notconnectedlabel.innerText = "";
    notconnectedmessage.open();
    notconnectedlabel.innerText = lastMessage;
});

// Add an event listener for the settings done button
settingsdonebutton.addEventListener('click', function() {
    if (moneyinput.value < 10000 || moneyinput.value === "") { // Trash the values if they are trash
        moneyinput.value = "";
        autostopMoney = -1;
        cppJsLib.set_autostop_money(-1);
    } else {
        autostopMoney = moneyinput.value;
        cppJsLib.set_autostop_money(parseInt(moneyinput.value, 10));
    }

    let timeval = timeinput.value.split(":");
    timeval = timeval[0] * 3600 + timeval[1] * 60;

    if (Number.isNaN(timeval)) { // Trash the values if they are trash
        timeinput.value = "";
        autostopTime = -1;
        cppJsLib.set_autostop_time(-1);
    } else {
        autostopTime = timeval;
        cppJsLib.set_autostop_time(timeval);
    }

    showAutostopMessages();
});

/**
 * Display the corresponding messages for autostop
 */
function showAutostopMessages() {
    if (autostopMoney != -1 && autostopTime != -1) { // If both are enabled
        autostopenabled.classList = "text maintext status_running";
        autostopenabled.innerText = "Enabled";
        autostopstatuslabel.innerText = "Autostop money value set to: " + autostopMoney + " and time set to: " + timeinput.value;
        autostopstatusmessage.open();
    } else if (autostopTime != -1 || autostopMoney != -1) { // If only one is enabled
        if (autostopTime != -1) {
            autostopstatuslabel.innerText = "Autostop time set to: " + timeinput.value;
            autostopstatusmessage.open();
        } else {
            autostopstatuslabel.innerText = "Autostop money value set to: " + autostopMoney;
            autostopstatusmessage.open();
        }
        autostopenabled.classList = "text maintext status_running";
        autostopenabled.innerText = "Enabled";
    } else { // If the feature is disabled
        autostopenabled.classList = "text maintext status_stopped";
        autostopenabled.innerText = "Disabled";
        autostopstatuslabel.innerText = "Autostop is now disabled";
        autostopstatusmessage.open();
    }
}

/**
 * Set an Interval if the website is disconnected
 */
let x = setInterval(function() {
    if (cppJsLib.connected) {
        if (x != null) clearInterval(x);
        x = null;
        console.log("Connected!");
        main();
    } else {
        console.log("Still connecting...")
    }
}, 100);

let hasDisconnectListener = false;

// Add a on load listener
cppJsLib.listen("loaded", function(res) {
    if (res) {
        if (x != null) clearInterval(x);
        x = null;
        console.log("Connected!");
        if (!hasDisconnectListener) {
            cppJsLib.listen("disconnected", disconnected);
            hasDisconnectListener = true;
        }
        main();
    }
});

/**
 * Make sums more readable by adding 'K' for thousand
 * or 'M' for million to the end of the sum
 *
 * @param {number} sum the sum to make pretty
 * @param {boolean} k whether to replace thousand by 'K'
 * @param {number} fractionDigits the number of fraction digits to display
 * @returns {string} the resulting value in the format [-]$<0-999>.<0-99><B|M|K>
 */
function makeSumsDisplayable(sum, k = false, fractionDigits = 2) {
    const negative = sum < 0;
    sum = Math.abs(sum);

    let res;
    if (sum >= 1000000000) { // One billion
        res = (sum / 1000000000).toFixed(fractionDigits) + "B";
    } else if (sum >= 1000000) { // One million
        res = (sum / 1000000).toFixed(fractionDigits) + "M";
    } else if (k && sum >= 1000) { // One thousand
        res = (sum / 1000).toFixed(fractionDigits) + "K";
    } else {
        res = sum;
    }

    if (negative) {
        return "-$" + res;
    } else {
        return "$" + res;
    }
}

/**
 * The main function
 */
function main() {
    if (isMobile()) {
        console.log("Running on a mobile device");
    } else {
        console.log("Running on a desktop device");
    }

    if (!initialized) init();
    initialized = true;
}

/**
 * Load all data
 */
async function loadData() {
    cppJsLib.get_current_winnings().then((val) => {
        moneythissession.innerText = makeSumsDisplayable(val, false);
    });

    cppJsLib.get_all_winnings().then((val) => {
        console.log("Money earned all time: " + val);
        moneyall.innerText = makeSumsDisplayable(val);
    });

    // Get the time running
    cppJsLib.get_time().then((t) => {
        if (t !== lastTime) {
            timeDisp.innerText = convertToTime(t);
            lastTime = t;
        }
    });

    // Get the races won
    let won = Number(await cppJsLib.get_races_won());
    racesWon = won;
    raceswon.innerText = won;

    // get the races lost
    cppJsLib.get_races_lost().then((lost) => {
        lost = Number(lost);
        racesLost = lost;
        // Do some heavy mathematics to calculate a win probability
        if ((won + lost) > 0) winprobability.innerText = Math.round((won / (won + lost)) * 1000) / 10 + "%";
    });

    // Set the money made
    cppJsLib.get_current_winnings().then(moneyMade => {
        moneythissession.innerText = makeSumsDisplayable(moneyMade, false);
        if (lastTime > 0)
            moneythishour.innerText = makeSumsDisplayable(moneyMade * (3600 / lastTime), true, 0) + "/hr";
    });

    // Set the overall money made values
    cppJsLib.get_all_winnings().then(allMoney => {
        moneyall.innerText = makeSumsDisplayable(allMoney);
    });

    // Check if the script is already running
    cppJsLib.get_running().then(running => {
        let statusChanged = scriptRunning !== running;
        scriptRunning = running;

        if (!statusChanged) return; // If the status has not changed, do nothing

        gtanotrunningmessage.close();

        if (running == 1) { // Running
            statusinfo.innerText = "Running";
            statusinfo.className = "text status_running maintext";
            startstop.innerText = "stop";
            start = false;
            startstop.disabled = false;
            startTimer();
        } else if (running == -1) { // Stopped
            statusinfo.innerText = "Stopped";
            statusinfo.className = "text status_stopped maintext";
            startstop.innerText = "start";
            startstop.disabled = false;
        } else if (running == 0) { // Stopping
            statusinfo.innerText = "Stopping";
            statusinfo.className = "text status_stopping maintext";
            startstop.disabled = true;
            startTimer();
        } else if (running == 2) { // Starting
            statusinfo.innerText = "Starting";
            statusinfo.className = "text status_stopping maintext";
            startstop.disabled = true;
            startTimer();
        }
    });

    // Get the autostop settings
    await getAutostopSettings();
}

/**
 * Handle page visibility changes.
 * Source: https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API
 */
function handleVisibilityChange() {
    // Set the name of the hidden property and the change event for visibility
    let hidden, visibilityChange;
    if (typeof document.hidden !== "undefined") { // Opera 12.10 and Firefox 18 and later support
        hidden = "hidden";
        visibilityChange = "visibilitychange";
    } else if (typeof document.msHidden !== "undefined") {
        hidden = "msHidden";
        visibilityChange = "msvisibilitychange";
    } else if (typeof document.webkitHidden !== "undefined") {
        hidden = "webkitHidden";
        visibilityChange = "webkitvisibilitychange";
    }

    // Warn if the browser doesn't support addEventListener or the Page Visibility API
    if (typeof document.addEventListener === "undefined" || hidden === undefined) {
        console.warn("This browser does not support the PageVisibility API");
    } else {
        // Handle page visibility change
        document.addEventListener(visibilityChange, () => {
            if (document[hidden]) {
                stopTimer();
            } else {
                console.log("Reloading data");
                loadData().then(() => console.log("Data reloaded"));
            }
        }, false);
    }
}

/**
 * Initialize everything
 */
async function init() {
    await loadData();
    handleVisibilityChange();

    cppJsLib.expose(webSetGtaRunning);

    /**
     * Set whether gta is running
     *
     * @param {boolean} val true, if gta is running
     */
    function webSetGtaRunning(val) {
        gtaRunning = val;
        const el = document.getElementById('game-running-info');
        el.innerText = val ? "Yes" : "No";

        if (val) {
            el.classList.remove("status_stopped");
            el.classList.add("status_running");
        } else {
            el.classList.remove("status_running");
            el.classList.add("status_stopped");
        }
    }

    cppJsLib.expose(webSetWinnings);

    /**
     * Set the winnings made this session
     *
     * @param {number} moneyMade the amount of money made this session
     */
    function webSetWinnings(moneyMade) {
        moneythissession.innerText = makeSumsDisplayable(moneyMade, false);
        if (lastTime > 0)
            moneythishour.innerText = makeSumsDisplayable(moneyMade * (3600 / lastTime), true, 0) + "/hr";
    }

    cppJsLib.expose(webSetWinningsAll);

    /**
     * Set all money made
     *
     * @param {number} allMoney the amount of money made all time
     */
    function webSetWinningsAll(allMoney) {
        moneyall.innerText = makeSumsDisplayable(allMoney);
    }

    cppJsLib.expose(webSetRacesWon);

    /**
     * Set the number of races won
     *
     * @param {number} won the number of races won
     */
    function webSetRacesWon(won) {
        raceswon.innerText = won;
        racesWon = Number(won);

        // Do some heavy mathematics to calculate a win probability
        if ((racesWon + racesLost) > 0)
            winprobability.innerText = Math.round((racesWon / (racesWon + racesLost)) * 1000) / 10 + "%";
    }

    cppJsLib.expose(webSetRacesLost);

    /**
     * Set the number of races lost
     *
     * @param {number} lost the number of races lost
     */
    function webSetRacesLost(lost) {
        racesLost = Number(lost);

        // Do some heavy mathematics to calculate a win probability
        if ((racesWon + racesLost) > 0)
            winprobability.innerText = Math.round((racesWon / (racesWon + racesLost)) * 1000) / 10 + "%";
    }

    cppJsLib.expose(webSetStarted);

    /**
     * Set the scrip started
     */
    function webSetStarted() {
        statusinfo.innerText = "Running";
        statusinfo.className = "text status_running maintext";
        startstop.innerText = "stop";
        start = false;
        startstop.disabled = false;

        // Get the time running
        cppJsLib.get_time().then((t) => {
            if (t !== lastTime) {
                timeDisp.innerText = convertToTime(t);
                lastTime = t;
            }
            startTimer();
        });
    }

    cppJsLib.expose(webSetStopped);

    /**
     * Set the script stopped
     */
    function webSetStopped() {
        statusinfo.innerText = "Stopped";
        statusinfo.className = "text status_stopped maintext";
        startstop.innerText = "start";
        startstop.disabled = false;
        stopTimer();
    }

    cppJsLib.expose(webSetStopping);

    /**
     * Set the script stopping
     */
    function webSetStopping() {
        statusinfo.innerText = "Stopping";
        statusinfo.className = "text status_stopping maintext";
        startstop.disabled = true;
    }

    cppJsLib.expose(webSetStarting);

    /**
     * Set the script starting
     */
    function webSetStarting() {
        statusinfo.innerText = "Starting";
        statusinfo.className = "text status_stopping maintext";
        startstop.disabled = true;
    }

    cppJsLib.expose(webSetAutostopMoney);

    /**
     * Set the autostop money
     *
     * @param {number} val the money value
     */
    function webSetAutostopMoney(val) {
        if (val !== autostopMoney) {
            autostopMoney = val;
            showAutostopMessages();
        }
    }

    cppJsLib.expose(webSetAutostopTime);

    /**
     * Set the autostop time
     *
     * @param {number} val the time
     */
    function webSetAutostopTime(val) {
        if (val !== autostopTime) {
            autostopTime = nTime;
            showAutostopMessages();
        }
    }
}

// The timer interval
let timer = null;

/**
 * Start the timer
 */
function startTimer() {
    if (timer == null) {
        timer = setInterval(() => {
            lastTime++;
            timeDisp.innerText = convertToTime(lastTime);
        }, 1000);
    }
}

/**
 * Stop the timer
 */
function stopTimer() {
    if (timer != null) {
        clearInterval(timer);
        timer = null;
    }
}

/**
 * A function to be called if this client is disconnected
 */
function disconnected() {
    console.log("Connection lost.");
    let timeUntilRetry = 10; // Wait time until retry
    notconnectedlabel.innerText = "Connection lost.";
    notconnectedmessage.open(); // Notify the user about this disconnect

    let x = setInterval(async() => { // Start an Interval to time the retries
        if (timeUntilRetry < 1) {
            notconnectedlabel.innerText = "Trying to reconnect...";
            timeUntilRetry = 5;

            if (cppJsLib.connected) {
                if (x != null) clearInterval(x);
                x = null;
                notconnectedlabel.innerText = "Reconnected. Reloading page in 3 seconds";
                setTimeout(() => {
                    location.reload();
                }, 3000)
            }
        } else {
            notconnectedlabel.innerText = "Connection lost. Retrying in " + timeUntilRetry + " seconds.";
            startstop.disabled = true;
            timeUntilRetry--;
        }
    }, 1000);
}

/**
 * Get new autostop settings, if available
 */
async function getAutostopSettings() {
    cppJsLib.get_autostop_time().then((nTime) => {
        cppJsLib.get_autostop_money().then((nMoney) => {
            if (nTime !== autostopTime || nMoney !== autostopMoney) {
                autostopTime = nTime;
                autostopMoney = nMoney;
                showAutostopMessages();
            } else {
                autostopTime = nTime;
                autostopMoney = nMoney;
            }
        });
    });
}

/**
 * Convert a number to a readable time
 *
 * @param {number} secs the number to convert
 * @returns {string} the readable time
 */
function convertToTime(secs) {
    let hours = Math.floor((secs % 86400) / 3600);
    let minutes = Math.floor((secs % 3600) / 60);
    let seconds = secs % 60;
    hours = (hours < 10) ? "0" + hours : hours;
    minutes = (minutes < 10) ? "0" + minutes : minutes;
    seconds = (seconds < 10) ? "0" + seconds : seconds;
    return hours + ':' + minutes + ':' + seconds;
}

/**
 * Check if the client is a mobile device
 *
 * @returns {boolean} true if the client is indeed a mobile device
 */
function isMobile() {
    try {
        if (/Android|webOS|iPhone|iPad|iPod|pocket|psp|kindle|avantgo|blazer|midori|Tablet|Palm|maemo|plucker|phone|BlackBerry|symbian|IEMobile|mobile|ZuneWP7|Windows Phone|Opera Mini/i.test(navigator.userAgent)) {
            return true;
        }
        return false;
    } catch (e) {
        console.log("Error in isMobile");
        return false;
    }
}