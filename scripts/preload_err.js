const {contextBridge, ipcRenderer} = require('electron');

contextBridge.exposeInMainWorld('autobet', {
    getError: () => {
        return ipcRenderer.sendSync('get-error');
    }
});