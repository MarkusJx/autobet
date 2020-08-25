let startstop = document.getElementById('startstop');
let progressbar = document.getElementById('progressbar');

mdc.ripple.MDCRipple.attachTo(startstop);
mdc.linearProgress.MDCLinearProgress.attachTo(progressbar);

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

        autobetLib.settings.saveSettings().then(() => {
            enable_webserver.disabled = false;
            settings_saved_msg.close();
            settings_saved_msg.open();
        });
    });
});

window.onbeforeunload = function() {
    autobetLib.shutdown().then(() => {
        //electron.quit();
    });
}

async function main() {
    startstop.disabled = true;
    // Create the title bar
    titlebar.create();

    setIPs();
    enable_webserver.disabled = true;
    await autobetLib.loadWinnings();

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

    // Set swtches checkes
    custom_betting_pos.value = autobetLib.settings.getCustomBettingPos();
    time_sleep_field.value = autobetLib.settings.getTimeSleep();
    clicks_field.value = autobetLib.settings.getClicks();
    use_controller.checked = autobetLib.controller.getUseController();
    setScpVBusInstalled(autobetLib.controller.scpVBusInstalled());
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
        } else {
            console.error("Could not start web server");
        }
    }
    enable_webserver.disabled = false;

    autobetLib.start();
}

main().then(() => {
    console.log("Main finished.");
});

// Settings ================================================

// MDC init
const description_dialog = new mdc.dialog.MDCDialog(document.getElementById("description-dialog"));
const custom_betting_pos = new mdc.textField.MDCTextField(document.getElementById("custom-betting-pos-position"));
const time_sleep_field = new mdc.textField.MDCTextField(document.getElementById("time-sleep-field"));
const clicks_field = new mdc.textField.MDCTextField(document.getElementById("clicks-field"));
const use_controller = new mdc.switchControl.MDCSwitch(document.getElementById("use-controller-switch"));
const controller_error_msg = new mdc.snackbar.MDCSnackbar(document.getElementById("controller-error-message"));
const full_debug = new mdc.switchControl.MDCSwitch(document.getElementById("full-debug-switch"));
const scpvbus_installing_msg = new mdc.snackbar.MDCSnackbar(document.getElementById("scpvbus-installing-message"));
const log_to_file_switch = new mdc.switchControl.MDCSwitch(document.getElementById("log-to-file-switch"));
const log_to_console_switch = new mdc.switchControl.MDCSwitch(document.getElementById("log-to-console-switch"));
const log_textfield = new mdc.textField.MDCTextField(document.getElementById("log-textfield"));
const betting_pos_template_dialog = new mdc.dialog.MDCDialog(document.getElementById("betting-pos-template-dialog"));

const set_betting_pos_template = document.getElementById("set-betting-pos-template");
const scpvbus_installed = document.getElementById("scpvbus-installed");
const install_scpvbus = document.getElementById("install-scpvbus");
const log_textfield_resizer = document.getElementById("log-textfield-resizer");

mdc.ripple.MDCRipple.attachTo(set_betting_pos_template);
mdc.ripple.MDCRipple.attachTo(install_scpvbus);

/**
 * Set scpVBus installed
 * 
 * @param {Boolean} val if scpVBus is installed
 */
function setScpVBusInstalled(val) {
    if (val) {
        scpvbus_installed.innerHTML = "Yes";
        scpvbus_installed.className = "text status_running maintext";
        install_scpvbus.innerText = "UNINSTALL";
    } else {
        scpvbus_installed.innerHTML = "No";
        scpvbus_installed.className = "text status_stopped maintext";
        install_scpvbus.innerText = "INSTALL";
    }
}

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

custom_betting_pos.input_.addEventListener('keyup', (event) => {
    if (event.keyCode === 13) {
        event.preventDefault();
        if (custom_betting_pos.value.length !== 0) {
            autobetLib.settings.setCustomBettingPos(Number(custom_betting_pos.value));
            custom_betting_pos.disabled = true;
            autobetLib.settings.saveSettings().then(() => {
                custom_betting_pos.disabled = false;
                settings_saved_msg.close();
                settings_saved_msg.open();
            });
        }
    }
});

