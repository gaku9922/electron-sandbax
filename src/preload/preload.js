
const { contextBridge, ipcRenderer } = require('electron');


// フロントエンドの window.myAPI として機能を公開する
contextBridge.exposeInMainWorld('myAPI', {
  ping: () => ipcRenderer.invoke('ping'),
  getSystemInfo: () => ipcRenderer.invoke('get-system-info')
});
