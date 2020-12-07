'use strict';
const statusinfo = document.getElementById("statusinfo");

{
    const timeDisp = document.getElementById("time"); // The time text field
    const gtanotrunningmessage = new mdc.snackbar.MDCSnackbar(document.getElementById("gta-not-running-message"));
    gtanotrunningmessage.timeoutMs = 10000;

    const open_editor = document.getElementById('open-editor'); // The show/hide editor button
    const editor_container = document.getElementById('editor-container'); // The editor container

    let paused = 0;
    let running = 0;
    let pausing = 0;
    let timer = null;
    let time = 0;

    /**
     * Close and disable the code editor
     */
    function disableEditor() {
        // If the editor container is already opened, close it
        if (editor_container.classList.contains("opened")) {
            editor_container.classList.remove("opened");
        }

        document.getElementById('open-editor-button-label').innerText = "SHOW EDITOR";
        open_editor.disabled = true;
    }

    /**
     * Re-enable the code editor
     */
    function enableEditor() {
        open_editor.disabled = false;
    }

    // Start/stop on click on the start/stop button
    startstop.addEventListener('click', function () {
        if (!running) {
            start();
        } else if (!paused && !pausing) {
            pause();
        }
    });

    autobetLib.callbacks.setUiKeycombStartCallback(ui_keycomb_start);

    /**
     * Start betting from a key combination
     */
    function ui_keycomb_start() {
        disableEditor();
        startstop.disabled = true;
        startTimer();
        startstop.disabled = false;
        startstop.innerText = "stop";
        statusinfo.innerText = "Running";
        statusinfo.className = "text status_running maintext";
    }

    autobetLib.callbacks.setUiKeycombStopCallback(ui_keycomb_stop);

    /**
     * Stop the betting using a key combination
     */
    function ui_keycomb_stop() {
        pause(true);
    }

    /**
     * Start betting
     */
    function start() {
        if (!gta_running) {
            gtanotrunningmessage.open();
            return;
        }

        disableEditor();
        startstop.disabled = true;
        autobetLib.setStarting(true);
        let time = 15;
        var x = setInterval(function () {
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

    /**
     * Pause the betting
     */
    function is_paused() {
        if (pausing) {
            pausing = 0;
            startstop.disabled = false;
            pauseTimer();
            startstop.innerText = "start";
            statusinfo.innerText = "Stopped";
            statusinfo.className = "text status_stopped maintext";
            enableEditor();
        }
    }

    /**
     * Start pausing
     * 
     * @param {boolean} nstoppy whether to stop the actual betting in the backend
     */
    function pause(nstoppy) {
        if (!nstoppy)
            autobetLib.stopBetting();
        pausing = 1;
        statusinfo.innerText = "Stopping";
        statusinfo.className = "text status_init maintext";
        startstop.disabled = true;
        var x = setInterval(() => {
            let value = autobetLib.stopped();
            if (value) {
                clearInterval(x);
                is_paused();
            }
        }, 1000);
    }

    /**
     * Start the timer
     */
    function startTimer() {
        paused = 0;
        running = 1;

        timer = setInterval(() => {
            time = autobetLib.getTimeRunning();
            timeDisp.innerText = convertToTime(time);
        }, 1000);
    }

    /**
     * Pause the timer
     */
    function pauseTimer() {
        clearInterval(timer);
        paused = 1;
        running = 0;
    }

    /**
     * Conver time in seconds to more readable time in the format HH:mm:ss
     * 
     * @param {number} secs the seconds to convert
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
}