import IsolatedFunction, {testResult} from "./IsolatedFunction";
import classToObject from "./classToObject";
import autobetLib from "@autobet/autobetlib";
import {v4 as uuidV4} from "uuid";
import store from "./store";
import {FunctionStore} from "../../renderer/util/FunctionStore";
import {validate} from "./annotations";

let _revertToDefaultCallback: () => void = () => {
};
const _isolatedFunction: IsolatedFunction = new IsolatedFunction(msg => {
    autobetLib.logging.debug('activeBettingFunction', msg);
});

class BettingFunctionUtil {
    public static isolatedFunction(): IsolatedFunction {
        return _isolatedFunction;
    }

    public static setRevertToDefaultCallback(fn: () => void): void {
        _revertToDefaultCallback = fn;
    }

    public static revertToDefaultCallback(): void {
        _revertToDefaultCallback();
    }

    public static addFunction(name: string, implementation: string): FunctionStore {
        const uid: string = BettingFunctionUtil.generateUid();
        autobetLib.logging.debug("preload.js", `Creating new custom function with name '${name}' and UID '${uid}'`);

        const fn: FunctionStore = new FunctionStore(name, implementation, uid);
        store.addFunction(fn);
        store.addUid(uid);

        return fn;
    }

    public static checkFunction(implementation: string, id: string = "null"): testResult {
        const isolatedFn = new IsolatedFunction((msg: string) => {
            if (typeof msg == "string") autobetLib.logging.debug(`isolatedFunction-${id}`, msg);
        });

        isolatedFn.setFunction(implementation);
        let result: testResult;
        try {
            result = isolatedFn.testFunction(25);
        } catch (e: any) {
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

    public static setActiveFunction(fnStore: FunctionStore): void {
        // Get the index of the fnStore function
        let index: number = -1;
        const functions = store.getFunctions();
        let activeFunction = store.getActiveFunction();
        for (let i: number = 0; i < functions.length; i++) {
            if (functions[i].id === fnStore.id) {
                index = i;
                break;
            }
        }

        // Make sure that fnStore exists in functions
        if (index !== -1) {
            // If activeFunction is an index of functions, set the function to not active
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
            BettingFunctionUtil.isolatedFunction().setFunction(fnStore.functionString);

            // Set use the custom betting function to true
            autobetLib.customBettingFunction.setUseBettingFunction(true);

            // Store everything
            store.setFunctions(functions);
            store.setActiveFunction(activeFunction);
        } else {
            throw new Error("The supplied value is invalid");
        }
    }

    public static revertToDefaultImpl(): void {
        const functions = store.getFunctions();
        let activeFunction = store.getActiveFunction();

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
        store.setFunctions(functions);
        store.setActiveFunction(activeFunction);
    }

    public static deleteFunction(fn: FunctionStore): void {
        store.removeFunction(fn);
        store.removeUid(fn.id);
    }

    @validate
    public static nameExists(name: string): boolean {
        return store.getFunctions().map(f => f.name).includes(name);
    }

    public static updateFunction(fn: FunctionStore): void {
        const functions = store.getFunctions();
        const index = functions.findIndex(v => v.id === fn.id);

        if (index !== -1) {
            functions[index] = fn;
            store.setFunctions(functions);
        } else {
            console.error("Could not find implementation with id", fn.id);
        }
    }

    public static defaultIsActive(): boolean {
        return store.getActiveFunction() === -1;
    }

    private static generateUid(): string {
        let uid: string = uuidV4();
        while (store.getUsedUids().includes(uid)) {
            uid = uuidV4();
        }

        return uid;
    }
}

/**
 * A function to be called when the custom betting function failed
 */
function bettingFunctionError(): void {
    const activeFunction = store.getActiveFunction();
    const functions = store.getFunctions();
    if (activeFunction >= 0 && activeFunction < functions.length) {
        functions[activeFunction].active = false;
    } else {
        for (let i = 0; i < functions.length; i++) {
            functions[i].active = false;
        }
    }

    store.setActiveFunction(-1);
    BettingFunctionUtil.revertToDefaultCallback();

    store.setFunctions(functions);
    store.setActiveFunction(activeFunction);
}

{
    const activeFunction = store.getActiveFunction();
    const functions = store.getFunctions();
    // Set whether to use the custom betting function
    if (activeFunction >= 0 && activeFunction < functions.length && functions[activeFunction].active) {
        autobetLib.customBettingFunction.setUseBettingFunction(true);
        BettingFunctionUtil.isolatedFunction().setFunction(functions[activeFunction].functionString);
        functions[activeFunction].active = true;
        store.setFunctions(functions);
    } else {
        autobetLib.customBettingFunction.setUseBettingFunction(false);
    }

    // Set the custom betting function callback
    autobetLib.customBettingFunction.setBettingPositionCallback((odds: string[]) => {
        if (activeFunction < 0 || activeFunction >= functions.length) {
            return -2;
        }

        let res: string | null = null;
        try {
            let odds_cpy: string[] = Array.from(odds);
            res = BettingFunctionUtil.isolatedFunction().run(odds_cpy);
        } catch (e: any) {
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
                autobetLib.logging.error("preload.ts", `The odds did not contain the result by the custom betting function: '${res}'`);
                return -2;
            } else {
                // Return the result
                return res_index;
            }
        } else {
            autobetLib.logging.error("preload.ts", "The result from the custom betting function was neither null or a string");
            bettingFunctionError();
            // Again, return -2 on error
            return -2;
        }
    });
}

export default classToObject(BettingFunctionUtil);