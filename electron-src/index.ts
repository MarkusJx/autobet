import {app, BrowserWindow, ipcMain, Menu, Tray} from 'electron';
import {autoUpdater} from "electron-updater";
import windowStateKeeper from 'electron-window-state';
import Store from 'electron-store';
import path from 'path';
import prepareNext from "electron-next";
import isDev from 'electron-is-dev';
import store from "./preload/store";

let autobetLib: typeof import("@autobet/autobetlib") | null = null;
let autobetLibError: Error | null = null;

try {
    autobetLib = require('@autobet/autobetlib');
} catch (e: any) {
    autobetLibError = e;
}

let enableDevTools: boolean;
const version: string = require('./../../package.json').version;

{
    const rel_ver_regex: RegExp = /^([0-9]+\.)*[0-9]*$/;

    enableDevTools = !rel_ver_regex.test(version) || (process.argv.length >= 3 && process.argv[2] === "--enableDevTools");

    console.log(`Starting with devTools ${enableDevTools ? "enabled" : "disabled"}`);
}

let tray: Tray | null = null;

async function createWindow(): Promise<void> {
    await prepareNext('./renderer');
    Store.initRenderer();

    if (store.getAutoUpdate()) {
        autoUpdater.checkForUpdatesAndNotify().then(r => {
            if (r != null)
                console.log(r);
        });
    }

    const mainWindowState: windowStateKeeper.State = windowStateKeeper({
        defaultWidth: 705,
        defaultHeight: 830
    });

    const mainWindow: BrowserWindow = new BrowserWindow({
        x: mainWindowState.x,
        y: mainWindowState.y,
        width: mainWindowState.width,
        height: mainWindowState.height,
        minHeight: 500,
        minWidth: 530,
        frame: false,
        resizable: true,
        titleBarStyle: 'hidden',
        icon: "icon.png",
        webPreferences: {
            preload: path.join(__dirname, 'preload', 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            webSecurity: true,
            devTools: true
        }
    });

    /*if (!enableDevTools) {
        mainWindow.removeMenu();
    }*/

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

    const show_ui: Electron.MenuItem = contextMenu.getMenuItemById('show-ui')!;
    show_ui.click = () => {
        if (show_ui.checked) {
            mainWindow.hide();
            show_ui.checked = false;
        } else {
            mainWindow.show();
            show_ui.checked = true;
        }
    };

    const quitItem: Electron.MenuItem = contextMenu.getMenuItemById('quit')!;
    quitItem.click = () => {
        const quit = () => {
            tray!.destroy();
            app.quit();
        };

        quitItem.enabled = false;
        autobetLib!.shutdown().then(quit, quit);
    };

    ipcMain.on('close-window', () => {
        tray!.destroy();
        app.quit();
    });

    ipcMain.on('hide-window', () => {
        mainWindow.hide();
    });

    ipcMain.handle('autobet-version', (): string => version);

    mainWindow.on('maximize', () => {
        mainWindow.webContents.send('window-onMaximize');
    });

    mainWindow.on('unmaximize', () => {
        mainWindow.webContents.send('window-onRestore');
    });

    ipcMain.handle('window-restore', (): void => {
        mainWindow.restore();
    });

    ipcMain.handle('window-maximize', (): void => {
        mainWindow.maximize();
    });

    ipcMain.handle('window-isMaximized', (): boolean => {
        return mainWindow.isMaximized();
    });

    ipcMain.handle('window-minimize', () => {
        mainWindow.minimize();
    })

    ipcMain.handle('window-close', () => {
        mainWindow.close();
    });

    if (isDev) {
        await mainWindow.loadURL('http://localhost:8000');
    } else {
        await mainWindow.loadFile(path.join(__dirname, '..', '..', 'renderer', 'out', 'index.html'));
    }
    mainWindowState.manage(mainWindow);
}

function createErrorWindow(): void {
    const errorWindowState: windowStateKeeper.State = windowStateKeeper({
        defaultWidth: 705,
        defaultHeight: 830
    });

    const errorWindow: BrowserWindow = new BrowserWindow({
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
            preload: path.join(__dirname, 'out', 'preload_err.js'),
            contextIsolation: true,
            nodeIntegration: false,
            webSecurity: true,
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
