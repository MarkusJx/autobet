/**
 * Is set to true, when running using node.js
 */
const IS_NODE_JS = typeof require === 'function';

/**
 * Will be the https module when running using node.js
 */
let https = null;
/**
 * Will be the fs module when running using node.js
 */
let fs = null;
if (IS_NODE_JS) {
    https = require('https');
    fs = require('fs');
}

/**
 * An object for handling web GET requests
 */
const webRequest = {
    /**
     * Send an GH api request using the https module from node.js
     * 
     * @param {String} request the request
     * @param {String} request_base the request base (address)
     * @param {Number} api_port the port for the operation, should be 443
     * @param {String} user_agent the user agent
     * @param {String} oauth_token the oauth token
     * @returns {Promise<String>} the result of the request
     */
    "apiRequestNodeJs": function (request, request_base, api_port, user_agent, oauth_token) {
        // Set the request options
        const options = {
            hostname: request_base,
            port: api_port,
            path: request,
            method: 'GET',
            headers: {
                'User-Agent': user_agent,
                'Authorization': `token ${oauth_token}`,
                'Accept': "application/vnd.github.v3+json"
            }
        };

        return new Promise((resolve, reject) => {
            // Create a https request
            const req = https.request(options, res => {
                // Create an empty data buffer
                let data = '';

                // Listen on data received
                res.on('data', d => {
                    // Append the new data
                    data += d;
                });

                // Listen on connection end
                res.on('end', () => {
                    switch (res.statusCode) {
                        case 200:
                            return resolve(data);
                        case 302:
                            return resolve(JSON.stringify(res.headers));
                        default:
                            // The status code is not 200, reject the promise
                            let err = `The status code was not 200, it was: ${res.statusCode}, `;
                            // If no data was sent, write that to the error message
                            if (data.length == 0) {
                                err += "no error message was returned.";
                            } else {
                                err += `error message returned: ${data}`;
                            }

                            return reject(err);
                    };
                });
            });

            // Listen for errors
            req.on('error', error => {
                // Reject on error
                reject(error);
            });

            // End the request
            req.end()
        });
    },
    /**
     * Send an GH api request using the XMLHttpRequest class
     * 
     * @param {String} request the request
     * @param {String} request_base the request base (address)
     * @param {String} user_agent the user agent
     * @param {String} oauth_token the oauth token
     * @returns {Promise<String>} the result of the request
     */
    "apiRequestWeb": function (request, request_base, user_agent, oauth_token) {
        /**
         * @type {XMLHttpRequest}
         */
        let xhr;
        if (window.XMLHttpRequest) {
            // code for modern browsers
            xhr = new XMLHttpRequest();
        } else {
            // code for old IE browsers
            xhr = new ActiveXObject("Microsoft.XMLHTTP");
        }

        return new Promise((resolve, reject) => {
            // Listen for state changes
            xhr.onreadystatechange = () => {
                if (xhr.readyState == 4) {
                    // TODO: this
                    switch (xhr.status) {
                        case 200:
                            // The status is 200, resolve this promise
                            return resolve(xhr.responseText);
                        case 302:
                            let headers = xhr.getAllResponseHeaders();
                            if (headers != null) {
                                return resolve(headers);
                            } else {
                                return reject("No headers were received");
                            }
                        default:
                            // The status code is not 200, reject the promise
                            let err = `The status code was not 200, it was: ${xhr.status}, `;
                            // If no data was sent, write that to the error message
                            if (xhr.responseText.length == 0) {
                                err += "no error message was returned.";
                            } else {
                                err += `error message returned: ${xhr.responseText}`;
                            }

                            return reject(err);
                    };
                }
            };

            // Listen for errors
            xhr.onerror = () => {
                reject("The XMLHttpRequest returned an error");
            };

            // Open the request
            xhr.open("GET", `https://${request_base}${request}`, false);

            // Set request headers
            xhr.setRequestHeader('User-Agent', user_agent);
            if (oauth_token != undefined) xhr.setRequestHeader('Authorization', `token ${oauth_token}`);
            xhr.setRequestHeader('Accept', 'application/vnd.github.v3+json');

            // Send the request
            xhr.send();
        });
    },
    /**
     * Send an api request
     * 
     * @param {String} request the request
     * @param {String} request_base the request base
     * @param {String} user_agent the user agent
     * @param {String} oauth_token the oauth token
     * @returns {Promise<String>} the result of the request
     */
    "apiRequest": function (request, request_base, user_agent, oauth_token) {
        if (https != null) {
            return this.apiRequestNodeJs(request, request_base, 443, user_agent, oauth_token);
        } else {
            return this.apiRequestWeb(request, request_base, user_agent, oauth_token);
        }
    }
};

