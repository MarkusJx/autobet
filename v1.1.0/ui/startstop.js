var timeDisp = document.getElementById("time");
var startstop = document.getElementById("startstop");
var statusinfo = document.getElementById("statusinfo");
var messagecontainer = document.getElementById("messagecontainer");
var frosted_glass = document.getElementById("frosted-glass");

var gtanotrunningmessage = document.getElementById("gta-not-running-message");
gtanotrunningmessage = new mdc.snackbar.MDCSnackbar(gtanotrunningmessage);
gtanotrunningmessage.timeoutMs = 10000;

var paused = 0;
var running = 0;
var pausing = 0;
var timer = null;
var time = 0;

startstop.addEventListener('click', function () {
  if (!running) {
    start();
  } else if (!paused && !pausing) {
    pause();
  }
});

cppJsLib.expose(ui_keycomb_start);
function ui_keycomb_start() {
  startstop.disabled = true;
  startTimer();
  startstop.disabled = false;
  startstop.innerHTML = "stop";
  statusinfo.innerHTML = "Running";
  statusinfo.className = "text status_running maintext";
}

cppJsLib.expose(ui_keycomb_stop);
function ui_keycomb_stop() {
  pause(true);
}

function start() {
  if (!gta_running) {
    gtanotrunningmessage.open();
    return;
  }
  startstop.disabled = true;
  cppJsLib.set_starting(true);
  let time = 15;
  var x = setInterval(function () {
    startstop.innerHTML = "Starting in " + time + "s";
    time--;
    if (time < 0) {
      clearInterval(x);
      startTimer();
      cppJsLib.set_starting(false);
      cppJsLib.js_start_script();
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
    cppJsLib.js_stop_script();
  pausing = 1;
  progressbar.className = "mdc-linear-progress mdc-linear-progress--indeterminate";
  messagecontainer.className = "";
  frosted_glass.className = "frosted-glass-blur";
  startstop.disabled = true;
  var x = setInterval(async function () {
    cppJsLib.stopped().then((value) => {
      if (value) {
        clearInterval(x);
        is_paused();
      }
    });
  }, 1000)
}

function startTimer() {
  paused = 0;
  running = 1;

  timer = setInterval(async function () {
    time = await cppJsLib.get_time();
    //time += 1;
    //cppJsLib.add_sec();
    timeDisp.innerHTML = convertToTime(time);
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