const { app, BrowserWindow } = require("electron");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const net = require("net");

let backendProcess = null;

function startBackend() {
  if (!app.isPackaged) {
    const scriptPath = path.join(__dirname, "..", "backend", "app.py");
    backendProcess = spawn("python", [scriptPath], { stdio: "inherit" });
    backendProcess.on("error", (err) => console.error("Backend error:", err));
    console.log("Backend dev iniciado:", scriptPath);
  } else {
    const exePath = path.join(
      process.resourcesPath,
      "backend",
      "dist",
      "backend.exe"
    );
    const asarUnpackedPath = path.join(
      process.resourcesPath,
      "app.asar.unpacked",
      "backend",
      "dist",
      "backend.exe"
    );
    const directBackendPath = path.join(
      process.resourcesPath,
      "backend",
      "backend.exe"
    );

    let executablePath = null;
    if (fs.existsSync(exePath)) {
      executablePath = exePath;
    } else if (fs.existsSync(directBackendPath)) {
      executablePath = directBackendPath;
    } else if (fs.existsSync(asarUnpackedPath)) {
      executablePath = asarUnpackedPath;
    } else {
      console.error(
        "Não encontrei o backend em nenhum dos paths:", 
        { exePath, directBackendPath, asarUnpackedPath }
      );
    }
    if (executablePath) {
      try {
        backendProcess = spawn(executablePath, [], {
          stdio: "inherit",
          cwd: path.dirname(executablePath),
        });

        backendProcess.on("error", (err) => {
          console.error("Erro ao iniciar o backend:", err);
        });

        backendProcess.on("exit", (code) => {
          console.log(`Backend encerrado com código: ${code}`);
        });

        console.log("Backend prod iniciado:", executablePath);
      } catch (error) {
        console.error("Exceção ao iniciar o backend:", error);
      }
    }
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
    .once("connect", () => {
      socket.destroy();
      cb();
    })
    .once("error", () => {
      socket.destroy();
      setTimeout(() => waitForPort(port, host, cb), 500);
    })
    .once("timeout", () => {
      socket.destroy();
      setTimeout(() => waitForPort(port, host, cb), 500);
    })
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
