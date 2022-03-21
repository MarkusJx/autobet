import util from "../electron-src/preload/util";
import store from "../electron-src/preload/store";
import electronWindow from "../electron-src/preload/electronWindow";
import BettingFunctionUtil from "../electron-src/preload/BettingFunctionUtil";
import licenses from "../electron-src/preload/licenses";

export {};

declare global {
    interface Window {
        autobet: typeof import("@autobet/autobetlib"),
        util: typeof util,
        store: typeof store
        electronWindow: typeof electronWindow,
        BettingFunctionUtil: typeof BettingFunctionUtil,
        licenses: typeof licenses
    }
}
