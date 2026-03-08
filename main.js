// ============================================================
//  main.js — Electron entry point for Pink Pet Paradise
//  Opens the game window with the right size and settings.
// ============================================================

const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow = null;
let isQuitting = false;

// Save file path
const savePath = path.join(app.getPath('userData'), 'pink-pet-paradise-save.json');

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 640,
    title: 'Pink Pet Paradise 🌸',
    backgroundColor: '#FFE4F0',
    // Frameless window with custom title bar for desktop app look
    frame: false,
    resizable: true,
    transparent: true,
    roundedCorners: true,
    titleBarStyle: 'hidden',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // Load the main HTML file
  mainWindow.loadFile('index.html');

  // Handle window close request from renderer
  ipcMain.handle('window-close-request', async () => {
    if (isQuitting) return;
    
    const result = await dialog.showMessageBox(mainWindow, {
      type: 'question',
      buttons: ['💾 Save & Exit', '🚪 Exit Without Saving', '❌ Cancel'],
      defaultId: 0,
      cancelId: 2,
      title: 'Save Progress?',
      message: 'Do you want to save your progress before closing?',
      detail: 'Your pets and garden will be waiting for you next time! 🌸',
      icon: app.isPackaged ? undefined : undefined,
    });

    if (result.response === 0) {
      // Save & Exit - tell renderer to save, then close
      mainWindow.webContents.send('app-save-and-close');
    } else if (result.response === 1) {
      // Exit Without Saving - delete save and close
      try {
        if (fs.existsSync(savePath)) {
          fs.unlinkSync(savePath);
          console.log('Save file deleted');
        }
        // Also clear localStorage by telling renderer
        mainWindow.webContents.send('app-clear-and-close');
      } catch (err) {
        console.error('Error deleting save:', err);
        isQuitting = true;
        mainWindow.close();
      }
    }
    // If Cancel (response === 2), do nothing
  });

  // Handle actual close after save is complete
  ipcMain.handle('window-close-confirmed', () => {
    isQuitting = true;
    if (mainWindow) mainWindow.close();
  });

  // Prevent immediate close, show dialog instead
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      // Trigger the save dialog
      mainWindow.webContents.send('app-close-requested');
    }
  });

  // Uncomment to open DevTools while developing:
  // mainWindow.webContents.openDevTools();
}

// IPC handlers for window controls
ipcMain.handle('window-minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.handle('window-maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.handle('window-close', () => {
  if (mainWindow) {
    // Trigger our custom close flow instead of immediate close
    mainWindow.webContents.send('app-close-requested');
  }
});

// Create the window when Electron is ready
app.whenReady().then(() => {
  createWindow();

  // On macOS re-create window when dock icon is clicked
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit the app when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
