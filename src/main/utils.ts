import {MDCDialog} from "@material/dialog";
import {ipcRenderer} from "electron";
import autobetLib from "@autobet/autobetlib";
import {MDCSnackbar} from "@material/snackbar";

// The error dialog container
export const errordialog: MDCDialog = new MDCDialog(document.getElementById('error-dialog-container'))

const snackbar: MDCSnackbar = new MDCSnackbar(document.getElementById('strategy-select-snackbar'));
const snackbar_label: HTMLDivElement = <HTMLDivElement>document.getElementById('strategy-select-snackbar-label');
snackbar.timeoutMs = 5000;

const description_dialog: MDCDialog = new MDCDialog(document.getElementById("description-dialog")); // The description dialog
const descriptionDialogContent = document.getElementById('description-dialog-content');

/**
 * A function to be called when a fatal exception is thrown
 */
export function exception(): void {
    try {
        errordialog.open();
        errordialog.listen("MDCDialog:closed", async () => {
            // autobetLib.shutdown() may throw
            try {
                await autobetLib.shutdown();
            } catch (ignored) {
            }
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

/**
 * Show a snackbar with a text
 *
 * @param text the text to display
 */
export function showSnackbar(text: string): void {
    if (snackbar.isOpen) {
        snackbar.close();
    }

    snackbar_label.innerText = text;
    snackbar.open();
}

/**
 * Show the description
 *
 * @param title the title
 * @param description the description
 */
export function showDescription(title: string, description: string): void {
    document.getElementById("description-dialog-title").innerText = title;
    descriptionDialogContent.innerText = description;

    description_dialog.open();
}

/**
 * Add a description to an element when it is clicked
 *
 * @param element_id the id of the element
 * @param title the title of the description
 * @param description the description text
 */
export function addDescriptionTo(element_id: string, title: string, description: string): void {
    document.getElementById(element_id).addEventListener('click', () => {
        showDescription(title, description);
    });
}
