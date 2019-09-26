var startstop = document.getElementById('startstop');
var progressbar = document.getElementById('progressbar');

mdc.ripple.MDCRipple.attachTo(startstop);
mdc.linearProgress.MDCLinearProgress.attachTo(progressbar);

var showqrbutton = document.getElementById('showqrbutton');
var qrcontainer = document.getElementById('qrcontainer');
var qrdonebutton = document.getElementById('qrdonebutton');

mdc.ripple.MDCRipple.attachTo(showqrbutton);

var moneythishour = document.getElementById('moneythishour');
var raceswon = document.getElementById('raceswon');
var winprobability = document.getElementById('winprobability');
var moneyall = document.getElementById('moneyall');
var errordialog = document.getElementById("error-dialog-container");

var weblink = document.getElementById("weblink");
mdc.ripple.MDCRipple.attachTo(weblink);

mdc.autoInit();

var qrdialog = document.getElementById("qrdialog");
qrdialog = new mdc.dialog.MDCDialog(qrdialog);

var stoptext = document.getElementById("stoptext");

errordialog = new mdc.dialog.MDCDialog(errordialog);

var moneyMade = 0;
var won = 0;
var lost = 0;

function showQRCode() {
    qrdialog.open();
    startstop.disabled = true;
    showqrbutton.disabled = true;
}

qrdialog.listen('MDCDialog:closing', function () {
    startstop.disabled = false;
    showqrbutton.disabled = false;
});

showqrbutton.addEventListener('click', function () {
    showQRCode();
});

eel.expose(exception);
function exception() {
    errordialog.open();
    errordialog.listen("MDCDialog:closed", function () {
        window.close();
    })
}

function makeSumsDisplayable(sum, k = false) {
    var negative = sum < 0;
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

eel.expose(init_started);
function init_started() {
    progressbar.className = "mdc-linear-progress mdc-linear-progress--indeterminate";
    messagecontainer.className = "";
    frosted_glass.className = "frosted-glass-blur";
    stoptext.innerHTML = "Please wait while the program initializes...";
    startstop.disabled = true;
}

eel.expose(init_finished);
function init_finished() {
    progressbar.className = "mdc-linear-progress";
    frosted_glass.className = "frosted-glass-unblur";
    messagecontainer.className = "invisible";
    stoptext.innerHTML = "Please wait while the program stops...";
    startstop.disabled = false;
}

eel.expose(addMoney);
function addMoney(value) {
    if (value != 0) {
        moneyMade += value;
        if (value > 0) won++;
    } else {
        lost++;
    }
    updateValues();
}

eel.expose(setAllMoneyMade);
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

eel.expose(set_gta_running);

function set_gta_running(val) {
    console.log("set gta v running to " + val);
}

// Exit the current window if the underlying python process is closing
eel.expose(js_exit);

function js_exit() {
    window.close();
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

async function setIPs() {
    let ip = await eel.get_ip()();
    setQRCode(ip);
    weblink.innerHTML = "http://" + ip + ":8027";
}

weblink.addEventListener('click', () => {
    eel.open_website();
});

setIPs();
eel.get_winnings();
