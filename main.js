'use strict';

const {app, BrowserWindow, ipcMain, Tray, Menu} = require('electron');
const windowStateKeeper = require('electron-window-state');
const path = require('path');
const {autoUpdater} = require("electron-updater");
let autobetLib = null, autobetLibError = null;
try {
    autobetLib = require('@autobet/autobetlib');
} catch (e) {
    autobetLibError = e;
}

/**
 * @type {boolean}
 */
let enableDevTools;

{
    const version = require('./package.json').version;
    const rel_ver_regex = /^([0-9]+\.?)+$/;

    enableDevTools = !rel_ver_regex.test(version) || (process.argv.length >= 3 && process.argv[2] === "--enableDevTools");

    console.log(`Starting with devTools ${enableDevTools ? "enabled" : "disabled"}`);
}

let tray = null;

function createWindow() {
    autoUpdater.checkForUpdatesAndNotify().then(r => console.log(r));
    const mainWindowState = windowStateKeeper({
        defaultWidth: 705,
        defaultHeight: 830
    });

    const mainWindow = new BrowserWindow({
        x: mainWindowState.x,
        y: mainWindowState.y,
        width: mainWindowState.width,
        height: mainWindowState.height,
        minHeight: 500,
        minWidth: 530,
        frame: false,
        resizable: true,
        icon: "icon.png",
        webPreferences: {
            preload: path.join(__dirname, 'scripts', 'preload.js'),
            contextIsolation: true,
            worldSafeExecuteJavaScript: true,
            nodeIntegration: false,
            webSecurity: true,
            enableRemoteModule: true,
            devTools: enableDevTools
        }
    });

    if (!enableDevTools) {
        mainWindow.removeMenu();
    }

    // Icon src: https://www.iconfinder.com/icons/3827994/business_cash_management_money_icon
    tray = new Tray('resources/icon.png');
    const contextMenu = Menu.buildFromTemplate([
        {label: 'Autobet', type: 'normal', enabled: false},
        {type: 'separator'},
        {label: 'Show UI', type: 'checkbox', checked: true, id: 'show-ui'},
        {type: 'separator'},
        {label: 'Quit', type: 'normal', id: 'quit'}
    ]);
    tray.setToolTip("Autobet");
    tray.setContextMenu(contextMenu);

    const show_ui = contextMenu.getMenuItemById('show-ui');
    show_ui.click = () => {
        if (show_ui.checked) {
            mainWindow.hide();
            show_ui.checked = false;
        } else {
            mainWindow.show();
            show_ui.checked = true;
        }
    };

    contextMenu.getMenuItemById('quit').click = () => {
        autobetLib.shutdown();
        app.quit();
    };

    ipcMain.on('close-window', () => {
        app.quit();
    });

    ipcMain.on('hide-window', () => {
        mainWindow.hide();
    });

    mainWindow.loadFile(path.join(__dirname, 'ui', 'index.html')).then(() => {
        console.log("Main window loaded");
    });

    mainWindowState.manage(mainWindow);
}

function createErrorWindow() {
    const errorWindowState = windowStateKeeper({
        defaultWidth: 705,
        defaultHeight: 830
    });

    const errorWindow = new BrowserWindow({
        x: errorWindowState.x,
        y: errorWindowState.y,
        width: 750,
        height: 440,
        minWidth: 750,
        minHeight: 440,
        frame: true,
        resizable: true,
        icon: "icon.png",
        webPreferences: {
            preload: path.join(__dirname, 'scripts', 'preload_err.js'),
            contextIsolation: true,
            worldSafeExecuteJavaScript: true,
            nodeIntegration: false,
            webSecurity: true,
            enableRemoteModule: true,
            devTools: enableDevTools
        }
    });

    if (!enableDevTools) {
        errorWindow.removeMenu();
    }

    errorWindow.loadFile(path.join(__dirname, 'ui', 'err', 'index.html')).then(() => {
        console.log("Error window loaded");
    });

    ipcMain.on('get-error', (event) => {
        event.returnValue = autobetLibError;
    });

    errorWindowState.manage(errorWindow);
}

app.whenReady().then(() => {
    if (autobetLib != null) {
        if (autobetLib.programIsRunning()) {
            autobetLib.callbacks.setQuitCallback(() => {
                app.quit();
            });
        } else {
            createWindow();
        }
    } else {
        createErrorWindow();
    }

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) {
            if (autobetLib != null) {
                createWindow();
            } else {
                createErrorWindow();
            }
        }
    });
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});
