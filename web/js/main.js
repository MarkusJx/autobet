var startstop = document.getElementById('startstop');
mdc.ripple.MDCRipple.attachTo(startstop);

var x = setInterval(function () {
    try {
        wuy.connected().then(function (res) {
            if (res) {
                clearInterval(x);
                console.log("Connected!")
                main();
            }
        })
    } catch (error) {
        console.log("Still connecting...")
    }
}, 100);

function main() {
    wuy.js_initialized().then(function (res) {
        wuy.on("isInitialized", initialized);
    })

    wuy.js_get_money().then(function (val) {
        console.log(val);
    })
}

function initialized() {
    console.log("Finished initializing!");
}