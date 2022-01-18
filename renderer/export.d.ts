import util from "../preload/util";

type autobet_t = typeof import("@autobet/autobetlib");

export {};

declare global {
    interface Window {
        autobet: autobet_t,
        util: typeof util,
    }
}
