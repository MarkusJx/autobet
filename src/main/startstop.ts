import { MDCSnackbar } from "@material/snackbar";

import { variables } from "./variables";
import autobetLib from "@autobet/autobetlib";

export function init(): void {
    const timeDisp: HTMLElement = document.getElementById("time"); // The time text field
    const gtanotrunningmessage: MDCSnackbar = new MDCSnackbar(document.getElementById("gta-not-running-message"));
    gtanotrunningmessage.timeoutMs = 10000;

    const open_editor: HTMLButtonElement = <HTMLButtonElement>document.getElementById('open-editor'); // The show/hide editor button
    const editor_container: HTMLElement = document.getElementById('editor-container'); // The editor container

    let paused: number = 0;
    let running: number = 0;
    let pausing: number = 0;
    let timer: NodeJS.Timeout = null;

    /**
     * Close and disable the code editor
     */
    function disableEditor(): void {
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
    function enableEditor(): void {
        open_editor.disabled = false;
    }

    // Start/stop on click on the start/stop button
    variables.startstop.addEventListener('click', function (): void {
        if (!running) {
            start();
        } else if (!paused && !pausing) {
            pause(false);
        }
    });

    autobetLib.callbacks.setUiKeycombStartCallback(ui_keycomb_start);

    /**
     * Start betting from a key combination
     */
    function ui_keycomb_start(): void {
        disableEditor();
        variables.startstop.disabled = true;
        startTimer();
        variables.startstop.disabled = false;
        variables.startstop.innerText = "stop";
        variables.statusinfo.innerText = "Running";
        variables.statusinfo.className = "text status_running maintext";
    }

    autobetLib.callbacks.setUiKeycombStopCallback(ui_keycomb_stop);

    /**
     * Stop the betting using a key combination
     */
    function ui_keycomb_stop(): void {
        pause(true);
    }

    /**
     * Start betting
     */
    function start(): void {
        if (!variables.gta_running) {
            gtanotrunningmessage.open();
            return;
        }

        disableEditor();
        variables.startstop.disabled = true;
        autobetLib.setStarting(true);
        let time = 15;
        var x = setInterval(function () {
            variables.startstop.innerText = "Starting in " + time + "s";
            time--;
            if (time < 0) {
                clearInterval(x);
                startTimer();
                autobetLib.setStarting(false);
                autobetLib.startBetting();
                variables.startstop.disabled = false;
                variables.startstop.innerText = "stop";
                variables.statusinfo.innerText = "Running";
                variables.statusinfo.className = "text status_running maintext";
            }
        }, 1000);
    }

    /**
     * Pause the betting
     */
    function is_paused(): void {
        if (pausing) {
            pausing = 0;
            variables.startstop.disabled = false;
            pauseTimer();
            variables.startstop.innerText = "start";
            variables.statusinfo.innerText = "Stopped";
            variables.statusinfo.className = "text status_stopped maintext";
            enableEditor();
        }
    }

    /**
     * Start pausing
     * 
     * @param nstoppy whether to stop the actual betting in the backend
     */
    function pause(nstoppy: boolean): void {
        if (!nstoppy)
            autobetLib.stopBetting();
        pausing = 1;
        variables.statusinfo.innerText = "Stopping";
        variables.statusinfo.className = "text status_init maintext";
        variables.startstop.disabled = true;
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
    function startTimer(): void {
        paused = 0;
        running = 1;

        timer = setInterval(() => {
            variables.time = autobetLib.getTimeRunning();
            timeDisp.innerText = convertToTime(variables.time);
        }, 1000);
    }

    /**
     * Pause the timer
     */
    function pauseTimer(): void {
        clearInterval(timer);
        paused = 1;
        running = 0;
    }

    /**
     * Conver time in seconds to more readable time in the format HH:mm:ss
     * 
     * @param secs the seconds to convert
     * @returns the time in a readable format
     */
    function convertToTime(secs: number): string {
        let hours: number | string = Math.floor((secs % 86400) / 3600);
        let minutes: number | string = Math.floor((secs % 3600) / 60);
        let seconds: number | string = secs % 60;
        hours = (hours < 10) ? "0" + hours : hours;
        minutes = (minutes < 10) ? "0" + minutes : minutes;
        seconds = (seconds < 10) ? "0" + seconds : seconds;
        return hours + ':' + minutes + ':' + seconds;
    }
}