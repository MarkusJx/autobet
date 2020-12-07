'use strict';

const { contextBridge, ipcRenderer } = require('electron');
const autobetLib = require('../autobetLib');
const { Titlebar, Color } = require('custom-electron-titlebar');
const Store = require('electron-store');
const isolate = require('./isolatedFunction/isolatedFunction');
const { functionStore } = require('./functionStore/functionStore');

// Expose autobetLib
contextBridge.exposeInMainWorld('autobetLib', autobetLib);

// Expose hide and close actions
contextBridge.exposeInMainWorld('electron', {
    quit: () => ipcRenderer.send('close-window'),
    hide: () => ipcRenderer.send('hide-window')
});

// Expose the title bar options
contextBridge.exposeInMainWorld('titlebar', {
    create: () => {
        new Titlebar({
            backgroundColor: Color.fromHex('#151515'),
            icon: "../icon.png",
            menu: null,
            titleHorizontalAlignment: 'left'
        });
    }
});

/**
 * The schema for the store
 */
const schema = {
    functions: {
        default: []
    },
    usedUids: {
        default: []
    },
    activeFunction: {
        type: 'number',
        default: -1,
        minimum: -1,
        maximum: 10000
    }
};

// Create the store
const store = new Store({ schema });
const isolatedFunction = new isolate.isolatedFunction();

/**
 * @type {functionStore[]}
 */
let functions = store.get('functions');

/**
 * The active function index in functions,
 * or -1 if the native impl should be used
 * @type {number}
 */
let activeFunction = store.get('activeFunction');

/**
 * The used uids
 * @type {string[]}
 */
let usedUids = store.get('usedUids');

// Set whether to use the custom betting function
if (activeFunction >= 0 && activeFunction < functions.length && functions[activeFunction].active) {
    autobetLib.customBettingFunction.setUseBettingFunction(true);
    isolatedFunction.setFunction(functions[activeFunction].functionString);
    functions[activeFunction].active = true;
    store.set('functions', functions);
} else {
    autobetLib.customBettingFunction.setUseBettingFunction(false);
}

/**
 * Convert an odd to a number
 * 
 * @param {string} val the value to convert
 * @returns {number} the odd as a number
 */
function oddToNumber(val) {
    const oddRegex = /^(([2-9]|([1-2][0-9])|(3[0-1]))\/1)|(evens)$/g;
    if (val == null) {
        return null;
    } else if (oddRegex.test(val)) {
        if (val == "evens") {
            return 1;
        } else {
            return Number(val.split('/')[0]);
        }
    } else {
        throw new Error("The returned value is no odd");
    }
}

/**
 * A function to be called when the custom betting function failed
 */
function bettingFunctionError() {
    if (activeFunction >= 0 && activeFunction < functions.length) {
        functions[activeFunction].active = false;
    } else {
        for (let i = 0; i < functions.length; i++) {
            functions[i].active = false;
        }
    }

    activeFunction = -1;
    revertToDefaultCallback();

    store.set('functions', functions);
    store.set('activeFunction', activeFunction);
}

// Set the custom betting function callback
autobetLib.customBettingFunction.setBettingPositionCallback((odds) => {
    if (activeFunction < 0 || activeFunction >= functions.length) {
        return -2;
    }

    let res = null;
    try {
        let odds_cpy = Array.from(odds);
        res = isolatedFunction.run(odds_cpy);
        res = oddToNumber(res);
    } catch (e) {
        autobetLib.logging.error(`The custom betting function threw: ${e.message}`);
        functions[activeFunction].ok = false;
        functions[activeFunction].lastError = e.message;

        bettingFunctionError();
        // Return -2 on error
        return -2;
    }

    if (res === null) {
        // Return -1 on 'Do not bet'
        return -1;
    } else if (typeof res === "string") {
        let res_index = odds.indexOf(res);
        if (res_index < 0) {
            autobetLib.logging.error(`The odds did not contain the result by the custom betting function: '${res}'`);
            return -2;
        } else {
            // Return the result
            return res_index
        }
    } else {
        autobetLib.logging.error("The result from the custom betting function was neither null or a string");
        bettingFunctionError();
        // Again, return -2 on error
        return -2;
    }
});

/**
 * A callback to be called to the ui when the betting
 * function is reverted to the default one
 */