const betting_pos_template = {
    template: class {
        constructor(container, width, value) {
            this.container = container;
            this.width = width;
            this.value = value;
        }
    },
    templates: [],
    content: document.getElementById("betting-pos-template-dialog-content"),
    addElement: function() {
        let container = document.createElement("div");
        container.className = "betting-pos-template-el-container";
        let width = document.createElement("label");
        width.className = "mdc-text-field mdc-text-field--filled betting-pos-template-text-field";
        width.innerHTML = '<span class="mdc-text-field__ripple"></span>' +
            '<input class="mdc-text-field__input" type="number" min="0">' +
            '<span class="mdc-floating-label">Width</span>' +
            '<span class="mdc-line-ripple"></span>';

        let value = document.createElement("label");
        value.className = "mdc-text-field mdc-text-field--filled betting-pos-template-text-field";
        value.innerHTML = '<span class="mdc-text-field__ripple"></span>' +
            '<input class="mdc-text-field__input" type="number" min="0">' +
            '<span class="mdc-floating-label">Value</span>' +
            '<span class="mdc-line-ripple"></span>';

        container.appendChild(width);
        container.appendChild(value);

        let remove = document.createElement("button");
        remove.innerHTML = '<span class="mdc-button__ripple"></span><span class="material-icons">delete</span>';
        remove.className = "mdc-button remove-button";

        mdc.ripple.MDCRipple.attachTo(remove);
        remove.addEventListener('click', () => {
            this.remove(container);
            if (this.templates.length < 1) {
                this.addElement();
            }
        });

        container.appendChild(remove);

        let tmp = new this.template(container, new mdc.textField.MDCTextField(width), new mdc.textField.MDCTextField(value));
        this.templates.push(tmp);
        this.content.appendChild(container);

        return tmp;
    },
    remove: function(container) {
        this.content.removeChild(container);
        for (let i = 0; i < this.templates.length; i++) {
            if (this.templates[i].container === container) {
                this.templates.splice(i, 1);
                break;
            }
        }
    },
    removeAll: function() {
        this.content.innerHTML = "";
        this.templates.length = 0;
    }
};

set_betting_pos_template.addEventListener('click', () => {
    let values = autobetLib.settings.getBettingPosTemplate();
    for (let i = 0; i < values.length; i++) {
        let el = values[i];
        let tmp = betting_pos_template.addElement();
        tmp.value.value = el.value;
        tmp.width.value = el.resolution;
    }

    if (betting_pos_template.templates.length < 1) {
        betting_pos_template.addElement();
    }
    betting_pos_template_dialog.open();
});

document.getElementById("betting-pos-add-button").addEventListener('click', () => betting_pos_template.addElement());

betting_pos_template_dialog.listen('MDCDialog:closed', (ev) => {
    if (ev.detail.action === "accept") {
        /**
         * @type {Array.<{resolution: Number, value: Number}>}
         */
        let values = [];
        if (!(betting_pos_template.templates.length === 1 && betting_pos_template.templates[0].value.value.length === 0 && betting_pos_template.templates[0].width.value.length === 0)) {
            set_betting_pos_template.disabled = true;
            for (let i = 0; i < betting_pos_template.templates.length; i++) {
                let el = betting_pos_template.templates[i];
                if (el.value.value.length !== 0 && el.width.value.length !== 0) {
                    values.push({
                        resolution: Number(el.width.value),
                        value: Number(el.value.value)
                    });
                }
            }
        }

        autobetLib.settings.setBettingPosTemplate(values);
        autobetLib.settings.saveSettings().then(() => {
            set_betting_pos_template.disabled = false;
            settings_saved_msg.close();
            settings_saved_msg.open();
        });
    }
    betting_pos_template.removeAll();
});

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

clicks_field.input_.addEventListener('keyup', () => {
    if (event.keyCode === 13) {
        event.preventDefault();
        if (clicks_field.value.length !== 0) {
            autobetLib.settings.setClicks(Number(clicks_field.value));
            clicks_field.disabled = true;
            autobetLib.settings.saveSettings().then(() => {
                clicks_field.disabled = false;
                settings_saved_msg.close();
                settings_saved_msg.open();
            });
        }
    }
});

