var startstop = document.getElementById('startstop');
var progressbar = document.getElementById('progressbar');

mdc.ripple.MDCRipple.attachTo(startstop);
mdc.linearProgress.MDCLinearProgress.attachTo(progressbar);

var moneythishour = document.getElementById('moneythishour');
var raceswon = document.getElementById('raceswon');
var winprobability = document.getElementById('winprobability');
var moneyall = document.getElementById('moneyall');
var errordialog = document.getElementById("error-dialog-container");

var stoptext = document.getElementById("stoptext");

errordialog = new mdc.dialog.MDCDialog(errordialog);

var moneyMade = 0;
var won = 0;
var lost = 0;

eel.expose(exception)
function exception() {
    errordialog.open();
    errordialog.listen("MDCDialog:closed", function() {
        window.close();
    })
}

function makeSumsDisplayable(sum, k = false) {
    if (sum > 1000000000) {
        return Math.round(sum / 10000000) / 100 + "B";
    } else if(sum > 1000000) {
        return Math.round(sum / 10000) / 100 + "M";
    } else if(k && sum > 1000) {
        return Math.round(sum / 10) / 100 + "K";
    } else {
        return sum;
    }
}

eel.expose(init_started);
function init_started() {
    progressbar.className = "mdc-linear-progress mdc-linear-progress--indeterminate";
    messagecontainer.className = "";
    frosted_glass.className = "frosted-glass-blur";
    stoptext.innerHTML = "Please wait while the program initializes..."
    startstop.disabled = true;
}

eel.expose(init_finished);
function init_finished() {
    progressbar.className = "mdc-linear-progress";
    frosted_glass.className = "frosted-glass-unblur";
    messagecontainer.className = "invisible";
    stoptext.innerHTML = "Please wait while the program stops..."
    startstop.disabled = false;
}

eel.expose(addMoney);
function addMoney(value) {
    if(value != 0){
        moneyMade += value
        if(value > 0) won++;
        updateMoneyMade();
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
    return moneyMade * (3600000 / difference);
}

// Exit the current window if the underlying python process is closing
eel.expose(js_exit);
function js_exit() {
    window.close();
}

eel.get_winnings();
