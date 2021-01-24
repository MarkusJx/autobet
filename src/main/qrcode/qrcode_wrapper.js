const fs = require('fs');
const path = require('path');

// file is included here:
const qrcode_path = path.join(__dirname, 'qrcode.min.js');
eval(String(fs.readFileSync(qrcode_path)));

module.exports = {
    setQRCode: function (ip) {
        // Empty the element
        document.getElementById("qrcode").innerHTML = "";
        new QRCode(document.getElementById("qrcode"), {
            text: "http://" + ip + ":8027",
            width: 352,
            height: 352,
            colorDark: "#000000",
            colorLight: "#ffffff"
        });
    }
}