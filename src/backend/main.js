
'use strict';

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const FileManager = require('./fileManager');

// ------------------------------------------------------------------ //
//  定数: 操作対象のルートディレクトリ
// ------------------------------------------------------------------ //
const ROOT_DIR = '/Users/gakumurakami/000_develop/ナレッジ管理ディレクトリ';

// ------------------------------------------------------------------ //
//  ウィンドウ生成
// ------------------------------------------------------------------ //
const createWindow = () => {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
    },
  });
  win.loadFile(path.join(__dirname, '../frontend/index.html'));
};

// ------------------------------------------------------------------ //
//  IPC ハンドラ登録
// ------------------------------------------------------------------ //
const registerIpcHandlers = (fm) => {
  // ROOT_DIR のパスを返す
  ipcMain.handle('fs:getRootDir', () => ROOT_DIR);

  // ツリー一覧を返す
  ipcMain.handle('fs:list', () => {
    return fm.listTree();
  });

  // JSON ファイルを読み込む
  // args: { relativePath: string }
  ipcMain.handle('fs:read', (_event, { relativePath }) => {
    return fm.readJson(relativePath);
  });

  // JSON ファイルを書き込む（新規作成 / 上書き）
  // args: { relativePath: string, data: object }
  ipcMain.handle('fs:write', (_event, { relativePath, data }) => {
    fm.writeJson(relativePath, data);
    return fm.listTree(); // 書き込み後のツリーを返す
  });

  // JSON ファイルを削除する
  // args: { relativePath: string }
  ipcMain.handle('fs:delete', (_event, { relativePath }) => {
    fm.deleteJson(relativePath);
    return fm.listTree(); // 削除後のツリーを返す
  });
};

// ------------------------------------------------------------------ //
//  起動
// ------------------------------------------------------------------ //
app.whenReady().then(() => {
  const fm = new FileManager(ROOT_DIR);
  registerIpcHandlers(fm);
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
