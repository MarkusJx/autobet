var startstop = document.getElementById('startstop');
var progressbar = document.getElementById('progressbar');

mdc.ripple.MDCRipple.attachTo(startstop);
mdc.linearProgress.MDCLinearProgress.attachTo(progressbar);

var moneyMadeList = [];
var moneyMade = 0;

eel.expose(addMoney);
function addMoney(time, value) {
    moneyMadeList.push([time, value]);
    updateMoneyMade();
}

// Exit the current window if the underlying python process is closing
eel.expose(js_exit);
function js_exit() {
    window.close();
}

function updateMoneyMade() {
    var newList = []
    var tm = new Date().getTime();
    moneyMadeList.forEach(function(value) {
        if ((value[0] + 3600000) > tm) {
            newList.push(value);
        }
    });

    moneyMadeList = newList;
    moneyMade = 0;

    moneyMadeList.forEach(function(value) {
        moneyMade += value[1];
    });
}
