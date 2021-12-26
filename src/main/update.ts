import {UpdateCheckResult} from "electron-updater";
import {MDCSnackbar} from "@material/snackbar";
import {ipcRenderer} from "electron";
import autobetLib from "@autobet/autobetlib";
import {MDCRipple} from "@material/ripple";
import {MDCDialog} from "@material/dialog";

const snackbar = new MDCSnackbar(document.getElementById('update-available-message'));
const viewPatchNotes = document.getElementById('update-available-message-patch-notes');
const install = document.getElementById('update-available-message-install');
const label = document.getElementById('update-available-label');

const dialog = new MDCDialog(document.getElementById('patch-notes-dialog'));
const dialogContent = document.getElementById('patch-notes-dialog-content');

MDCRipple.attachTo(viewPatchNotes);
MDCRipple.attachTo(install);

snackbar.timeoutMs = 10000;

viewPatchNotes.addEventListener('click', () => {
    dialog.open();
});

install.addEventListener('click', () => {
    ipcRenderer.send('install-update');
});

dialog.listen('MDCDialog:closed', (e: CustomEvent<{action: "install" | "cancel"}>) => {
    if (e.detail.action === "install") {
        ipcRenderer.send('install-update');
    }
});

export function checkForUpdates() {
    run()
        .then()
        .catch(e => {
            console.error(e);
            autobetLib.logging.error.bind(null, "update.ts", e.toString());
        });
}

async function run(): Promise<void> {
    const updateAvailable: boolean = await ipcRenderer.invoke('update-available');
    const update: UpdateCheckResult = await ipcRenderer.invoke('check-for-update');

    if (updateAvailable) {
        label.innerText = `A new version of autobet is available: ${update.updateInfo.version}`;
        dialogContent.innerHTML = update.updateInfo.releaseNotes as string;
        snackbar.open();
        autobetLib.logging.debug("update.ts", "Found a new version of autobet");
    } else {
        autobetLib.logging.debug("update.ts", "Did not find a new version of autobet");
    }
}