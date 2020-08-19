const autobetLib = require("./index.js");

autobetLib.init(["--debug"]);

setTimeout(() => {
    autobetLib.shutdown();
}, 100);