import Store from "electron-store";
import {validate} from "./annotations";
import classToObject from "./classToObject";

interface StoreType {
    autoUpdate: boolean;
}

const electronStore = new Store<StoreType>({
    defaults: {
        autoUpdate: true
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
}

export default classToObject(store);