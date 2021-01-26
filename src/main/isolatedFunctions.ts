import { functionStore } from "./functionStore";
import autobetLib from "@autobet/autobetlib";
import Store from "electron-store";
import * as isolate from "./isolatedFunction";

/**
 * A callback to be called to the ui when the betting
 * function is reverted to the default one
 */
export let revertToDefaultCallback: () => void = () => {
};

export function setRevertToDefaultCallback(fn: () => void): void {
    revertToDefaultCallback = fn;
}

type StoreType = {
    functions: functionStore[],
    usedUids: string[],
    activeFunction: number
}

// Create the store
export const store = new Store<StoreType>({
    defaults: {
        functions: [],
        usedUids: [],
        activeFunction: -1
    }
});

/**
 * The used uids
 */
let usedUids: string[] = store.get('usedUids');

export let functions: functionStore[] = store.get('functions');

/**
 * The active function index in functions,
 * or -1 if the native impl should be used
 */
export let activeFunction: number = store.get('activeFunction');

export function setActiveFunctionId(newId: number): void {
    activeFunction = newId;
}

export const isolatedFunction: isolate.isolatedFunction = new isolate.isolatedFunction((msg) => {
    autobetLib.logging.debug(`activeBettingFunction`, msg);
});

/**
 * Generate a unique id.
 * Source: https://learnersbucket.com/examples/javascript/unique-id-generator-in-javascript/
 *
 * @returns the uid in the format 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
 */
function generateUid(): string {
    const s4 = () => {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}

/**
 * Add a new function
 *
 * @param name the function name
 * @param fnString the function string
 */
export function addFunction(name: string, fnString: string): functionStore {
    let uid = generateUid();
    while (usedUids.includes(uid)) uid = generateUid();

    autobetLib.logging.debug("preload.js", `Creating new custom function with name '${name}' and UID '${uid}'`);

    let fn = new functionStore(name, fnString, uid);
    functions.push(fn);
    usedUids.push(uid);

    store.set('usedUids', usedUids);

    return fn;
}

/**
 * Test a function
 *
 * @param fnString the function string to test
 * @param fnId the function id
 */
export function checkFunction(fnString: string, fnId: string = "null") {
    let isolatedFn = new isolate.isolatedFunction((msg) => {
        if (typeof msg == "string")
            autobetLib.logging.debug(`isolatedFunction-${fnId}`, msg);
    });

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
}

/**
 * Get the functions
 *
 * @returns the functions
 */
export function getFunctions(): functionStore[] {
    return functions;
}

/**
 * Set the active function
 *
 * @throws Will throw an error if fnStore is not in the functions array
 * @param fnStore the function
 */
export function setActiveFunction(fnStore: functionStore): void {
    // Get the index of the fnStore function
    let index = -1;
    for (let i = 0; i < functions.length; i++) {
        if (functions[i].id === fnStore.id) {
            index = i;
            break;
        }
    }

    // Make sure that fnStore exists in functions
    if (index !== -1) {
        // If activeFunction is a index of functions, set the function to not active
        if (activeFunction >= 0 && activeFunction < functions.length) {
            functions[activeFunction].active = false;
        } else {
            // Otherwise, set all to inactive
            for (let i = 0; i < functions.length; i++) {
                functions[i].active = false;
            }
        }

        autobetLib.logging.debug("preload.js", `Setting active betting function to function with uid '${fnStore.id}'`);

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
}

/**
 * Revert to the default implementation
 */
export function revertToDefaultImpl(): void {
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

    autobetLib.logging.debug("preload.js", "Reverting to the default implementation");

    // Store everything
    store.set('functions', functions);
    store.set('activeFunction', activeFunction);
}

/**
 * Delete a function
 *
 * @param fn the function to delete
 */
export function deleteFunction(fn: functionStore): void {
    functions.splice(functions.indexOf(fn), 1);
    usedUids.splice(usedUids.indexOf(fn.id), 1);

    store.set('usedUids', usedUids);
    store.set('functions', functions);
}

/**
 * Save the functions
 *
 * @param fns the functions array
 */
export function saveFunctions(fns: functionStore[]): void {
    functions = fns;
    store.set('functions', functions);
}