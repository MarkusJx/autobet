import Store from "electron-store";
import {validate} from "./annotations";
import classToObject from "./classToObject";
import {FunctionStore} from "../../renderer/util/FunctionStore";

interface StoreType {
    autoUpdate: boolean;
    functions: FunctionStore[],
    usedUids: string[],
    activeFunction: number
}

const electronStore = new Store<StoreType>({
    defaults: {
        autoUpdate: true,
        functions: [],
        usedUids: [],
        activeFunction: -1
    }
});

class store {
    @validate
    public static setAutoUpdate(val: boolean): void {
        electronStore.set('autoUpdate', val);
    }

    @validate
    public static getAutoUpdate(): boolean {
        return electronStore.get('autoUpdate');
    }

    @validate
    public static getFunctions(): FunctionStore[] {
        return electronStore.get('functions');
    }

    //@validate
    public static setFunctions(functions: FunctionStore[]): void {
        electronStore.set('functions', functions);
    }

    //@validate
    public static addFunction(fn: FunctionStore): void {
        const functions = store.getFunctions();
        functions.push(fn);
        electronStore.set('functions', functions);
    }

    //@validate
    public static removeFunction(fn: FunctionStore): void {
        const functions = store.getFunctions();
        functions.splice(functions.indexOf(fn), 1);
        electronStore.set('functions', functions);
    }

    @validate
    public static getActiveFunction(): number {
        return electronStore.get('activeFunction');
    }

    @validate
    public static setActiveFunction(id: number) {
        electronStore.set('activeFunction', id);
    }

    @validate
    public static getUsedUids(): string[] {
        return electronStore.get('usedUids');
    }

    @validate
    public static addUid(val: string): void {
        const ids = store.getUsedUids();
        ids.push(val);
        electronStore.set('usedUids', ids);
    }

    @validate
    public static removeUid(val: string): void {
        const ids = store.getUsedUids();
        ids.splice(ids.indexOf(val), 1);
        electronStore.set('usedUids', ids);
    }
}

export default classToObject(store);