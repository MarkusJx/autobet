const {app, BrowserWindow, ipcMain, Tray, Menu} = require('electron');
const path = require('path');
const autobetLib = require('./autobetLib');

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 705,
        height: 830,
        minHeight: 830,
        minWidth: 530,
        frame: true,
        resizable: true,
        icon: "icon_dark.png",
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            worldSafeExecuteJavaScript: true,
            nodeIntegration: false,
            webSecurity: true,
            enableRemoteModule: true,
            //devTools: false
        }
    });

    mainWindow.webContents.openDevTools()
    //mainWindow.removeMenu();

    // Icon src: https://www.iconfinder.com/icons/3827994/business_cash_management_money_icon
    const tray = new Tray('icon.png');
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
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});
