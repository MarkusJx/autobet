import util from "../electron-src/preload/util";
import store from "../electron-src/preload/store";
import electronWindow from "../electron-src/preload/electronWindow";

export {};

declare global {
    interface Window {
        autobet: typeof import("@autobet/autobetlib"),
        util: typeof util,
        store: typeof store
        electronWindow: typeof electronWindow
    }
}
