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
    wuy.js_initialized().then(function(res) {
        wuy.on("isInitialized", initialized);
    })

    setTimeout(initialized, 10000);
}

function initialized() {
    console.log("Finished initializing!");
    document.location.href = "main.html"
}