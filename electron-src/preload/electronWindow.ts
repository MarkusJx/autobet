import classToObject from "./classToObject";
import {ipcRenderer} from "electron";

class ElectronWindow {
    public static onMaximize(callback: () => void): void {
        ipcRenderer.on('window-onMaximize', callback);
    }

    public static onRestore(callback: () => void): void {
        ipcRenderer.on('window-onRestore', callback);
    }

    public static restore(): void {
        ipcRenderer.invoke('window-restore').then();
    }

    public static maximize(): void {
        ipcRenderer.invoke('window-maximize').then();
    }

    public static isMaximized(): Promise<boolean> {
        return ipcRenderer.invoke('window-isMaximized');
    }

    public static minimize(): void {
        ipcRenderer.invoke('window-minimize').then();
    }

    public static close(): void {
        ipcRenderer.invoke('window-close').then();
    }
}

export default classToObject(ElectronWindow);