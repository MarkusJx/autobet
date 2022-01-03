import {ipcRenderer} from 'electron';
import {MDCLinearProgress} from "@material/linear-progress";

document.addEventListener('DOMContentLoaded', () => {
    const bar = new MDCLinearProgress(document.getElementById('update-progress'));
    bar.determinate = false;

    ipcRenderer.on('update-progress', (_e, progress) => {
        if (!bar.determinate) bar.determinate = true;
        bar.progress = progress;
    });
});
