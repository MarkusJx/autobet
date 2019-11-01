const { app, BrowserWindow } = require('electron');

const { spawn } = require('child_process');
var cmd = require('node-cmd');
const fs = require('fs');

var updating = false;

function execute(command, callback) {
  cmd.get(command, (error, stdout, stderr) => {
    console.log(error);
    console.log(stderr);
    callback(stdout);
  })
}
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
  updateAvailable((available) => {
    if (available) {
      console.log("Update available!");
      console.log(args);
      if (args[1] == "--runupdate" || fs.existsSync("RUNUPDATE")) {
        console.log("Updating...");
        updating = true;
        startUpdate();
        createWindows();
      } else {
        canUpdate((updatable) => {
          if (updatable) {
            console.log("Initializing update...");
            initUpdate();
            updating = true;
            createWindows();
          } else {
            console.log("Downloading...");
            downloadUpdate();
            createWindows();
          }
        })
      }
    } else {
      createWindows();
    }
})
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
      width: 670,
      height: 700,
      minHeight: 670,
      minWidth: 700,
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

function updateAvailable(available) {
  execute("jre\\bin\\java.exe -jar updater.jar --check", (output) => {
      available(output.trim() == "true";
)
})
}

function canUpdate(updatable) {
  execute("jre\\bin\\java.exe -jar updater.jar --downloaded", (output) => {
    console.log("output: " + output);
    updatable(output.trim() == "true");
})
}

function initUpdate() {
  execute("jre\\bin\\java.exe -jar updater.jar --initupdate", (output) => {
    app.quit();
  })
}

function downloadUpdate() {
  var process = spawn("jre\\bin\\java.exe", ["-jar", "updater.jar", "--downloadupdate"]);

  process.stdout.on("data", (data) => {
    console.log(data);
  })

  process.stderr.on("data", (err) => {
    console.log(err);
  })

  process.on("exit", (code) => {
    console.log("Process finished with code " + code);
  })
}

function startUpdate() {
  execute("jre\\bin\\java.exe -jar updater.jar --runupdate", (output) => {
    app.quit();
  })
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
