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

var moneyall = document.getElementById("moneyall");
var timeDisp = document.getElementById("time");
var winprobability = document.getElementById("winprobability");
var raceswon = document.getElementById("raceswon");
var moneythishour = document.getElementById("moneythishour");
var statusinfo = document.getElementById("statusinfo");

var lastTime = 0;
var mainInterval = null;

var start = true;
var initialized = false;
var scriptRunning = -1;

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
    });
});

configurebutton.addEventListener('click', function () {
    settingsdialog.open();
});

gtanotrunningmessage.listen('MDCSnackbar:closing', () => {
    if (scriptRunning != 0 || scriptRunning != 2) {
        startstop.disabled = false;
    }
});

notconnectedmessage.listen('MDCSnackbar:closing', () => {
    let lastMessage = notconnectedlabel.innerHTML;
    notconnectedlabel.innerHTML = "";
    notconnectedmessage.open();
    notconnectedlabel.innerHTML = lastMessage;
});

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
                });
            }
        })
    } catch (error) {
        console.log("Still connecting...")
    }
}, 100);

function makeSumsDisplayable(sum, k = false) {
    let negative = sum < 0;
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
        });

        datasaverdialog.open();
    } else {
        console.log("Running on a desktop device");
        if (!initialized) init(false);
        initialized = true;
    }
}

function init(datasaver) {
    wuy.js_get_money().then(function (val) {
        console.log(val);
    });

    wuy.js_get_all_money().then((val) => {
        console.log("Money earned all time: " + val);
        moneyall.innerHTML = makeSumsDisplayable(val) + " $";
    });

    let waitTime = 500;
    if (datasaver) waitTime = 5000;

    mainInterval = setInterval(async function () {
        try {
            await asyncMain();
        } catch (error) {
            clearInterval(mainInterval);
            disconnected();
        }
    }, waitTime);
}

function disconnected() {
    console.log("Connection lost.");
    let timeUntilRetry = 10;
    notconnectedlabel.innerHTML = "Connection lost.";
    notconnectedmessage.open();
    let x = setInterval(async () => {
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
                }, 3000);
            }
        } else {
            notconnectedlabel.innerHTML = "Connection lost. Retrying in " + timeUntilRetry + " seconds.";
            startstop.disabled = true;
            timeUntilRetry--;
        }
    }, 1000)
}

async function asyncMain() {
    let time = await wuy.js_get_time();
    if (time != lastTime) {
        timeDisp.innerHTML = convertToTime(time);
        lastTime = time;
    }

    let won = await wuy.get_races_won();
    raceswon.innerHTML = won;

    let lost = await wuy.get_races_lost();
    if ((won + lost) > 0) winprobability.innerHTML = Math.round((won / (won + lost)) * 1000) / 10 + "%";

    wuy.js_get_money().then(moneyMade => {
        if (time > 0) moneythishour.innerHTML = makeSumsDisplayable(moneyMade * (3600 / time), true) + " $/hr";
    });

    wuy.js_get_all_money().then(allMoney => {
        moneyall.innerHTML = makeSumsDisplayable(allMoney) + " $";
    });

    wuy.js_get_running().then(running => {
        let statusChanged = scriptRunning != running;
        scriptRunning = running;
        if (!statusChanged) return;
        gtanotrunningmessage.close();

        if (running == 1) {
            statusinfo.innerHTML = "Running";
            statusinfo.className = "text status_running maintext";
            startstop.innerHTML = "stop";
            start = false;
            startstop.disabled = false;
        } else if (running == -1) {
            statusinfo.innerHTML = "Stopped";
            statusinfo.className = "text status_stopped maintext";
            startstop.innerHTML = "start";
            startstop.disabled = false;
        } else if (running == 0) {
            statusinfo.innerHTML = "Stopping";
            statusinfo.className = "text status_stopping maintext";
            startstop.disabled = true;
        } else if (running == 2) {
            statusinfo.innerHTML = "Starting";
            statusinfo.className = "text status_stopping maintext";
            startstop.disabled = true;
        }
    });
}

function convertToTime(secs) {
    var hours = Math.floor((secs % 86400) / 3600);
    var minutes = Math.floor((secs % 3600) / 60);
    var seconds = secs % 60;
    hours = (hours < 10) ? "0" + hours : hours;
    minutes = (minutes < 10) ? "0" + minutes : minutes;
    seconds = (seconds < 10) ? "0" + seconds : seconds;
    return hours + ':' + minutes + ':' + seconds;
}

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