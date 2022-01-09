export {};

type autobet_t = typeof import("@autobet/autobetlib");

declare global {
    interface Window {
        autobet: autobet_t
    }
}
