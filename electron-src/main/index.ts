import {app, BrowserWindow, dialog, ipcMain} from 'electron';
import {autoUpdater} from "electron-updater";
import windowStateKeeper from 'electron-window-state';
import Store from 'electron-store';
import path from 'path';
import prepareNext from "electron-next";
import isDev from 'electron-is-dev';
import store from "../preload/store";
import createComm from "./createComm";
import createTrayMenu from "./createTrayMenu";
import enableDevTools from "./enableDevTools";
import packageJson from "../../package.json";

let autobet: typeof import("@autobet/autobetlib") | null = null;

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
        minWidth: 600,
        frame: true,
        resizable: true,
        icon: "icon.png",
        webPreferences: {
            preload: path.join(__dirname, 'preload.bundled.js'),
            contextIsolation: true,
            nodeIntegration: false,
            webSecurity: true,
            sandbox: false,
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
        await mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'out', 'index.html'));
    }
    mainWindowState.manage(mainWindow);
}

function handleError(e: any) {
    console.error(e);
    autobet?.logging?.error('index.ts', e.message);
    dialog.showErrorBox('Failed to start autobet', e.message);
    app.quit();
}

app.whenReady().then(async () => {
    autobet = await import("@autobet/autobetlib");
    if (autobet.programIsRunning()) {
        autobet.callbacks.setQuitCallback(() => {
            app.quit();
        });
    } else {
        await createWindow();
    }

    app.on('activate', async () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            await createWindow().catch(handleError);
        }
    });
}).catch(handleError);

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});
