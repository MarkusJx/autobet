var timeDisp = document.getElementById("time");
var startstop = document.getElementById("startstop");
var statusinfo = document.getElementById("statusinfo");
var messagecontainer = document.getElementById("messagecontainer");
var frosted_glass = document.getElementById("frosted-glass");

var paused = 0;
var running = 0;
var pausing = 0;
var timer = null;
var time = 0;

startstop.addEventListener('click', function () {
  if (!running) {
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
  statusinfo.innerHTML = "Running";
  statusinfo.className = "text status_running maintext";
}

eel.expose(keycomb_stop);
function keycomb_stop() {
  pause(true);
}

function start() {
  startstop.disabled = true;
  eel.set_starting(true);
  let time = 15;
  var x = setInterval(function () {
    startstop.innerHTML = "Starting in " + time + "s";
    time--;
    if (time < 0) {
      clearInterval(x);
      startTimer();
      eel.set_starting(false);
      eel.start_s_function();
      startstop.disabled = false;
      startstop.innerHTML = "stop";
      statusinfo.innerHTML = "Running";
      statusinfo.className = "text status_running maintext";
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
    let value = await eel.stopped()();
    if (value) {
      clearInterval(x);
      is_paused();
    }
  }, 1000)
}

function startTimer() {
  paused = 0;
  running = 1;

  timer = setInterval(function () {
    time += 1;
    eel.add_sec();
    timeDisp.innerHTML = convertToTime(time);
    console.log(time)
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