let revertToDefaultCallback = () => { };

/**
 * Generate a unique id.
 * Source: https://learnersbucket.com/examples/javascript/unique-id-generator-in-javascript/
 * 
 * @returns {string} the uid in the format 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
 */
function generateUid() {
    const s4 = () => {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}

contextBridge.exposeInMainWorld('isolatedFunction', {
    functionStore: functionStore,
    /**
     * Add a new function
     * 
     * @param {string} name the function name
     * @param {string} fnString the function string
     */
    addFunction: (name, fnString) => {
        let uid = generateUid();
        while (usedUids.includes(uid)) uid = generateUid();

        autobetLib.logging.debug(`Creating new custom function with name '${name}' and UID '${uid}'`);

        let fn = new functionStore(name, fnString, uid);
        functions.push(fn);
        usedUids.push(uid);

        store.set('usedUids', usedUids);

        return fn;
    },
    /**
     * Test a function
     * 
     * @param {string} fnString the function string to test
     */
    checkFunction: (fnString) => {
        let isolatedFn = new isolate.isolatedFunction();
        isolatedFn.setFunction(fnString);
        let result;
        try {
            result = isolatedFn.testFunction(25);
        } catch (e) {
            result = {
                ok: false,
                res: {
                    error: e.toString(),
                    stack: e.stack,
                    data: null
                }
            }
        }

        return result;
    },
    /**
     * Get the functions
     * 
     * @returns {functionStore[]} the functions
     */
    getFunctions: () => {
        return functions;
    },
    /**
     * Set the active function
     * 
     * @throws Will throw an error if fnStore is not in the functions array
     * @param {functionStore} fnStore the function
     */
    setActiveFunction: (fnStore) => {
        // Get the index of the fnStore function
        let index = -1;
        for (let i = 0; i < functions.length; i++) {
            if (functions[i].id == fnStore.id) {
                index = i;
                break;
            }
        }

        // Make sure that fnStore exists in functions
        if (index != -1) {
            // If activeFunction is a index of functions, set the function to not active
            if (activeFunction >= 0 && activeFunction < functions.length) {
                functions[activeFunction].active = false;
            } else {
                // Otherwise, set all to inactive
                for (let i = 0; i < functions.length; i++) {
                    functions[i].active = false;
                }
            }

            autobetLib.logging.debug(`Setting active betting function to function with uid '${fnStore.id}'`);

            // Set the active function to activate as active
            activeFunction = index;
            functions[index].active = true;
            isolatedFunction.setFunction(fnStore.functionString);

            // Set use the custom betting function to true
            autobetLib.customBettingFunction.setUseBettingFunction(true);

            // Store everything
            store.set('functions', functions);
            store.set('activeFunction', activeFunction);
        } else {
            throw new Error("The supplied value is invalid");
        }
    },
    /**
     * Revert to the default implementation
     */
    revertToDefaultImpl: () => {
        // Set all functions to inactive
        if (activeFunction >= 0 && activeFunction < functions.length) {
            functions[activeFunction].active = false;
        } else {
            for (let i = 0; i < functions.length; i++) {
                functions[i].active = false;
            }
        }

        // Set the active function to -1 and set use
        // the custom betting function to false
        activeFunction = -1;
        autobetLib.customBettingFunction.setUseBettingFunction(false);

        autobetLib.logging.debug("Reverting to the default implementation");

        // Store everything
        store.set('functions', functions);
        store.set('activeFunction', activeFunction);
    },
    /**
     * Delete a function
     * 
     * @param {functionStore} fn the function to delete
     */
    deleteFunction: (fn) => {
        functions.splice(functions.indexOf(fn), 1);
        usedUids.splice(usedUids.indexOf(fn.id), 1);

        store.set('usedUids', usedUids);
        store.set('functions', functions);
    },
    /**
     * Set the callback to be called when the betting function is reverted to default
     * 
     * @param {() => void} fn the callback function
     */
    setRevertToDefaultCallback: (fn) => {
        revertToDefaultCallback = fn;
    },
    /**
     * Save the functions
     * 
     * @param {functionStore[]} the functions array
     */
    saveFunctions: (fns) => {
        functions = fns;
        store.set('functions', functions);
    }
});