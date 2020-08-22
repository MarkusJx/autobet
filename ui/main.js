var startstop = document.getElementById('startstop');
var progressbar = document.getElementById('progressbar');

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

const weblink = document.getElementById("weblink");
mdc.ripple.MDCRipple.attachTo(weblink);

mdc.autoInit();

let qrdialog = document.getElementById("qrdialog");
qrdialog = new mdc.dialog.MDCDialog(qrdialog);

var stoptext = document.getElementById("stoptext");

errordialog = new mdc.dialog.MDCDialog(errordialog);

async function setQuitCallback() {
    autobetLib.setQuitCallback(() => {
        electron.quit();
    });
}
setQuitCallback();

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

autobetLib.setExceptionCallback(exception);

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

/*cppJsLib.expose(init_started);

function init_started() {
    progressbar.className = "mdc-linear-progress mdc-linear-progress--indeterminate";
    messagecontainer.className = "";
    frosted_glass.className = "frosted-glass-blur";
    stoptext.innerHTML = "Please wait while the program initializes...";
    startstop.disabled = true;
}

cppJsLib.expose(init_finished);

function init_finished() {
    progressbar.className = "mdc-linear-progress";
    frosted_glass.className = "frosted-glass-unblur";
    messagecontainer.className = "invisible";
    stoptext.innerHTML = "Please wait while the program stops...";
    startstop.disabled = false;
}*/

autobetLib.setAddMoneyCallback(addMoney);

function addMoney(value) {
    if (value != 0) {
        moneyMade += value;
        if (value > 0) won++;
    } else {
        lost++;
    }
    updateValues();
}

autobetLib.setAllMoneyMadeCallback(setAllMoneyMade);

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

autobetLib.setGtaRunningCallback(set_gta_running);

function set_gta_running(val) {
    console.log("set gta v running to " + val);
    gta_running = val;
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

async function main() {
    setIPs();
    autobetLib.loadWinnings();

    let initialized = await autobetLib.init();
    if (initialized) {
        console.log("Initialized.");
    } else {
        console.error("Could not initialize");
    }
}

main();
