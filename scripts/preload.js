const { contextBridge, ipcRenderer } = require('electron');
const autobetLib = require('../autobetLib');
const { Titlebar, Color } = require('custom-electron-titlebar');
const Store = require('electron-store');
const isolate = require('./isolatedFunction/isolatedFunction');
const { functionStore } = require('./functionStore/functionStore');

contextBridge.exposeInMainWorld('autobetLib', autobetLib);
contextBridge.exposeInMainWorld('electron', {
    quit: () => ipcRenderer.send('close-window'),
    hide: () => ipcRenderer.send('hide-window')
});

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

const schema = {
    functions: {
        type: 'functionStore[]',
        default: []
    },
    activeFunction: {
        type: 'number',
        default: -1,
        minimum: -1,
        maximum: 10000
    }
};

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

// Set whether to use the custom betting function
if (activeFunction > 0 && activeFunction < functions.length) {
    autobetLib.customBettingFunction.setUseBettingFunction(true);
    isolatedFunction.setFunction(functions[activeFunction].getFunctionString());
    functions[activeFunction].setActive(true);
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

function bettingFunctionError() {
    if (activeFunction > 0 && activeFunction < functions.length) {
        functions[activeFunction].setActive(false);
    } else {
        for (let i = 0; i < functions.length; i++) {
            functions[i].setActive(false);
        }
    }

    activeFunction = -1;

    store.set('functions', functions);
    store.set('activeFunction', activeFunction);
}

autobetLib.customBettingFunction.setBettingPositionCallback((odds) => {
    if (activeFunction == -1 || activeFunction < 0 || activeFunction >= functions.length) {
        return -2;
    }

    let res = null;
    try {
        res = isolatedFunction.run(odds);
        res = oddToNumber(res);
    } catch (e) {
        functions[activeFunction].setOk(false);
        functions[activeFunction].setLastError(e.message);

        bettingFunctionError();
        // Return -2 on error
        return -2;
    }

    if (res == null) {
        // Return -1 on 'Do not bet'
        return -1;
    } else if (typeof res === "number") {
        // Return the result
        return res;
    } else {
        bettingFunctionError();
        // Again, return -2 on error
        return -2;
    }
});

contextBridge.exposeInMainWorld('isolatedFunction', {
    functionStore: functionStore,
    /**
     * Add a new function
     * 
     * @param {string} name the function name
     * @param {string} fnString the function string
     */
    addFunction: (name, fnString) => {
        let fn = new functionStore(name, fnString);
        functions.push(fn);

        return fn;
    },
    checkFunction: (fnString) => {
        return new Promise((res) => {
            let isolatedFn = new isolate.isolatedFunction();
            isolatedFn.setFunction(fnString);
            let result = isolatedFn.testFunction();

            res(result);
        });
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
     * @param {functionStore} fnStore the function
     */
    setActiveFunction: (fnStore) => {
        // Get the index of the fnStore function
        let index = functions.indexOf(fnStore);

        // Make sure that fnStore exists in functions
        if (index != -1) {
            // If activeFunction is a index of functions, set the function to not active
            if (activeFunction > 0 && activeFunction < functions.length) {
                functions[activeFunction].setActive(false);
            } else {
                // Otherwise, set all to inactive
                for (let i = 0; i < functions.length; i++) {
                    functions[i].setActive(false);
                }
            }

            // Set the active function to activate as active
            activeFunction = index;
            fnStore.setActive(true);
            isolatedFunction.setFunction(fnStore.getFunctionString());

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
        if (activeFunction > 0 && activeFunction < functions.length) {
            functions[activeFunction].setActive(false);
        } else {
            for (let i = 0; i < functions.length; i++) {
                functions[i].setActive(false);
            }
        }

        // Set the active function to -1 and set use
        // the custom betting function to false
        activeFunction = -1;
        autobetLib.customBettingFunction.setUseBettingFunction(false);

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
        store.set('functions', functions);
    }
});