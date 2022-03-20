import {app, BrowserWindow, ipcMain} from 'electron';
import {autoUpdater} from "electron-updater";
import windowStateKeeper from 'electron-window-state';
import Store from 'electron-store';
import path from 'path';
import prepareNext from "electron-next";
import isDev from 'electron-is-dev';
import store from "./preload/store";
import createComm from "./main/createComm";
import createTrayMenu from "./main/createTrayMenu";
import autobet from "@autobet/autobetlib";
import enableDevTools from "./main/enableDevTools";
import packageJson from "../package.json";

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
            devTools: enableDevTools
        }
    });

    if (!enableDevTools) {
        mainWindow.removeMenu();
    }

    const tray = createTrayMenu(mainWindow, autobet);

    ipcMain.on('close-window', () => {
        tray.destroy();
        app.quit();
    });

    ipcMain.on('hide-window', () => {
        mainWindow.hide();
    });

    ipcMain.handle('autobet-version', (): string => packageJson.version);

    createComm(mainWindow);

    if (isDev) {
        await mainWindow.loadURL('http://localhost:8000');
    } else {
        await mainWindow.loadFile(path.join(__dirname, '..', '..', '..', 'renderer', 'out', 'index.html'));
    }
    mainWindowState.manage(mainWindow);
}

app.whenReady().then(async () => {
    if (autobet.programIsRunning()) {
        autobet.callbacks.setQuitCallback(() => {
            app.quit();
        });
    } else {
        await createWindow();
    }

    app.on('activate', async () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            await createWindow();
        }
    });
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});
