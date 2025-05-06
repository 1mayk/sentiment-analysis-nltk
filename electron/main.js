const { app, BrowserWindow } = require("electron");
const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");

let backendProcess = null;

function startBackend() {
  const exePath = app.isPackaged
    ? path.join(app.getAppPath(), "backend", "dist", "backend.exe")
    : path.join(__dirname, "backend", "dist", "backend.exe");

  if (fs.existsSync(exePath)) {
    backendProcess = spawn(exePath, [], { stdio: "ignore", detached: true });
    console.log("Backend iniciado:", exePath);
  } else {
    console.error("Não encontrei o backend:", exePath);
  }
}

function stopBackend() {
  if (backendProcess) {
    backendProcess.kill();
    backendProcess = null;
  }
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false,
    },
    icon: path.join(__dirname, "icon.png"),
    backgroundColor: "#0D488F",
    show: false,
  });

  const indexPath = path.join(__dirname, "dist", "index.html");

  if (app.isPackaged) {
    // Modo produção: carrega o arquivo index.html do diretório dist
    win
      .loadFile(indexPath)
      .then(() => console.log("loadFile succeeded"))
      .catch((err) => console.error("loadFile failed:", err));
  } else {
    // Modo desenvolvimento
    win
      .loadURL("http://localhost:5173")
      .then(() => console.log("loadURL succeeded"))
      .catch((err) => console.error("loadURL failed:", err));
  }

  // Mostrar janela quando estiver pronta
  win.once('ready-to-show', () => {
    win.maximize();
    win.show();
  });
}

app.whenReady().then(() => {
  startBackend();
  createWindow();
});

app.on("window-all-closed", () => {
  stopBackend();
  if (process.platform !== "darwin") app.quit();
});