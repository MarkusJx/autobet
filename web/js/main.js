const startstop = document.getElementById('startstop');
mdc.ripple.MDCRipple.attachTo(startstop);

const configurebutton = document.getElementById('configurebutton');
mdc.ripple.MDCRipple.attachTo(configurebutton);

var settingsdialog = document.getElementById("settingsdialog");
settingsdialog = new mdc.dialog.MDCDialog(settingsdialog);

var moneyall = document.getElementById("moneyall");
var timeDisp = document.getElementById("time");
var winprobability = document.getElementById("winprobability");
var raceswon = document.getElementById("raceswon");
var moneythishour = document.getElementById("moneythishour");
var statusinfo = document.getElementById("statusinfo");

var lastTime = 0;
var mainInterval = null;

var start = true;

startstop.addEventListener('click', () => {
    if (start != null) {
        startstop.disabled = true;
        if (start == true) {
            wuy.js_start();
        } else {
            wuy.js_stop();
        }
    }
});

configurebutton.addEventListener('click', function () {
    settingsdialog.open();
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
    wuy.js_get_money().then(function (val) {
        console.log(val);
    });

    wuy.js_get_all_money().then((val) => {
        console.log("Money earned all time: " + val);
        moneyall.innerHTML = makeSumsDisplayable(val) + " $";
    });

    let disconnectedCount = 0;

    mainInterval = setInterval(async function () {
        try {
            await asyncMain();
            if (disconnectedCount > 0) {
                disconnectedCount = 0;
                console.info("Reconnected.");

                wuy.js_initialized().then(res => {
                    if (!res) {
                        document.location.href = "index.html";
                    }
                });
            }
        } catch (error) {
            console.log("Connection lost. " + (120 - disconnectedCount) + " retries left.");
            disconnectedCount++;

            if (disconnectedCount > 120) {
                clearInterval(mainInterval);
                console.info("Disconnected.");
            }
        }
    }, 500);
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
        if (running == 1) {
            statusinfo.innerHTML = "Running";
            statusinfo.className = "text status_running maintext";
            startstop.innerHTML = "stop";
            startstop.disabled = false;
            start = false;
        } else if (running == -1) {
            statusinfo.innerHTML = "Stopped";
            statusinfo.className = "text status_stopped maintext";
            startstop.disabled = false;
            startstop.innerHTML = "start";
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