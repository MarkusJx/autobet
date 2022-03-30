import {ipcRenderer} from "electron";
import autobetLib from "@autobet/autobetlib";

namespace util {
    export function quit(): void {
        ipcRenderer.send('close-window');
    }

    export function hide(): void {
        ipcRenderer.send('hide-window');
    }

    export function getVersion(): Promise<string> {
        return ipcRenderer.invoke('autobet-version');
    }
}

autobetLib.callbacks.setQuitCallback(() => {
    util.quit();
});

export default util;