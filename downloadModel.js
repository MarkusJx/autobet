const fs = require('fs');
const path = require('path');
const request = require('request');

// Source: https://stackoverflow.com/a/32134846
const download = (url, dest) => {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        const sendReq = request.get(url);

        // verify response code
        sendReq.on('response', (response) => {
            if (response.statusCode !== 200) {
                return reject('Response status was ' + response.statusCode);
            }

            sendReq.pipe(file);
        });

        // close() is async, call cb after close completes
        file.on('finish', () => file.close(resolve));

        // check for request errors
        sendReq.on('error', (err) => {
            fs.unlink(dest);
            return reject(err.message);
        });

        file.on('error', (err) => { // Handle errors
            fs.unlink(dest); // Delete the file async. (But we don't check the result)
            return reject(err.message);
        });
    });
};

async function downloadModel() {
    const modelPath = path.join(__dirname, 'resources', 'data', 'model.pb');
    if (fs.existsSync(modelPath)) {
        console.log("The model file already exists, deleting it");
        fs.unlinkSync(modelPath);
        console.log(modelPath + " successfully deleted");
    }

    console.log("Downloading model.pb");
    await download("https://www.dropbox.com/s/v0vmc92ywqsbw3k/optimized_model.pb?dl=1", modelPath);
    console.log("Successfully downloaded the model");
}

downloadModel();