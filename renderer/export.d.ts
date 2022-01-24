import util from "../electron-src/preload/util";
import store from "../electron-src/preload/store";

export {};

declare global {
    interface Window {
        autobet: typeof import("@autobet/autobetlib"),
        util: typeof util,
        store: typeof store
    }
}
