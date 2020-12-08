const autobetLib = require("./index.js");

autobetLib.init().then(() => {});

setTimeout(() => {
    autobetLib.shutdown();
}, 100);