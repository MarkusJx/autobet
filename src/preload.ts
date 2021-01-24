'use strict';

import autobetLib from "@autobet/autobetlib";
import { store, functions, activeFunction, setActiveFunctionId, isolatedFunction, revertToDefaultCallback } from "./main/isolatedFunctions";

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
 * @param val the value to convert
 * @returns the odd as a number
 */
function oddToNumber(val: string): number | null {
    const oddRegex: RegExp = /^(([2-9]|([1-2][0-9])|(3[0-1]))\/1)|(evens)$/g;
    if (val == null) {
        return null;
    } else if (oddRegex.test(val)) {
        if (val === "evens") {
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
function bettingFunctionError(): void {
    if (activeFunction >= 0 && activeFunction < functions.length) {
        functions[activeFunction].active = false;
    } else {
        for (let i = 0; i < functions.length; i++) {
            functions[i].active = false;
        }
    }

    setActiveFunctionId(-1);
    revertToDefaultCallback();

    store.set('functions', functions);
    store.set('activeFunction', activeFunction);
}

// Set the custom betting function callback
autobetLib.customBettingFunction.setBettingPositionCallback((odds) => {
    if (activeFunction < 0 || activeFunction >= functions.length) {
        return -2;
    }

    let res: number | string | null = null;
    try {
        let odds_cpy: string[] = Array.from(odds);
        res = isolatedFunction.run(odds_cpy);
        res = oddToNumber(res);
    } catch (e) {
        autobetLib.logging.error("preload.js", `The custom betting function threw: ${e.message}`);
        functions[activeFunction].ok = false;
        functions[activeFunction].lastError = e.message;

        bettingFunctionError();
        // Return -2 on error
        return -2;
    }

    if (res == null) {
        // Return -1 on 'Do not bet'
        return -1;
    } else if (typeof res === "string") {
        let res_index: number = odds.indexOf(res);
        if (res_index < 0) {
            autobetLib.logging.error("preload.js", `The odds did not contain the result by the custom betting function: '${res}'`);
            return -2;
        } else {
            // Return the result
            return res_index;
        }
    } else {
        autobetLib.logging.error("preload.js", "The result from the custom betting function was neither null or a string");
        bettingFunctionError();
        // Again, return -2 on error
        return -2;
    }
});

async function init(): Promise<void> {
    const main = await import("./main/main");
    main.init();

    const startstop = await import("./main/startstop");
    startstop.init();

    const jsEditor = await import("./main/jsEditor");
    jsEditor.init();
}

window.addEventListener('DOMContentLoaded', () => {
    init().then(() => {
        autobetLib.logging.debug("preload.ts", "init() finished");
    }, e => {
        console.error(e);
        try {
            autobetLib.logging.error("jsEditor.js", `Js exception thrown: ${e.message}`);
        } catch (e1) {
            console.error(`autobetLib.logging.error threw an exception: ${e1}`);
        }

        import("./main/utils").then(utils => utils.exception());
    });
});
