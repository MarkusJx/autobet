const startstop = document.getElementById('startstop');
mdc.ripple.MDCRipple.attachTo(startstop);

const configurebutton = document.getElementById('configurebutton');
mdc.ripple.MDCRipple.attachTo(configurebutton);

var settingsdialog = document.getElementById("settingsdialog");
settingsdialog = new mdc.dialog.MDCDialog(settingsdialog);

var datasaverdialog = document.getElementById("datasaverdialog");
datasaverdialog = new mdc.dialog.MDCDialog(datasaverdialog);
var enabledatasaverbutton = document.getElementById("enabledatasaverbutton");

var gtanotrunningmessage = document.getElementById("gta-not-running-message");
gtanotrunningmessage = new mdc.snackbar.MDCSnackbar(gtanotrunningmessage);
gtanotrunningmessage.timeoutMs = 10000;

var notconnectedmessage = document.getElementById("notconnectedmessage");
notconnectedmessage = new mdc.snackbar.MDCSnackbar(notconnectedmessage);
notconnectedmessage.timeoutMs = 10000;

var notconnectedlabel = document.getElementById("notconnectedlabel");

var settingsdonebutton = document.getElementById("settingsdonebutton");
var timeinput = document.getElementById("timeinput");
var moneyinput = document.getElementById("moneyinput");

var autostopenabled = document.getElementById("autostopenabled");

var autostopstatusmessage = document.getElementById("autostopstatusmessage");
autostopstatusmessage = new mdc.snackbar.MDCSnackbar(autostopstatusmessage);
autostopstatusmessage.timeoutMs = 5000;

autostopstatuslabel = document.getElementById("autostopstatuslabel");

var moneyall = document.getElementById("moneyall");
var timeDisp = document.getElementById("time");
var winprobability = document.getElementById("winprobability");
var raceswon = document.getElementById("raceswon");
var moneythishour = document.getElementById("moneythishour");
var statusinfo = document.getElementById("statusinfo");
var moneythissession = document.getElementById("moneythissession");

var lastTime = 0;
var mainInterval = null;

var start = true;
var initialized = false;
var scriptRunning = -1;

var autostopTime = -1;
var autostopMoney = -1;

// Add event listener to start stop button
startstop.addEventListener('click', () => {
    wuy.get_gta_v_running().then(running => {
        if (!running) {
            gtanotrunningmessage.open();
            startstop.disabled = true;
        } else {
            if (start != null) {
                startstop.disabled = true;
                if (start == true) {
                    wuy.js_start();
                } else {
                    wuy.js_stop();
                }
            }
        }
    })
});

// Add event listener to the autostop configure button
configurebutton.addEventListener('click', function () {
    if (autostopMoney != -1) {
        moneyinput.value = autostopMoney;
    } else {
        moneyinput.value = "";
    }

    if (autostopTime != -1) {
        timeinput.value = Math.floor(autostopTime / 3600) + ":" + Math.floor((autostopTime % 3600) / 60);
    } else {
        timeinput.value = "";
    }

    settingsdialog.open();
});

// Listen for the not running message to close to activate the start stop button again
gtanotrunningmessage.listen('MDCSnackbar:closing', () => {
    if (scriptRunning != 0 || scriptRunning != 2) {
        startstop.disabled = false;
    }
});

// Listen for the not connected snackbar to close, just to open again to annoy the user
notconnectedmessage.listen('MDCSnackbar:closing', () => {
    let lastMessage = notconnectedlabel.innerHTML;
    notconnectedlabel.innerHTML = "";
    notconnectedmessage.open();
    notconnectedlabel.innerHTML = lastMessage;
});

// Add an event listener for the settings done button
settingsdonebutton.addEventListener('click', function () {
    if (moneyinput.value < 10000 || moneyinput.value == "") { // Trash the values if they are trash
        moneyinput.value = "";
        autostopMoney = -1;
        wuy.set_autostop_money(-1);
    } else {
        autostopMoney = moneyinput.value;
        wuy.set_autostop_money(moneyinput.value);
    }

    let timeval = timeinput.value.split(":");
    timeval = timeval[0] * 3600 + timeval[1] * 60;

    if (Number.isNaN(timeval)) { // Trash the values if they are trash
        timeinput.value = "";
        autostopTime = -1;
        wuy.set_autostop_time(-1);
    } else {
        autostopTime = timeval;
        wuy.set_autostop_time(timeval);
    }

    showAutostopMessages();
});