/**
 * A callback function for showing progress
 * 
 * @callback progressCallback
 * @param {Number} progress the progress in percent
 * @returns {void}
 */

/**
 * An object containing methods for downloading files
 */
const fileDownload = {
    /**
     * Download a file using node.js apis
     * 
     * @param {String} url the url to download
     * @param {String} destination the destination to download to
     * @param {Number | undefined} size the size of the download. May be undefined
     * @param {progressCallback | undefined} progress_callback a callback for the progress
     * @returns {Promise<void | String>} nothing, or in case of an error an error message
     */
    "downloadFileLocally": async function (url, destination, size = undefined, progress_callback = undefined) {
        if (https != null && fs != null) {
            return new Promise((resolve, reject) => {
                const file = fs.createWriteStream(destination);
                const request = https.get(url, res => {
                    res.pipe(file);

                    if (progress_callback) {
                        let len;
                        if (size == undefined) {
                            len = parseInt(res.headers['content-length'], 10) / 1048576;
                        } else {
                            len = size;
                        }

                        let cur = 0;
                        res.on('data', data => {
                            cur += data.length;
                            let progress = (100.0 * cur / len).toFixed(2);
                            if (progress > 100) progress = 100.0;

                            progress_callback(progress);
                        });
                    }

                    // Listen on connection end
                    res.on('end', () => {
                        switch (res.statusCode) {
                            case 200:
                                return file.close(resolve);
                            default:
                                // The status code is not 200, reject the promise
                                let err = `The status code was not 200, it was: ${res.statusCode}, `;
                                // If no data was sent, write that to the error message
                                if (data.length == 0) {
                                    err += "no error message was returned.";
                                } else {
                                    err += `error message returned: ${data}`;
                                }

                                return reject(err);
                        };
                    });
                });

                // Listen for errors
                request.on('error', error => {
                    // Reject on error
                    reject(error);
                });

                // Listen for file errors
                file.on('error', (err) => {
                    // Delete the destination file async
                    fs.unlink(destination);
                    return reject(err.message);
                });

                request.end();
            });
        } else {
            throw new Error("downloadFileLocally() was called in an non-node-js environment");
        }
    },
    /**
     * Download a file in a web browser
     * 
     * @param {String} url the url to download
     */
    "downloadFileWeb": function (url) {
        if (IS_NODE_JS) {
            throw new Error("downloadFileWeb() is only available in web browsers");
        } else {
            window.location = url;
        }
    }
};

/**
 * A class for making Github api calls
 */
class GithubApi {
    /**
     * Create a new GithubApi instance
     * 
     * @param {String} owner the repository owner
     * @param {String} repo the repository to work with
     * @param {String} oauth_token the oauth token to use
     */
    constructor(owner, repo, oauth_token) {
        this.owner = owner;
        this.repo = repo;
        this.oath_token = oauth_token;
        this.REQUEST_BASE = "api.github.com";
        this.USER_AGENT = "artifacts-api-app";
    }

    async getWorkflows() {
        return JSON.parse(await webRequest.apiRequest(`/repos/${this.owner}/${this.repo}/actions/runs`, this.REQUEST_BASE, this.USER_AGENT, this.oath_token));
    }

    async getArtifactsForWorkflow(id) {
        return JSON.parse(await webRequest.apiRequest(`/repos/${this.owner}/${this.repo}/actions/runs/${id}/artifacts`, this.REQUEST_BASE, this.USER_AGENT, this.oath_token));
    }

    /**
     * Get a workflow from an id
     * 
     * @param {Number | String} id thw workflow id
     */
    async getWorkflow(id) {
        return JSON.parse(await webRequest.apiRequest(`/repos/${this.owner}/${this.repo}/actions/workflows/${id}`, this.REQUEST_BASE, this.USER_AGENT, this.oath_token));
    }

    /**
     * Get the lastest release
     * 
     * @returns {Promise<Object>} the release info object
     */
    async getLatestRelease() {
        return JSON.parse(await webRequest.apiRequest(`/repos/${this.owner}/${this.repo}/releases/latest`, this.REQUEST_BASE, this.USER_AGENT, this.oath_token));
    }

    /**
     * Get the latest release tag
     * 
     * @returns {Promise<String | undefined>} the tag name or undefined, if the response could not be parsed
     */
    async getLatestReleaseTag() {
        let res = await this.getLatestRelease();
        if (res.hasOwnProperty("tag_name")) {
            return res["tag_name"];
        } else {
            return undefined;
        }
    }

