const {contextBridge, ipcRenderer} = require('electron');
const autobetLib = require('./autobetLib');
const {Titlebar, Color} = require('custom-electron-titlebar');

contextBridge.exposeInMainWorld('autobetLib', autobetLib);
contextBridge.exposeInMainWorld('electron', {
    quit: () => ipcRenderer.send('close-window'),
    hide: () => ipcRenderer.send('hide-window')
});

contextBridge.exposeInMainWorld('titlebar', {
    create: () => {
        new Titlebar({
            backgroundColor: Color.fromHex('#151515'),
            icon: "../icon.png",
            menu: null,
            titleHorizontalAlignment: 'left'
        });
    }
});