/**
 * Display the coressponding messages for autostop
 */
function showAutostopMessages() {
    if (autostopMoney != -1 && autostopTime != -1) { // If both are enabled
        autostopenabled.classList = "text maintext status_running";
        autostopenabled.innerHTML = "Enabled";
        autostopstatuslabel.innerHTML = "Autostop money value set to: " + autostopMoney + " and time set to: " + timeinput.value;
        autostopstatusmessage.open();
    } else if (autostopTime != -1 || autostopMoney != -1) { // If only one is enabled
        if (autostopTime != -1) {
            autostopstatuslabel.innerHTML = "Autostop time set to: " + timeinput.value;
            autostopstatusmessage.open();
        } else {
            autostopstatuslabel.innerHTML = "Autostop money value set to: " + autostopMoney;
            autostopstatusmessage.open();
        }
        autostopenabled.classList = "text maintext status_running";
        autostopenabled.innerHTML = "Enabled";
    } else { // If the feature is disabled
        autostopenabled.classList = "text maintext status_stopped";
        autostopenabled.innerHTML = "Disabled";
        autostopstatuslabel.innerHTML = "Autostop is now disabled";
        autostopstatusmessage.open();
    }
}

/**
 * Set an Interval if the website is disconnected
 */
var x = setInterval(function () {
    try {
        wuy.connected().then(function (res) {
            if (res) {
                clearInterval(x);
                console.log("Connected!");
                wuy.js_initialized().then(res => {
                    if (res) {
                        main();
                    } else {
                        document.location.href = "index.html";
                    }
                })
            }
        })
    } catch (error) {
        console.log("Still connecting...")
    }
}, 100);

/**
 * Make the sums nice and easy to read
 * 
 * @param {number} sum the sum to convert
 * @param {boolean} k if thousands should be converted too
 * @returns {string} the readable number, without an extra dollar
 */
function makeSumsDisplayable(sum, k = false) {
    let negative = sum < 0; // Check if the input is negative
    sum = Math.abs(sum);

    if (sum > 1000000000) {
        if (negative) {
            return ((Math.round(sum / 100000000) / 10) * (-1)) + "B";
        } else {
            return Math.round(sum / 100000000) / 10 + "B";
        }
    } else if (sum > 1000000) {
        if (negative) {
            return ((Math.round(sum / 100000) / 10) * (-1)) + "M";
        } else {
            return Math.round(sum / 100000) / 10 + "M";
        }
    } else if (k && sum > 1000) {
        if (negative) {
            return ((Math.round(sum / 100) / 10) * (-1)) + "K";
        } else {
            return Math.round(sum / 100) / 10 + "K";
        }
    } else {
        if (negative) {
            return sum * (-1);
        } else {
            return sum;
        }
    }
}

/**
 * The main function
 */
function main() {
    if (isMobile()) {
        console.log("Running on a mobile device");

        datasaverdialog.listen('MDCDialog:closing', ev => {
            if (ev.detail.action == "yes") {
                console.log("Enabling Data Saver");
                if (!initialized) init(true);
                initialized = true;
            } else {
                console.log("Not enabling Data Saver");
                if (!initialized) init(false);
                initialized = true;
            }
        })
        datasaverdialog.open();
    } else {
        console.log("Running on a desktop device");
        if (!initialized) init(false);
        initialized = true;
    }
}

/**
 * Initialize everything
 * 
 * @param {boolean} datasaver if datasaver should be enabled
 */
function init(datasaver) {
    wuy.js_get_money().then(function (val) {
        moneythissession.innerHTML = makeSumsDisplayable(val, false);
    });

    wuy.js_get_all_money().then((val) => {
        console.log("Money earned all time: " + val);
        moneyall.innerHTML = makeSumsDisplayable(val) + " $";
    });

    let waitTime = 500;
    if (datasaver) waitTime = 5000; // Set the wait time to 5 seconds if data saver is enabled

    /**
     * The main interval
     */
    mainInterval = setInterval(async function () {
        try {
            await asyncMain();
        } catch (error) { // Go, play fetch!
            clearInterval(mainInterval); // Clear this interval
            disconnected();
        }
    }, waitTime);
}

