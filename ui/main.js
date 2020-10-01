let startstop = document.getElementById('startstop');

mdc.ripple.MDCRipple.attachTo(startstop);

const showqrbutton = document.getElementById('showqrbutton');
const qrcontainer = document.getElementById('qrcontainer');
const qrdonebutton = document.getElementById('qrdonebutton');

mdc.ripple.MDCRipple.attachTo(showqrbutton);

const moneythishour = document.getElementById('moneythishour');
const raceswon = document.getElementById('raceswon');
const winprobability = document.getElementById('winprobability');
const moneyall = document.getElementById('moneyall');
let errordialog = document.getElementById("error-dialog-container");
const namecontainter = document.getElementById("namecontainer");

const weblink = document.getElementById("weblink");
mdc.ripple.MDCRipple.attachTo(weblink);

mdc.autoInit();

let qrdialog = document.getElementById("qrdialog");
qrdialog = new mdc.dialog.MDCDialog(qrdialog);

let stoptext = document.getElementById("stoptext");

const enable_webserver = new mdc.switchControl.MDCSwitch(document.getElementById("enable-webserver-switch"));
const settings_saved_msg = new mdc.snackbar.MDCSnackbar(document.getElementById("settings-saved-message"));
settings_saved_msg.timeoutMs = 4000;

const game_running = document.getElementById("game-running");

errordialog = new mdc.dialog.MDCDialog(errordialog);

async function setQuitCallback() {
    autobetLib.callbacks.setQuitCallback(() => {
        electron.quit();
    });
}
setQuitCallback();

namecontainter.onmouseenter = () => {
    namecontainter.classList = "hovered subcontainer";
    document.getElementById("copyright").classList = "hovered";
};

namecontainter.onmouseleave = () => {
    namecontainter.classList = "subcontainer";
    document.getElementById("copyright").classList = "";
};

let moneyMade = 0;
let won = 0;
let lost = 0;
let gta_running = false;

function showQRCode() {
    qrdialog.open();
    startstop.disabled = true;
    showqrbutton.disabled = true;
}

qrdialog.listen('MDCDialog:closing', function() {
    startstop.disabled = false;
    showqrbutton.disabled = false;
});

showqrbutton.addEventListener('click', function() {
    showQRCode();
});

autobetLib.callbacks.setExceptionCallback(exception);

function exception() {
    errordialog.open();
    errordialog.listen("MDCDialog:closed", function() {
        autobetLib.shutdown();
        electron.quit();
    });
}

