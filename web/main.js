var startstop = document.getElementById('startstop');
var progressbar = document.getElementById('progressbar');

mdc.ripple.MDCRipple.attachTo(startstop);
mdc.linearProgress.MDCLinearProgress.attachTo(progressbar);

var moneythishour = document.getElementById('moneythishour');
var raceswon = document.getElementById('raceswon');
var winprobability = document.getElementById('winprobability');

var moneyMadeList = [];
var moneyMade = 0;
var won = 0;
var lost = 0;

eel.expose(addMoney);
function addMoney(value) {
    if(value != 0){
        moneyMadeList.push([new Date().getTime(), value]);
        if(value > 0) won++;
        updateMoneyMade();
    } else {
        lost++;
    }
    updateValues();
}

function updateValues() {
    moneythishour.innerHTML = moneyMade + " $";
    raceswon.innerHTML = won;
    winprobability.innerHTML = Math.round((won / (won + lost)) * 1000) / 10 + "%";
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
