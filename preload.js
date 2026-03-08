// ============================================================
//  preload.js — Secure bridge between renderer and main process
// ============================================================

const { contextBridge, ipcRenderer } = require('electron');

// Expose window control methods to the renderer
contextBridge.exposeInMainWorld('electronAPI', {
  minimizeWindow: () => ipcRenderer.invoke('window-minimize'),
  maximizeWindow: () => ipcRenderer.invoke('window-maximize'),
  closeWindow: () => ipcRenderer.invoke('window-close'),
  
  // Close dialog handlers
  onCloseRequested: (callback) => ipcRenderer.on('app-close-requested', callback),
  onSaveAndClose: (callback) => ipcRenderer.on('app-save-and-close', callback),
  onClearAndClose: (callback) => ipcRenderer.on('app-clear-and-close', callback),
  confirmClose: () => ipcRenderer.invoke('window-close-confirmed'),
  
  // Remove listeners
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
});