/**
 * A function to be called if this client is disconnected
 */
function disconnected() {
    console.log("Connection lost.");
    let timeUntilRetry = 10; // Wait time until retry
    notconnectedlabel.innerHTML = "Connection lost.";
    notconnectedmessage.open(); // Notify the user about this disconnect

    let x = setInterval(async () => { // Start an Interval to time the retries
        if (timeUntilRetry < 1) {
            notconnectedlabel.innerHTML = "Trying to reconnect...";
            timeUntilRetry = 10;
            let connected = false;

            try {
                connected = await wuy.connected();
            } catch (error) {
                connected = false;
            }

            if (connected) {
                clearInterval(x);
                notconnectedlabel.innerHTML = "Reconnected. Reloading page in 3 seconds";
                setTimeout(() => {
                    location.reload();
                }, 3000)
            }
        } else {
            notconnectedlabel.innerHTML = "Connection lost. Retrying in " + timeUntilRetry + " seconds.";
            startstop.disabled = true;
            timeUntilRetry--;
        }
    }, 1000);
}

/**
 * The async main function
 */
async function asyncMain() {
    // Get the time running
    let time = await wuy.js_get_time();
    if (time != lastTime) {
        timeDisp.innerHTML = convertToTime(time);
        lastTime = time;
    }

    // Get the races won
    let won = await wuy.get_races_won();
    raceswon.innerHTML = won;

    // get the races lost
    let lost = await wuy.get_races_lost();
    // Do some heavy mathematics to calculate a winprobability
    if ((won + lost) > 0) winprobability.innerHTML = Math.round((won / (won + lost)) * 1000) / 10 + "%";

    // Set the money made
    wuy.js_get_money().then(moneyMade => {
        moneythissession.innerHTML = makeSumsDisplayable(moneyMade, false) + " $";
        if (time > 0)
            moneythishour.innerHTML = makeSumsDisplayable(moneyMade * (3600 / time), true) + " $/hr";
    });

    // Set the overall money made values
    wuy.js_get_all_money().then(allMoney => {
        moneyall.innerHTML = makeSumsDisplayable(allMoney) + " $";
    });

    // Check if the script is already running
    wuy.js_get_running().then(running => {
        let statusChanged = scriptRunning != running;
        scriptRunning = running;

        if (!statusChanged) return; // If the status has not changed, do nothing

        gtanotrunningmessage.close();

        if (running == 1) { // Running
            statusinfo.innerHTML = "Running";
            statusinfo.className = "text status_running maintext";
            startstop.innerHTML = "stop";
            start = false;
            startstop.disabled = false;
        } else if (running == -1) { // Stopped
            statusinfo.innerHTML = "Stopped";
            statusinfo.className = "text status_stopped maintext";
            startstop.innerHTML = "start";
            startstop.disabled = false;
        } else if (running == 0) { // Stopping
            statusinfo.innerHTML = "Stopping";
            statusinfo.className = "text status_stopping maintext";
            startstop.disabled = true;
        } else if (running == 2) { // Starting
            statusinfo.innerHTML = "Starting";
            statusinfo.className = "text status_stopping maintext";
            startstop.disabled = true;
        }
    });

    // Get the autostop settings
    await getAutostopSettings();
}

/**
 * Get new autostop settings, if available
 */
async function getAutostopSettings() {
    let nTime = await wuy.get_autostop_time();
    let nMoney = await wuy.get_autostop_money();

    if (nTime != autostopTime || nMoney != autostopMoney) {
        autostopTime = nTime;
        autostopMoney = nMoney;
        showAutostopMessages();
    } else {
        autostopTime = nTime;
        autostopMoney = nMoney;
    }
}

/**
 * Convert a number to a readable time
 * 
 * @param {number} secs the number to convert
 * @returns {string} the readable time
 */
function convertToTime(secs) {
    var hours = Math.floor((secs % 86400) / 3600);
    var minutes = Math.floor((secs % 3600) / 60);
    var seconds = secs % 60;
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