    /**
     * Get the artifacts for this repo
     * 
     * @returns {Promise<Object>} the artifact object
     */
    async getArtifacts() {
        return JSON.parse(await webRequest.apiRequest(`/repos/${this.owner}/${this.repo}/actions/artifacts`, this.REQUEST_BASE, this.USER_AGENT, this.oath_token));
    }

    /**
     * Get the latest artifact with a given name
     * 
     * @param {RegExp | String} artifactName the artifact name. May be a string or regex to match against
     * @returns {Promise<Object | undefined>} the artifact object or undefined if the artifact could not be found
     */
    async getLatestArtifact(artifactName) {
        let artifacts = await this.getArtifacts();
        if (artifacts.hasOwnProperty("artifacts")) {
            artifacts = artifacts["artifacts"];
            for (let i = 0; i < artifacts.length; i++) {
                if (artifacts.hasOwnProperty(i) && artifacts[i].hasOwnProperty("name")) {
                    let name = artifacts[i]["name"];
                    if (name.match(artifactName)) {
                        return artifacts[i];
                    }
                }
            }
        }

        return undefined;
    }

    /**
     * Get the download address for an artifact
     * 
     * @param {String} artifactId the artifact id
     * @param {String} format the format, defaults to 'zip'
     * @returns {Promise<String | undefined>} the artifact download address or undefined if there was an error parsing the data
     */
    async getArtifactDownloadAddress(artifactId, format = "zip") {
        let res = JSON.parse(await webRequest.apiRequest(`/repos/${this.owner}/${this.repo}/actions/artifacts/${artifactId}/${format}`, this.REQUEST_BASE, this.USER_AGENT, this.oath_token));
        if (res.hasOwnProperty("location") && typeof res.location == 'string') {
            return res.location;
        } else {
            return undefined;
        }
    }

    /**
     * Download a Github artifact
     * 
     * @param {String} artifactId the artifact id 
     * @param {String} format the format, defaults to 'zip'
     * @param {String} destination the destination, must be set when running locally using node.js
     * @param {Number | undefined} size the size of the download, me be undefined
     * @param {progressCallback | undefined} progress_callback a progress callback function. May only be used then running locally using node.js
     * @returns {Promise<void>}
     */
    async downloadArtifact(artifactId, format = "zip", destination = "", size = undefined, progress_callback = undefined) {
        if (IS_NODE_JS && destination.length == 0) {
            throw new Error("When running with node.js, a destination must be set");
        }

        const address = await this.getArtifactDownloadAddress(artifactId, format);
        if (address == undefined) {
            throw new Error("Could not get the download address");
        }

        if (IS_NODE_JS) {
            fileDownload.downloadFileLocally(address, destination, size, progress_callback);
        } else {
            fileDownload.downloadFileWeb(address);
        }
    }
};

/**
 * Get the name of the next artifact based on the name of the last artifact
 *
 * @param {GithubApi} api the api instance
 * @param {String} name the
 */
/*async function getNextArtifactName(api, name) {
    const printUsingNewMinor = () => {
        console.log(`${name}1`);
    };

    const latestArtifact = await api.getLatestArtifact(name);
    if (latestArtifact != undefined) {
        let minor = parseInt(latestArtifact.name.replace(name, ""), 10);
        if (isNaN(minor) || minor <= 0) {
            printUsingNewMinor();
        } else {
            minor += 1;
            console.log(`${name}${minor}`);
        }
    } else {
        printUsingNewMinor();
    }
}*/

/**
 * Parse command-line arguments
 *
 * @param {String[]} args the program arguments
 * @returns {Promise<Number>} an exit code
 */
/*async function parseArgs(args) {
    try {
        const api = new GithubApi("MarkusJx", "autobet", "ANY_OAUTH_TOKEN");
        switch (args[2]) {
            case "--getNextArtifactName":
                let releaseTag = await api.getLatestReleaseTag();
                await getNextArtifactName(api, `autobet-unstable-${releaseTag}-`);
                break;
            default:
                console.error("Unknown argument");
                return -1;
        };

        return 0;
    } catch (e) {
        console.error(`Error thrown: ${e}`);
        return 1;
    }
}

if (IS_NODE_JS) {
    parseArgs(process.argv).then(exitCode => {
        if (exitCode != 0) {
            throw new Error(`The script exited with code: ${exitCode}, which is not 0`);
        }
    }, () => {
        throw new Error("The promise was rejected");
    });
}*/