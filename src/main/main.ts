import {MDCRipple} from "@material/ripple";
import {MDCDialog} from "@material/dialog";
import {MDCSwitch} from "@material/switch";
import {MDCSnackbar} from "@material/snackbar";
import {MDCTextField} from "@material/textfield";
import {Titlebar, Color} from "custom-electron-titlebar";

import {variables} from "./variables";
import {setQRCode} from "./qrcode/qrcode_wrapper";
import autobetLib from "@autobet/autobetlib";
import * as utils from "./utils";
import * as autobet_info from "./autobetInfo";
import * as clickSleep from"./clickSleep";
import {loadNavigationStrategy} from "./navigationStrategySelect";
import {getCurrentlySelectedGameWindow} from "./gameSelector";
import {showSnackbar} from "./utils";
import {checkForUpdates} from "./update";

export function init(): void {
    const showqrbutton: HTMLButtonElement = <HTMLButtonElement>document.getElementById('showqrbutton'); // The 'show qr code' button
    MDCRipple.attachTo(showqrbutton);

    const moneythishour: HTMLElement = document.getElementById('moneythishour'); // The money this hour text
    const raceswon: HTMLElement = document.getElementById('raceswon'); // The races won text
    const winprobability: HTMLElement = document.getElementById('winprobability'); // The win probability text
    const moneyall: HTMLElement = document.getElementById('moneyall'); // The money all made text
    const namecontainter: HTMLElement = document.getElementById('namecontainer'); // The autobet name container

    const weblink: HTMLButtonElement = <HTMLButtonElement>document.getElementById('weblink'); // The web interface open button
    MDCRipple.attachTo(weblink);

    // The qr code dialog
    const qrdialog: MDCDialog = new MDCDialog(document.getElementById('qrdialog'));

    //The enable webserver switch
    const enable_webserver: MDCSwitch = new MDCSwitch(document.getElementById('enable-webserver-switch'));

    // The settings saved message snackbar
    const settings_saved_msg: MDCSnackbar = new MDCSnackbar(document.getElementById('settings-saved-message'));
    settings_saved_msg.timeoutMs = 4000;

    // The betting error dialog
    const bettingErrorDialog: MDCDialog = new MDCDialog(document.getElementById('betting-error-dialog'));

    // The game running info text
    const game_running: HTMLElement = document.getElementById('game-running');

    // The dialog displaying the license
    const license_dialog: MDCDialog = new MDCDialog(document.getElementById('license-dialog'));

    // Add a click listener to the 'Licensed under the MIT License' text
    // to open the license dialog when clicked on
    document.getElementById('copyright-opener').addEventListener('click', () => {
        license_dialog.open();
    });

    /**
     * Set the quit callback
     */
    async function setQuitCallback(): Promise<void> {
        autobetLib.callbacks.setQuitCallback(() => {
            utils.quit();
        });
    }

    setQuitCallback();

    // Set the betting exception callback function
    autobetLib.callbacks.setBettingExceptionCallback((err: string) => {
        document.getElementById('betting-error-dialog-content').innerText = "The betting was stopped due to an " +
            "exception thrown in the native module. This may be caused by a program error or the game being " +
            "stuck on a screen. Error message: " + err;
        bettingErrorDialog.open();
    });

    // Set the autobet version
    document.getElementById("autobet-version").innerText = `Version ${autobet_info.version}`;

    // Show the copyright on hovered over the name container
    namecontainter.onmouseenter = () => {
        namecontainter.className = "hovered subcontainer";
        document.getElementById("copyright").className = "hovered";
        document.getElementById("autobet-version").className = "hovered";
    };

    namecontainter.onmouseleave = () => {
        namecontainter.className = "subcontainer";
        document.getElementById("copyright").className = "";
        document.getElementById("autobet-version").className = "";
    };

    let moneyMade: number = 0;
    let won: number = 0;
    let lost: number = 0;

    /**
     * Show the qr code
     */
    function showQRCode(): void {
        qrdialog.open();
        variables.startstop.disabled = true;
        showqrbutton.disabled = true;
    }

    // Listen for the qr dialog to close
    qrdialog.listen('MDCDialog:closing', function () {
        variables.startstop.disabled = false;
        showqrbutton.disabled = false;
    });

    // Show the qr code on clicked on the show qr code button
    showqrbutton.addEventListener('click', function () {
        showQRCode();
    });

    // Set the exception callback
    autobetLib.callbacks.setExceptionCallback(utils.exception);

    /**
     * Make sums more readable by adding 'K' for thousand
     * or 'M' for million to the end of the sum
     *
     * @param sum the sum to make pretty
     * @param k whether to replace thousand by 'K'
     * @returns the resulting value in the format [-]$<0-999>.<0-99><B|M|K>
     */
    function makeSumsDisplayable(sum: number, k: boolean = false): string {
        const negative: boolean = sum < 0;
        sum = Math.abs(sum);

        let res: string;

        if (sum >= 1000000000) { // One billion
            res = (sum / 1000000000).toFixed(2) + "B";
        } else if (sum >= 1000000) { // One million
            res = (sum / 1000000).toFixed(2) + "M";
        } else if (k && sum >= 1000) { // One thousand
            res = (sum / 1000).toFixed(2) + "K";
        } else {
            res = String(sum);
        }

        // Optional: Convert gazillions

        if (negative) {
            return "-$" + res;
        } else {
            return "$" + res;
        }
    }

    // Set the add money callback
    autobetLib.callbacks.setAddMoneyCallback(addMoney);

    /**
     * Add some money that was made
     *
     * @param value the amount of money to add/subtract
     */
    function addMoney(value: number): void {
        if (value !== 0) {
            moneyMade += value;
            if (value > 0) won++;
        } else {
            lost++;
        }
        updateValues();
    }

    // Set the all money made callback
    autobetLib.callbacks.setAllMoneyMadeCallback(setAllMoneyMade);

    /**
     * Set all money made
     *
     * @param value the overall amount of money made all time
     */
    function setAllMoneyMade(value: number): void {
        moneyall.innerText = makeSumsDisplayable(value);
    }

    /**
     * Update the money this hour, races won and win probability texts
     */
    function updateValues(): void {
        moneythishour.innerText = makeSumsDisplayable(getMoneyPerHour(), true) + "/hr";
        raceswon.innerText = String(won);
        winprobability.innerText = Math.round((won / (won + lost)) * 1000) / 10 + "%";
    }

    /**
     * Get the money made per hour
     *
     * @returns the amount of money made this hour
     */
    function getMoneyPerHour(): number {
        return moneyMade * (3600 / variables.time);
    }

    // Set the 'set gta running' callback
    autobetLib.callbacks.setGtaRunningCallback(set_gta_running);

    /**
     * Set whether GTA V is running
     *
     * @param val whether GTA V is running
     */
    function set_gta_running(val: boolean): void {
        variables.gta_running = val;
        if (variables.gta_running) {
            game_running.innerText = "Yes";
            game_running.className = "text status_running maintext";
        } else {
            game_running.innerText = "No";
            game_running.className = "text status_stopped maintext";
        }
    }

    /**
     * Set the ips
     */
    function setIPs(): void {
        let ip: string = autobetLib.getIP();
        weblink.innerText = `http://${ip}:8027`;
        setQRCode(ip);
    }

    // Open the web page when the web link is clicked
    weblink.addEventListener('click', () => {
        autobetLib.openWebsite();
    });

    // Listen for change on the enable webserver switch
    enable_webserver.listen('change', () => {
        enable_webserver.disabled = true;
        autobetLib.settings.setWebServer(enable_webserver.checked).then((res: boolean) => {
            if (!res) {
                // If the call failed, set the switch to the web servers current state
                enable_webserver.checked = autobetLib.settings.webServerRunning();
            }

            // Disable the buttons for the web server or enable them
            if (enable_webserver.checked) {
                weblink.disabled = false;
                showqrbutton.disabled = false;
                setIPs();
            } else {
                weblink.disabled = true;
                weblink.innerText = "not running";
                showqrbutton.disabled = true;
            }

            // Save the settings
            autobetLib.settings.saveSettings().then(() => {
                enable_webserver.disabled = false;
                settings_saved_msg.close();
                settings_saved_msg.open();
            });
        });
    });

    // when the window unloads, quit electron
    window.onbeforeunload = function (): void {
        autobetLib.shutdown().then(() => {
            utils.quit();
        });
    }

    /**
     * The main function
     */
    async function main(): Promise<void> {
        variables.startstop.disabled = true;
        // Create the title bar
        new Titlebar({
            backgroundColor: Color.fromHex('#151515'),
            icon: "../icon.png",
            menu: null,
            titleHorizontalAlignment: 'left'
        });

        enable_webserver.disabled = true;
        showqrbutton.disabled = true;

        // Initialize
        let initialized: boolean = await autobetLib.init();
        if (initialized) {
            variables.statusinfo.classList.remove("status_init");
            variables.statusinfo.classList.add("status_stopped");
            variables.statusinfo.innerText = "Stopped";
            autobetLib.logging.debug("main.ts", "autobetlib initialized.");
            variables.startstop.disabled = false;
        } else {
            autobetLib.logging.error("main.ts", "Could not initialize");
            return;
        }

        loadNavigationStrategy();
        getCurrentlySelectedGameWindow();
        clickSleep.loadSleepTimes();

        autobet_info.getLicense().then((res: string) => {
            document.getElementById('license-dialog-content').innerText = res;
        }, rej => {
            autobetLib.logging.error("main.ts", "Could not get the license: " + rej);
        });

        // Load the winnings
        await autobetLib.loadWinnings();

        // Set switches checked
        time_sleep_field.value = String(autobetLib.settings.getTimeSleep());
        log_to_file_switch.checked = autobetLib.logging.isLoggingToFile();
        log_to_console_switch.checked = autobetLib.logging.isLoggingToConsole();
        // Resize the "console" if logging to console is enabled
        if (autobetLib.logging.isLoggingToConsole()) {
            log_textfield_resizer.style.height = "178px";
        }

        // Check the web server activated and start it if activated
        enable_webserver.checked = autobetLib.settings.webServerActivated();
        if (autobetLib.settings.webServerActivated()) {
            autobetLib.startWebServer().then(initialized => {
                enable_webserver.checked = initialized;
                if (initialized) {
                    autobetLib.logging.debug("main.ts", "Web server started.");
                    weblink.disabled = false;
                    showqrbutton.disabled = false;
                    setIPs();
                } else {
                    autobetLib.logging.error("main.ts", "Could not start web server");
                    weblink.disabled = true;
                    weblink.innerText = "not running";
                    showqrbutton.disabled = true;
                }
                enable_webserver.disabled = false;
            });
        } else {
            weblink.disabled = true;
            weblink.innerText = "not running";
            showqrbutton.disabled = true;
            enable_webserver.disabled = false;
        }

        checkForUpdates();
        await autobetLib.setOddTranslations();
        await autobetLib.start();
    }

    // Run the main function
    main().then(() => {
        autobetLib.logging.debug("main.ts", "JS main function finished");
    }, (e) => {
        console.error(e);
        // main failed
        utils.errordialog.open();
        utils.errordialog.listen("MDCDialog:closed", async function () {
            try {
                await autobetLib.shutdown();
            } catch (ignored) {
            }
            utils.quit();
        });
    });

    // Settings ================================================

    // MDC init
    const time_sleep_field: MDCTextField = new MDCTextField(document.getElementById("time-sleep-field")); // The time-sleep text field
    const full_debug: MDCSwitch = new MDCSwitch(document.getElementById("full-debug-switch")); // The full debug switch
    const log_to_file_switch: MDCSwitch = new MDCSwitch(document.getElementById("log-to-file-switch")); // The log to file switch
    const log_to_console_switch: MDCSwitch = new MDCSwitch(document.getElementById("log-to-console-switch")); // The log to console switch
    const log_textfield: MDCTextField = new MDCTextField(document.getElementById("log-textfield")); // The fake console

    const log_textfield_resizer: HTMLElement = document.getElementById("log-textfield-resizer"); // The console resizer

    // Listen for keyup events on the input of the time_sleep text field
    (time_sleep_field as any).input_.addEventListener('keyup', (event: KeyboardEvent) => {
        // Only do this if the key pressed was 'enter'
        if (event.keyCode === 13) {
            event.preventDefault();
            // If the length of the value string is not zero,
            // save the settings
            if (time_sleep_field.value.length !== 0) {
                autobetLib.settings.setTimeSleep(Number(time_sleep_field.value));
                time_sleep_field.disabled = true;

                // Save the settings
                autobetLib.settings.saveSettings().then(() => {
                    time_sleep_field.disabled = false;
                    settings_saved_msg.close();
                    settings_saved_msg.open();
                });
            }
        }
    });

    // Discard the setting on focus loss
    (time_sleep_field as any).input_.addEventListener('focusout', () => {
        if (!time_sleep_field.disabled) {
            time_sleep_field.value = String(autobetLib.settings.getTimeSleep());
            showSnackbar("Settings discarded.");
        }
    });

    // Listen for change on the switch that toggles full debugging
    full_debug.listen('change', () => {
        full_debug.disabled = true;
        if (full_debug.checked) {
            log_to_file_switch.checked = true;
            log_to_file_switch.disabled = true;

            // If we are not already logging to file, enable that.
            // Or enable at least that switch so the user knows its enabled.
            // Also, prevent the user from switching that switch, as
            // logging to file is a essential part of debug:full
            if (!autobetLib.logging.isLoggingToFile()) {
                autobetLib.logging.setLogToFile(true);
                autobetLib.settings.saveSettings().then(() => {
                    settings_saved_msg.close();
                    settings_saved_msg.open();
                });
            }
        } else {
            log_to_file_switch.disabled = false;
        }

        // Set debug:full
        autobetLib.settings.setDebugFull(full_debug.checked).then((res: boolean) => {
            full_debug.disabled = false;
            if (!res) { // If the call failed, do some stuff
                full_debug.checked = false;
                autobetLib.logging.warn("main.js", "setDebugFull returned false");
            }
        });
    });

    // Listen for change on the switch that toggles logging to file
    log_to_file_switch.listen('change', () => {
        log_to_file_switch.disabled = true;
        autobetLib.logging.setLogToFile(log_to_file_switch.checked);

        // save settings
        autobetLib.settings.saveSettings().then(() => {
            log_to_file_switch.disabled = false;
            settings_saved_msg.close();
            settings_saved_msg.open();
        });
    });

    // Listen for change on the switch that toggles logging to "console"
    log_to_console_switch.listen('change', () => {
        // Disable the log to console switch,
        // re-enable it when the settings are saved
        log_to_console_switch.disabled = true;
        autobetLib.logging.setLogToConsole(log_to_console_switch.checked);

        if (!log_to_console_switch.checked) {
            // Empty the text field and set its size to its default.
            log_textfield.value = "";
            log_textfield_resizer.style.height = "56px";

            // Do the exact thing again. All these calls are async so it can still
            // be written to the "console" even though logging is disabled.
            // Jank solutions require more janky response. Write that down, kids.
            setTimeout(() => {
                log_textfield.value = "";
                log_textfield_resizer.style.height = "56px";
            }, 500);

            // Animate the resize process
            log_textfield_resizer.className = "mdc-text-field__resizer decrease-height";
            setTimeout(() => {
                log_textfield_resizer.className = "mdc-text-field__resizer";
            }, 500);
        } else if (log_textfield_resizer.style.height === "56px") {
            // Animate the resize process
            log_textfield_resizer.className = "mdc-text-field__resizer increase-height";
            setTimeout(() => {
                log_textfield_resizer.style.height = "178px";
            }, 500);
        }

        // save settings
        autobetLib.settings.saveSettings().then(() => {
            log_to_console_switch.disabled = false;
            settings_saved_msg.close();
            settings_saved_msg.open();
        });
    });

    // Set a callback for logging to "console"
    autobetLib.logging.setLogCallback((msg: string) => {
        // Only do this if the text field is scrolled all the way down
        if (((log_textfield as any).input_.scrollTop + (log_textfield as any).input_.clientHeight) >=
            ((log_textfield as any).input_.scrollHeight - 20)) {
            // Append the message
            log_textfield.value += msg;

            // The text field was scrolled down, scroll all the way down,
            // so new messages will always be on the bottom of the text field
            (log_textfield as any).input_.scroll({
                top: (log_textfield as any).input_.scrollHeight,
                left: 0
            });
        } else {
            // The text field is not scrolled all the way down, just append the message
            log_textfield.value += msg;
        }
    });

    // Add some info texts
    document.getElementById("time-sleep-info").addEventListener('click', () => {
        utils.showDescription("Time-sleep", "Set the time to sleep after a bet has started. Use this option, when the program did not immediately start a new bet when the " +
            "race has finished. Press enter to save, the default value is 36.");
    });

    document.getElementById("full-debug-info").addEventListener('click', () => {
        utils.showDescription("Full Debug", "This option will create a zip file called 'autobet_debug.zip' on you Desktop. This File will contain a log and screenshots for " +
            "debugging purposes. IMPORTANT: If you submit this file anywhere, make sure to delete any personal information from the zip file.");
    });

    document.getElementById("debug-info").addEventListener('click', () => {
        utils.showDescription("Debugging and logging", "Log to File: Set if the program should log to a file. This option will automatically activated, when the full debug " +
            "option is activated. Log to Console: This option will display logging information in the 'View log' text field.");
    });

    document.getElementById("custom-betting-function-info").addEventListener('click', () => {
        utils.showDescription("Custom betting function", "In here you can set a custom function to be called in order to determine whether (an where) a bet should be placed." +
            "The function should be written in JavaScript, the odds are stored in the odds variable and at the end, you should pass the odd for a bet to be placed on to " +
            "the setResult() function. If no bet should be placed, pass null to setResult(). If you don't pass anythin, the result will be interpreted as invalid and the " +
            "Program will fall back to the native implementation.");
    });
}