function makeSumsDisplayable(sum, k = false) {
    let negative = sum < 0;
    sum = Math.abs(sum);

    if (sum > 1000000000) { // One billion
        if (negative) {
            return ((Math.round(sum / 100000000) / 10) * (-1)) + "B";
        } else {
            return Math.round(sum / 100000000) / 10 + "B";
        }
    } else if (sum > 1000000) { // One million
        if (negative) {
            return ((Math.round(sum / 100000) / 10) * (-1)) + "M";
        } else {
            return Math.round(sum / 100000) / 10 + "M";
        }
    } else if (k && sum > 1000) { // One thousand
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

autobetLib.callbacks.setAddMoneyCallback(addMoney);

function addMoney(value) {
    if (value != 0) {
        moneyMade += value;
        if (value > 0) won++;
    } else {
        lost++;
    }
    updateValues();
}

autobetLib.callbacks.setAllMoneyMadeCallback(setAllMoneyMade);

function setAllMoneyMade(value) {
    moneyall.innerHTML = "$" + makeSumsDisplayable(value);
}

function updateValues() {
    moneythishour.innerHTML = "$" + makeSumsDisplayable(getMoneyPerHour(), true) + "/hr";
    raceswon.innerHTML = won;
    winprobability.innerHTML = Math.round((won / (won + lost)) * 1000) / 10 + "%";
}

function getMoneyPerHour() {
    return moneyMade * (3600 / time);
}

autobetLib.callbacks.setGtaRunningCallback(set_gta_running);

function set_gta_running(val) {
    console.log("set gta v running to " + val);
    gta_running = val;
    if (gta_running) {
        game_running.innerHTML = "Yes";
        game_running.className = "text status_running maintext";
    } else {
        game_running.innerHTML = "No";
        game_running.className = "text status_stopped maintext";
    }
}

function setQRCode(ip) {
    console.log("Got own IP: " + ip);
    new QRCode(document.getElementById("qrcode"), {
        text: "http://" + ip + ":8027",
        width: 352,
        height: 352,
        colorDark: "#000000",
        colorLight: "#ffffff"
    });
}

// set the ips
function setIPs() {
    let ip = autobetLib.getIP();
    weblink.innerHTML = "http://" + ip + ":8027";
    setQRCode(ip);
}

// Open the web page when the web link is clicked
weblink.addEventListener('click', () => {
    autobetLib.openWebsite();
});

// Listen for change on the enable webserver switch
enable_webserver.listen('change', () => {
    enable_webserver.disabled = true;
    autobetLib.settings.setWebServer(enable_webserver.checked).then((res) => {
        if (!res) { // If the call failed, set the switch to the web servers current state
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
window.onbeforeunload = function() {
    autobetLib.shutdown().then(() => {
        electron.quit();
    });
}

async function main() {
    startstop.disabled = true;
    // Create the title bar
    titlebar.create();

    enable_webserver.disabled = true;

    // Initialize
    let initialized = await autobetLib.init();
    if (initialized) {
        statusinfo.classList.remove("status_init");
        statusinfo.classList.add("status_stopped");
        statusinfo.innerHTML = "Stopped";
        console.log("Initialized.");
        startstop.disabled = false;
    } else {
        console.error("Could not initialize");
    }

    await autobetLib.loadWinnings();

    // Set switches checked
    time_sleep_field.value = autobetLib.settings.getTimeSleep();
    log_to_file_switch.checked = autobetLib.logging.isLoggingToFile();
    log_to_console_switch.checked = autobetLib.logging.isLoggingToConsole();
    // Resize the "console" if logging to console is enabled
    if (autobetLib.logging.isLoggingToConsole()) {
        log_textfield_resizer.style.height = "178px";
    }

    // Check the web server activated and start it if activated
    enable_webserver.checked = autobetLib.settings.webServerActivated();
    if (autobetLib.settings.webServerActivated()) {
        initialized = await autobetLib.startWebServer();
        enable_webserver.checked = initialized;
        if (initialized) {
            console.log("Web server started.");
            weblink.disabled = false;
            showqrbutton.disabled = false;
            setIPs();
        } else {
            console.error("Could not start web server");
            weblink.disabled = true;
            weblink.innerText = "not running";
            showqrbutton.disabled = true;
        }
    } else {
        weblink.disabled = true;
        weblink.innerText = "not running";
        showqrbutton.disabled = true;
    }
    enable_webserver.disabled = false;

    autobetLib.start();
}

main().then(() => {
    console.log("Main finished.");
}, () => {
    // main failed
    errordialog.open();
    errordialog.listen("MDCDialog:closed", function() {
        autobetLib.shutdown();
        electron.quit();
    });
});

// Settings ================================================

// MDC init
const description_dialog = new mdc.dialog.MDCDialog(document.getElementById("description-dialog"));
const time_sleep_field = new mdc.textField.MDCTextField(document.getElementById("time-sleep-field"));
const full_debug = new mdc.switchControl.MDCSwitch(document.getElementById("full-debug-switch"));
const log_to_file_switch = new mdc.switchControl.MDCSwitch(document.getElementById("log-to-file-switch"));
const log_to_console_switch = new mdc.switchControl.MDCSwitch(document.getElementById("log-to-console-switch"));
const log_textfield = new mdc.textField.MDCTextField(document.getElementById("log-textfield"));

const log_textfield_resizer = document.getElementById("log-textfield-resizer");

/**
 * Show the description
 * 
 * @param {String} title the title
 * @param {String} description the description
 */
function showDescription(title, description) {
    document.getElementById("description-dialog-title").innerHTML = title;
    description_dialog.content_.innerText = description;

    description_dialog.open();
}

// Listen for keyup events on the input of the time_sleep text field
time_sleep_field.input_.addEventListener('keyup', (event) => {
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
    autobetLib.settings.setDebugFull(full_debug.checked).then((res) => {
        if (!res) { // If the call failed, do some stuff
            full_debug.checked = false;
            console.warn("setDebugFull returned false");
        }
        full_debug.disabled = false;
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
    log_to_console_switch.disabled = true;
    autobetLib.logging.setLogToConsole(log_to_console_switch.checked);

    if (!log_to_console_switch.checked) {
        // Empty the text field and set its size to its default.
        log_textfield.value = "";
        log_textfield_resizer.style.height = "56px";

        // Do the exact thing again. All these calls are async so it can still
        // be written to the "console" even though logging is disabled.
        // Jank solutions require more janky solutions as a response.
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
autobetLib.logging.setLogCallback((msg) => {
    // Only do this if the text field is scrolled all the way down
    if ((log_textfield.input_.scrollTop + log_textfield.input_.clientHeight) >= (log_textfield.input_.scrollHeight - 20)) {
        // Append the message
        log_textfield.value += msg;

        // The text field was scrolled down, scroll all the way down,
        // so new messages will always be on the bottom of the text field
        log_textfield.input_.scroll({
            top: log_textfield.input_.scrollHeight,
            left: 0
        });
    } else {
        // The text field is not scrolled all the way down, just append the message
        log_textfield.value += msg;
    }
});

// Add some info texts
document.getElementById("time-sleep-info").addEventListener('click', () => {
    showDescription("Time-sleep", "Set the time to sleep after a bet has started. Use this option, when the program did not immediately start a new bet when the " +
        "race has finished. Press enter to save, the default value is 36.");
});

document.getElementById("full-debug-info").addEventListener('click', () => {
    showDescription("Full Debug", "This option will create a zip file called 'autobet_debug.zip' on you Desktop. This File will contain a log and screenshots for " +
        "debugging purposes. IMPORTANT: If you submit this file anywhere, make sure to delete any personal information from the zip file.");
});

document.getElementById("debug-info").addEventListener('click', () => {
    showDescription("Debugging and logging", "Log to File: Set if the program should log to a file. This option will automatically activated, when the full debug " +
        "option is activated. Log to Console: This option will display logging information in the 'View log' text field.");
});