use_controller.listen('change', () => {
    use_controller.disabled = true;
    autobetLib.controller.setUseController(use_controller.checked).then((res) => {
        if (!res) controller_error_msg.open();

        autobetLib.settings.saveSettings().then(() => {
            use_controller.disabled = false;
            settings_saved_msg.close();
            settings_saved_msg.open();
        });
    });
});

function showScpVBusMessage(msg) {
    scpvbus_installing_msg.close();
    scpvbus_installing_msg.labelText = msg;
    scpvbus_installing_msg.open();
}

install_scpvbus.addEventListener('click', () => {
    install_scpvbus.disabled = true;
    if (autobetLib.controller.scpVBusInstalled()) {
        showScpVBusMessage("Uninstalling ScpVBus...");
        autobetLib.controller.uninstallScpVBus().then((res) => {
            if (res) {
                showScpVBusMessage("ScpVBus removed.");
            } else {
                showScpVBusMessage("ScpVBus removal failed.");
                setTimeout(() => {
                    setScpVBusInstalled(autobetLib.controller.scpVBusInstalled());
                }, 10000);
            }

            setScpVBusInstalled(!res);
            install_scpvbus.disabled = false;
        });
    } else {
        showScpVBusMessage("Installing ScpVBus...");
        autobetLib.controller.installScpVBus().then((res) => {
            if (res) {
                showScpVBusMessage("ScpVBus installed.");
            } else {
                showScpVBusMessage("ScpVBus installation failed.");
                setTimeout(() => {
                    setScpVBusInstalled(autobetLib.controller.scpVBusInstalled());
                }, 10000);
            }

            setScpVBusInstalled(res);
            install_scpvbus.disabled = false;
        });
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

document.getElementById("custom-betting-pos-info").addEventListener('click', () => {
    showDescription("Custom-betting-pos", "Set a custom position for the 'increase bet' button. Use this setting only, when the program is only placing $100," +
        " when a bet should be placed. Press enter to save, use the value '-1' to use the default values.");
});

document.getElementById("betting-pos-template-info").addEventListener('click', () => {
    showDescription("Betting-pos-template", "Set templates for different game resolutions and positions for the 'increase bet' button. Click on 'set' to begin.");
});

document.getElementById("time-sleep-info").addEventListener('click', () => {
    showDescription("Time-sleep", "Set the time to sleep after a bet has started. Use this option, when the program did not immediately start a new bet when the " +
        "race has finished. Press enter to save, the default value is 36.");
});

document.getElementById("clicks-info").addEventListener('click', () => {
    showDescription("Clicks", "Set the clicks the program needs to place a max bet. Use this option, when the program does not place $10.000, when a bet should be " +
        "placed. Press enter to save, the default value is 31.");
});

document.getElementById("controller-info").addEventListener('click', () => {
    showDescription("Controller simulation", "Check this if you want to use a virtual controller to click the 'increase bet' button. In order to use this, " +
        "scpVBus must be installed. Additionally, you must not have any other controllers plugged into your computer, as the game can only register one controller.");
});

document.getElementById("scpvbus-info").addEventListener('click', () => {
    showDescription("ScpVBus installed", "This field shows if ScpVBus is installed. ScpVBus must be installed, when a virtual controller should be used to click " +
        "the 'increase bet' button. Use the 'Install ScpVBus' button to download and install ScpVBus.");
});

document.getElementById("install-scpvbus-info").addEventListener('click', () => {
    showDescription("Install ScpVBus", "Click on 'install' to install ScpVBus. ScpVBus is required to use virtual controllers. NOTE: You will need administrator " +
        "privileges to install ScpVBus.");
});

document.getElementById("full-debug-info").addEventListener('click', () => {
    showDescription("Full Debug", "This option will create a zip file called 'autobet_debug.zip' on you Desktop. This File will contain a log and screenshots for " +
        "debugging purposes. IMPORTANT: If you submit this file anywhere, make sure to delete any personal information from the zip file.");
});

document.getElementById("debug-info").addEventListener('click', () => {
    showDescription("Debugging and logging", "Log to File: Set if the program should log to a file. This option will automatically activated, when the full debug " +
        "option is activated. Log to Console: This option will display logging information in the 'View log' text field.");
});