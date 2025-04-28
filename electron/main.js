const { app, BrowserWindow } = require("electron");
const path = require("path");
const fs = require("fs");

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
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
