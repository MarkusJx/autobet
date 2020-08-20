const {app, BrowserWindow, ipcMain} = require('electron');
const path = require('path');

function createWindow () {
  const mainWindow = new BrowserWindow({
    width: 705,
    height: 830,
    minHeight: 830,
    minWidth: 705,
    frame: true,
    resizable: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      worldSafeExecuteJavaScript: true,
      nodeIntegration: false,
      webSecurity: true,
      //devTools: false
    }
  });

  //mainWindow.removeMenu();

  ipcMain.on('close-window', () => {
    app.quit();
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
