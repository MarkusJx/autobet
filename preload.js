const {contextBridge, ipcRenderer} = require('electron');
const autobetLib = require('./autobetLib');

contextBridge.exposeInMainWorld('autobetLib', autobetLib);
contextBridge.exposeInMainWorld('electron', {
    quit: () => ipcRenderer.send('close-window'),
    hide: () => ipcRenderer.send('hide-window')
});