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
    moneyall.innerHTML = makeSumsDisplayable(value) + " $";
}

function updateValues() {
    moneythishour.innerHTML = makeSumsDisplayable(getMoneyPerHour(), true) + " $/hr";
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

function setIPs() {
    let ip = autobetLib.getIP();
    weblink.innerHTML = "http://" + ip + ":8027";
    setQRCode(ip);
}

weblink.addEventListener('click', () => {
    autobetLib.openWebsite();
});

enable_webserver.listen('change', () => {
    enable_webserver.disabled = true;
    autobetLib.settings.setWebServer(enable_webserver.checked).then((res) => {
        if (!res) {
            enable_webserver.checked = autobetLib.settings.webServerRunning();
        }

        if (enable_webserver.checked) {
            weblink.disabled = false;
            showqrbutton.disabled = false;
            setIPs();
        } else {
            weblink.disabled = true;
            weblink.innerText = "not running";
            showqrbutton.disabled = true;
        }

        autobetLib.settings.saveSettings().then(() => {
            enable_webserver.disabled = false;
            settings_saved_msg.close();
            settings_saved_msg.open();
        });
    });
});

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

    // Set swtches checkes
    time_sleep_field.value = autobetLib.settings.getTimeSleep();
    log_to_file_switch.checked = autobetLib.logging.isLoggingToFile();
    log_to_console_switch.checked = autobetLib.logging.isLoggingToConsole();
    if (autobetLib.logging.isLoggingToConsole()) {
        log_textfield_resizer.style.height = "178px";
    }

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

time_sleep_field.input_.addEventListener('keyup', (event) => {
    if (event.keyCode === 13) {
        event.preventDefault();
        if (time_sleep_field.value.length !== 0) {
            autobetLib.settings.setTimeSleep(Number(time_sleep_field.value));
            time_sleep_field.disabled = true;
            autobetLib.settings.saveSettings().then(() => {
                time_sleep_field.disabled = false;
                settings_saved_msg.close();
                settings_saved_msg.open();
            });
        }
    }
});

full_debug.listen('change', () => {
    full_debug.disabled = true;
    if (full_debug.checked) {
        log_to_file_switch.checked = true;
        log_to_file_switch.disabled = true;
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

    autobetLib.settings.setDebugFull(full_debug.checked).then((res) => {
        if (!res) {
            full_debug.checked = false;
            console.warn("setDebugFull returned false");
        }
        full_debug.disabled = false;
    });
});

log_to_file_switch.listen('change', () => {
    log_to_file_switch.disabled = true;
    autobetLib.logging.setLogToFile(log_to_file_switch.checked);
    autobetLib.settings.saveSettings().then(() => {
        log_to_file_switch.disabled = false;
        settings_saved_msg.close();
        settings_saved_msg.open();
    });
});

log_to_console_switch.listen('change', () => {
    log_to_console_switch.disabled = true;
    autobetLib.logging.setLogToConsole(log_to_console_switch.checked);

    if (!log_to_console_switch.checked) {
        log_textfield.value = "";
        log_textfield_resizer.style.height = "56px";

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
    autobetLib.settings.saveSettings().then(() => {
        log_to_console_switch.disabled = false;
        settings_saved_msg.close();
        settings_saved_msg.open();
    });
});

autobetLib.logging.setLogCallback((msg) => {
    if ((log_textfield.input_.scrollTop + log_textfield.input_.clientHeight) >= (log_textfield.input_.scrollHeight - 20)) {
        log_textfield.value += msg;
        log_textfield.input_.scroll({
            top: log_textfield.input_.scrollHeight,
            left: 0
        });
    } else {
        log_textfield.value += msg;
    }
});

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