const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  saveBrew: (data) => ipcRenderer.invoke('save-brew', data),
  loadBrew: (callback) => ipcRenderer.on('load-brew', callback),
  onSaveRequest: (callback) => ipcRenderer.on('save-brew-request', callback)
});
