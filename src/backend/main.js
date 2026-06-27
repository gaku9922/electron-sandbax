
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const os = require('os');


const createWindow = () => {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true, // セキュリティ上必須の設定
    }
  });
  win.loadFile(path.join(__dirname, '../frontend/index.html'));
};


app.whenReady().then(() => {
  // --- ここがIPC通信の受付窓口 ---
  
  // シンプルなPing-Pong通信
  ipcMain.handle('ping', () => {
    return 'バックエンドからの返事: Pong!';
  });

  // PCのシステム情報を取得する処理（Node.jsの機能を使用）
  ipcMain.handle('get-system-info', () => {
    return {
      platform: os.platform(),
      arch: os.arch(),
      cpuCores: os.cpus().length
    };
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});


app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
