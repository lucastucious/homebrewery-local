const { app, BrowserWindow, ipcMain, dialog, Menu, shell } = require('electron');
const path = require('path');
const fs = require('fs');

const isDev = process.env.NODE_ENV === 'development';

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  // Start directly in the editor (you can change the path if needed)
  if (isDev) {
    win.loadURL('http://localhost:5173');
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Nice native menu
  const menu = Menu.buildFromTemplate([
    { label: 'File',
      submenu: [
        { label: 'New Brew', click: () => win.webContents.executeJavaScript('window.location.reload()') },
        { type: 'separator' },
        { label: 'Open Brew...', click: () => openBrew(win) },
        { label: 'Save Brew As...', click: () => saveBrewAs(win) },
        { type: 'separator' },
        { label: 'Export PDF', click: () => win.webContents.printToPDF({}).then(data => {
            dialog.showSaveDialog(win, { filters: [{ name: 'PDF', extensions: ['pdf'] }] }).then(result => {
              if (!result.canceled) fs.writeFileSync(result.filePath, data);
            });
          })
        }
      ]
    },
    { role: 'editMenu' },
    { role: 'viewMenu' }
  ]);
  Menu.setApplicationMenu(menu);

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

async function openBrew(win) {
  const result = await dialog.showOpenDialog(win, {
    filters: [{ name: 'Homebrew Files', extensions: ['hb', 'json', 'md'] }]
  });
  if (!result.canceled) {
    const content = fs.readFileSync(result.filePaths[0], 'utf8');
    win.webContents.send('load-brew', content);
  }
}

async function saveBrewAs(win) {
  const result = await dialog.showSaveDialog(win, {
    filters: [{ name: 'Homebrew Files', extensions: ['hb', 'json'] }]
  });
  if (!result.canceled) {
    win.webContents.send('save-brew-request');
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
