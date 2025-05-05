const { app, BrowserWindow } = require("electron");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const net = require("net");

let backendProcess = null;

function startBackend() {
  const exePath = app.isPackaged
    ? path.join(app.getAppPath(), "backend", "dist", "backend.exe")
    : path.join(__dirname, "backend", "dist", "backend.exe");


  if (fs.existsSync(exePath)) {
    backendProcess = spawn(exePath, [], { stdio: "pipe", detached: true });
    backendProcess.on("error", (err) => console.error("Backend error:", err));
    backendProcess.unref();
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

function waitForPort(port, host = "127.0.0.1", cb) {
  const socket = new net.Socket();
  socket.setTimeout(2000);
  socket
    .once("connect", () => { socket.destroy(); cb(); })
    .once("error", () => { socket.destroy(); setTimeout(() => waitForPort(port, host, cb), 500); })
    .once("timeout", () => { socket.destroy(); setTimeout(() => waitForPort(port, host, cb), 500); })
    .connect(port, host);
}

function createWindow() {
  const iconName = process.platform === "win32" ? "icon.ico" : "icon.png";
  const iconPath = app.isPackaged
    ? path.join(process.resourcesPath, "assets", iconName)
    : path.join(__dirname, "assets", iconName);

  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    icon: iconPath,
    backgroundColor: "#0D488F",
    show: false,
  });

  const indexPath = path.join(app.getAppPath(), "dist", "index.html");

  if (app.isPackaged) {
    win.loadFile(indexPath);
  } else {
    win.loadURL("http://localhost:5173");
  }

  win.once("ready-to-show", () => {
    win.maximize();
    win.show();
  });
}

app.whenReady().then(() => {
  startBackend();
  waitForPort(5000, "127.0.0.1", createWindow);
});

app.on("window-all-closed", () => {
  stopBackend();
  if (process.platform !== "darwin") app.quit();
});
