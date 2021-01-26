import path from "path";
import fs from "fs";

/**
 * The current autobet version
 */
const version: string = require(path.join(__dirname, '..', '..', 'package.json')).version;

export { version };

/**
 * Get the License string
 *
 * @return the license as a string
 */
export function getLicense(): Promise<string> {
    return new Promise((resolve, reject) => {
        const license_path: string = path.join(__dirname, '..', '..', 'LICENSE');
        fs.readFile(license_path, 'utf8', (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
}