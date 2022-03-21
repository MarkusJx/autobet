const checker = require("license-checker");
const fs = require("fs");
const path = require("path");

checker.init({
    start: __dirname
}, (err, packages) => {
    if (err) {
        throw err;
    } else {
        const licenses = [];
        Object.keys(packages).forEach(p => {
            const licenseFile = packages[p].licenseFile;
            if (licenseFile) {
                licenses.push({
                    name: p,
                    id: 0,
                    files: [{
                        softwareName: p,
                        name: path.basename(licenseFile),
                        path: licenseFile
                    }]
                });
            }

            fs.writeFileSync(path.join(__dirname, "licenses.json"), JSON.stringify(licenses));
        });
    }
});