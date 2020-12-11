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
//var mainInterval = null;

var start = true;
var initialized = false;
var scriptRunning = -1;

var autostopTime = -1;
var autostopMoney = -1;

let gtaRunning = false;

let racesWon = 0, racesLost = 0;

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
configurebutton.addEventListener('click', function () {
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
settingsdonebutton.addEventListener('click', function () {
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

cppJsLib.onLoad(function (res) {
    if (res) {
        clearInterval(x);
        console.log("Connected!");
        cppJsLib.js_initialized().then(res => {
            if (res) {
                main();
            } else {
                document.location.href = "index.html";
            }
        })
    }
});

/**
 * Make sums more readable by adding 'K' for thousand
 * or 'M' for million to the end of the sum
 * 
 * @param {number} sum the sum to make pretty
 * @param {boolean} k whether to replace thousand by 'K'
 * @returns {string} the resulting value in the format [-]$<0-999>.<0-99><B|M|K>
 */
function makeSumsDisplayable(sum, k = false) {
    const negative = sum < 0;
    sum = Math.abs(sum);

    let res;

    if (sum > 1000000000) { // One billion
        res = Math.round(sum / 100000000) / 10 + "B";
    } else if (sum > 1000000) { // One million
        res = Math.round(sum / 100000) / 10 + "M";
    } else if (k && sum > 1000) { // One thousand
        res = Math.round(sum / 100) / 10 + "K";
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
 * Set an Interval if the website is disconnected
 */
var x = setInterval(function () {
    if (cppJsLib.connected) {
        clearInterval(x);
        console.log("Connected!");
        main();
    } else {
        console.log("Still connecting...")
    }
}, 100);

/**
 * The main function
 */
function main() {
    if (isMobile()) {
        console.log("Running on a mobile device");

        /*datasaverdialog.listen('MDCDialog:closing', ev => {
            if (ev.detail.action === "yes") {
                console.log("Enabling Data Saver");
                if (!initialized) init(true);
                initialized = true;
            } else {
                console.log("Not enabling Data Saver");
                if (!initialized) init(false);
                initialized = true;
            }
        });
        datasaverdialog.open();*/
    } else {
        console.log("Running on a desktop device");
    }

    if (!initialized) init(false);
    initialized = true;
}

/**
 * Initialize everything
 *
 * @param {boolean} datasaver if datasaver should be enabled
 */
async function init() {
    cppJsLib.get_current_winnings().then((val) => {
        moneythissession.innerText = makeSumsDisplayable(val, false);
    });

    cppJsLib.get_all_winnings().then((val) => {
        console.log("Money earned all time: " + val);
        moneyall.innerText = makeSumsDisplayable(val);
    });

    //let waitTime = 500;
    //if (datasaver) waitTime = 5000; // Set the wait time to 5 seconds if data saver is enabled

    // Get the time running
    cppJsLib.get_time().then((t) => {
        if (t !== lastTime) {
            timeDisp.innerText = convertToTime(t);
            lastTime = t;
        }
    });

    // Get the races won
    let won = await cppJsLib.get_races_won();
    racesWon = won;
    raceswon.innerText = won;

    // get the races lost
    cppJsLib.get_races_lost().then((lost) => {
        racesLost = lost;
        // Do some heavy mathematics to calculate a win probability
        if ((won + lost) > 0) winprobability.innerText = Math.round((won / (won + lost)) * 1000) / 10 + "%";
    });

    // Set the money made
    cppJsLib.get_current_winnings().then(moneyMade => {
        moneythissession.innerText = makeSumsDisplayable(moneyMade, false);
        if (lastTime > 0)
            moneythishour.innerText = makeSumsDisplayable(moneyMade * (3600 / lastTime), true) + "/hr";
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
        } else if (running == -1) { // Stopped
            statusinfo.innerText = "Stopped";
            statusinfo.className = "text status_stopped maintext";
            startstop.innerText = "start";
            startstop.disabled = false;
        } else if (running == 0) { // Stopping
            statusinfo.innerText = "Stopping";
            statusinfo.className = "text status_stopping maintext";
            startstop.disabled = true;
        } else if (running == 2) { // Starting
            statusinfo.innerText = "Starting";
            statusinfo.className = "text status_stopping maintext";
            startstop.disabled = true;
        }
    });

    // Get the autostop settings
    await getAutostopSettings();

    /**
     * The main interval
     */
    /*mainInterval = setInterval(async function () {
        if (cppJsLib.connected) {
            await asyncMain();
        } else {
            clearInterval(mainInterval); // Clear this interval
            disconnected();
        }
    }, waitTime);*/

    cppJsLib.expose(webSetGtaRunning);
    function webSetGtaRunning(val) {
        gtaRunning = val;
    }

    cppJsLib.expose(webSetWinnings);
    function webSetWinnings(moneyMade) {
        moneythissession.innerText = makeSumsDisplayable(moneyMade, false);
        if (lastTime > 0)
            moneythishour.innerText = makeSumsDisplayable(moneyMade * (3600 / lastTime), true) + "/hr";
    }

    cppJsLib.expose(webSetWinningsAll);
    function webSetWinningsAll(allMoney) {
        moneyall.innerText = makeSumsDisplayable(allMoney);
    }

    cppJsLib.expose(webSetRacesWon);
    function webSetRacesWon(won) {
        raceswon.innerText = won;
        racesWon = won;

        // Do some heavy mathematics to calculate a win probability
        if ((racesWon + racesLost) > 0)
            winprobability.innerText = Math.round((racesWon / (racesWon + racesLost)) * 1000) / 10 + "%";
    }

    cppJsLib.expose(webSetRacesLost);
    function webSetRacesLost(lost) {
        racesLost = lost;

        // Do some heavy mathematics to calculate a win probability
        if ((racesWon + racesLost) > 0)
            winprobability.innerText = Math.round((racesWon / (racesWon + racesLost)) * 1000) / 10 + "%";
    }

    cppJsLib.expose(webSetStarted);
    function webSetStarted() {
        statusinfo.innerText = "Running";
        statusinfo.className = "text status_running maintext";
        startstop.innerText = "stop";
        start = false;
        startstop.disabled = false;
        startTimer();
    }

    cppJsLib.expose(webSetStopped);
    function webSetStopped() {
        statusinfo.innerText = "Stopped";
        statusinfo.className = "text status_stopped maintext";
        startstop.innerText = "start";
        startstop.disabled = false;
        stopTimer();
    }

    cppJsLib.expose(webSetStopping);
    function webSetStopping() {
        statusinfo.innerText = "Stopping";
        statusinfo.className = "text status_stopping maintext";
        startstop.disabled = true;
    }

    cppJsLib.expose(webSetStarting);
    function webSetStarting() {
        statusinfo.innerText = "Starting";
        statusinfo.className = "text status_stopping maintext";
        startstop.disabled = true;
    }

    cppJsLib.expose(webSetAutostopMoney);
    function webSetAutostopMoney(val) {
        if (val !== autostopMoney) {
            autostopMoney = val;
            showAutostopMessages();
        }
    }

    cppJsLib.expose(webSetAutostopTime);
    function webSetAutostopTime(val) {
        if (val !== autostopTime) {
            autostopTime = nTime;
            showAutostopMessages();
        }
    }
}

let timer = null;
function startTimer() {
    if (timer == null) {
        timer = setInterval(() => {
            lastTime++;
            timeDisp.innerText = convertToTime(lastTime);
        }, 1000);
    }
}

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

    let x = setInterval(async () => { // Start an Interval to time the retries
        if (timeUntilRetry < 1) {
            notconnectedlabel.innerText = "Trying to reconnect...";
            timeUntilRetry = 5;

            //cppJsLib.init();

            if (cppJsLib.connected) {
                clearInterval(x);
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