import { MDCDialog } from "@material/dialog";
import { ipcRenderer } from "electron";
import autobetLib from "@autobet/autobetlib";

// The error dialog container
export const errordialog = new MDCDialog(document.getElementById('error-dialog-container'));

/**
 * A function to be called when a fatal exception is thrown
 */
export function exception(): void {
    try {
        errordialog.open();
        errordialog.listen("MDCDialog:closed", () => {
            // autobetLib.shutdown() may throw
            try {
                autobetLib.shutdown();
            } catch (ignored) { }
            quit();
        });
    } catch (e) {
        console.error(`Error in function exception: ${e}`);
    }
}

export function quit(): void {
    ipcRenderer.send('close-window');
}

export function hide(): void {
    ipcRenderer.send('hide-window');
}