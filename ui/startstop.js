var timeDisp = document.getElementById("time");
var startstop = document.getElementById("startstop");
var statusinfo = document.getElementById("statusinfo");
var messagecontainer = document.getElementById("messagecontainer");
var frosted_glass = document.getElementById("frosted-glass");

var startTime;
var updatedTime;
var difference;
var tInterval;
var savedTime;
var paused = 0;
var running = 0;
var pausing = 0;

startstop.addEventListener('click', function () {
  if (!difference || !running) {
    start();
  } else if (!paused & !pausing) {
    pause();
  }
});

eel.expose(keycomb_start);
function keycomb_start() {
  switchScreen();
  startstop.disabled = true;
  startTimer();
  startstop.disabled = false;
  startstop.innerHTML = "stop";
  statusinfo.innerHTML = "Running"
  statusinfo.className = "text status_running maintext"
}

eel.expose(keycomb_stop);
function keycomb_stop() {
  pause(true);
}

function start() {
  startstop.disabled = true;
  var time = 15;
  var x = setInterval(function () {
    startstop.innerHTML = "Starting in " + time + "s";
    time--;
    if (time < 0) {
      clearInterval(x);
      startTimer();
      eel.start_s_function();
      startstop.disabled = false;
      startstop.innerHTML = "stop";
      statusinfo.innerHTML = "Running"
      statusinfo.className = "text status_running maintext"
    }
  }, 1000);
}

function is_paused() {
  if (pausing) {
    pausing = 0;
    startstop.disabled = false;
    progressbar.className = "mdc-linear-progress";
    frosted_glass.className = "frosted-glass-unblur";
    messagecontainer.className = "invisible";
    pauseTimer();
    startstop.innerHTML = "start";
    statusinfo.innerHTML = "Stopped";
    statusinfo.className = "text status_stopped maintext";
  }
}

function pause(nstoppy) {
  if (!nstoppy)
    eel.stop_s_function();
  pausing = 1;
  progressbar.className = "mdc-linear-progress mdc-linear-progress--indeterminate";
  messagecontainer.className = "";
  frosted_glass.className = "frosted-glass-blur";
  startstop.disabled = true;
  var x = setInterval(async function () {
    let value = await eel.stopped()()
    if (value) {
      clearInterval(x);
      is_paused();
    }
  }, 1000)
}

// Timer was stolen from: https://medium.com/@olinations/an-accurate-vanilla-js-stopwatch-script-56ceb5c6f45b
function startTimer() {
  startTime = new Date().getTime();
  tInterval = setInterval(getShowTime, 1);

  paused = 0;
  running = 1;
}

function pauseTimer() {
  clearInterval(tInterval);
  savedTime = difference;
  paused = 1;
  running = 0;
}

function getShowTime() {
  updatedTime = new Date().getTime();
  if (savedTime) {
    difference = (updatedTime - startTime) + savedTime;
  } else {
    difference = updatedTime - startTime;
  }

  var hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  var minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
  var seconds = Math.floor((difference % (1000 * 60)) / 1000);
  var milliseconds = Math.floor((difference % (1000 * 60)) / 100);
  hours = (hours < 10) ? "0" + hours : hours;
  minutes = (minutes < 10) ? "0" + minutes : minutes;
  seconds = (seconds < 10) ? "0" + seconds : seconds;
  timeDisp.innerHTML = hours + ':' + minutes + ':' + seconds;
}