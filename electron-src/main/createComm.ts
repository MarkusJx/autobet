import {BrowserWindow, ipcMain} from "electron";

export default function createComm(mainWindow: BrowserWindow): void {
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
}