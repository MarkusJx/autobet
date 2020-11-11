let timeDisp = document.getElementById("time");
let statusinfo = document.getElementById("statusinfo");

const gtanotrunningmessage = new mdc.snackbar.MDCSnackbar(document.getElementById("gta-not-running-message"));
gtanotrunningmessage.timeoutMs = 10000;

let paused = 0;
let running = 0;
let pausing = 0;
let timer = null;
let time = 0;

startstop.addEventListener('click', function() {
    if (!running) {
        start();
    } else if (!paused && !pausing) {
        pause();
    }
});

autobetLib.callbacks.setUiKeycombStartCallback(ui_keycomb_start);

function ui_keycomb_start() {
    startstop.disabled = true;
    startTimer();
    startstop.disabled = false;
    startstop.innerText = "stop";
    statusinfo.innerText = "Running";
    statusinfo.className = "text status_running maintext";
}

autobetLib.callbacks.setUiKeycombStopCallback(ui_keycomb_stop);

function ui_keycomb_stop() {
    pause(true);
}

function start() {
    if (!gta_running) {
        gtanotrunningmessage.open();
        return;
    }
    startstop.disabled = true;
    autobetLib.setStarting(true);
    let time = 15;
    var x = setInterval(function() {
        startstop.innerText = "Starting in " + time + "s";
        time--;
        if (time < 0) {
            clearInterval(x);
            startTimer();
            autobetLib.setStarting(false);
            autobetLib.startBetting();
            startstop.disabled = false;
            startstop.innerText = "stop";
            statusinfo.innerText = "Running";
            statusinfo.className = "text status_running maintext";
        }
    }, 1000);
}

function is_paused() {
    if (pausing) {
        pausing = 0;
        startstop.disabled = false;
        pauseTimer();
        startstop.innerText = "start";
        statusinfo.innerText = "Stopped";
        statusinfo.className = "text status_stopped maintext";
    }
}

function pause(nstoppy) {
    if (!nstoppy)
        autobetLib.stopBetting();
    pausing = 1;
    statusinfo.innerText = "Stopping";
    statusinfo.className = "text status_init maintext";
    startstop.disabled = true;
    var x = setInterval(() => {
        let value = autobetLib.stopped()
        if (value) {
            clearInterval(x);
            is_paused();
        }
    }, 1000);
}

function startTimer() {
    paused = 0;
    running = 1;

    timer = setInterval(() => {
        time = autobetLib.getTimeRunning();
        timeDisp.innerText = convertToTime(time);
    }, 1000);
}

function pauseTimer() {
    clearInterval(timer);
    paused = 1;
    running = 0;
}

function convertToTime(secs) {
    let hours = Math.floor((secs % 86400) / 3600);
    let minutes = Math.floor((secs % 3600) / 60);
    let seconds = secs % 60;
    hours = (hours < 10) ? "0" + hours : hours;
    minutes = (minutes < 10) ? "0" + minutes : minutes;
    seconds = (seconds < 10) ? "0" + seconds : seconds;
    return hours + ':' + minutes + ':' + seconds;
}