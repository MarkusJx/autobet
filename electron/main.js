// Modules to control application life and create native browser window
const {app, BrowserWindow} = require('electron')
const path = require('path')

let mainWindow

function createWindow () {
  mainWindow = new BrowserWindow({
    width: 700,
    height: 670,
    minHeight: 670,
    minWidth: 700,
    frame: true,
    webPreferences: {
      nodeIntegration: true
    }
  })

  mainWindow.removeMenu();
  mainWindow.loadURL('http://localhost:8000/main.html');

  mainWindow.on('closed', function () {
    mainWindow = null
  })
}

app.on('ready', createWindow)

app.on('window-all-closed', function () {
  app.quit()
});

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow()
  }
})
