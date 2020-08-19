const { app, BrowserWindow } = require('electron');

var updating = false;

let mainWindow;

var args = process.argv;

try {
  process.chdir(app.getAppPath());
  console.log(`New directory: ${process.cwd()}`);
  process.chdir('..');
  process.chdir('..');
  process.chdir('..');
  console.log(`New directory: ${process.cwd()}`);
} catch (err) {
  console.error(`chdir: ${err}`);
}

function createWindow() {
  if (args[1] == "--runupdate") {
    updating = true;
  }

  createWindows();
}

function createWindows() {
  if (updating) {
    mainWindow = new BrowserWindow({
      width: 340,
      height: 170,
      frame: false,
      resizable: false,
      webPreferences: {
        nodeIntegration: true
      }
    });

    mainWindow.loadFile("update.html")
  } else {
    mainWindow = new BrowserWindow({
      width: 705,
      height: 830,
      minHeight: 830,
      minWidth: 705,
      frame: true,
      resizable: true,
      webPreferences: {
        nodeIntegration: true
      }
    });
    mainWindow.removeMenu();
    mainWindow.loadURL('http://localhost:8025/main.html', { "extraHeaders": "pragma: no-cache\n" });
  }


  mainWindow.on('closed', function () {
    mainWindow = null
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', function () {
  app.quit()
});

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow()
  }
});
