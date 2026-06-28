import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import FileManager from './fileManager';
import type { DeletePayload, ReadPayload, WritePayload } from '../shared/types';

// ------------------------------------------------------------------ //
//  定数: 操作対象のルートディレクトリ
// ------------------------------------------------------------------ //
const ROOT_DIR: string = '/Users/gakumurakami/000_develop/ナレッジ管理ディレクトリ';

// ------------------------------------------------------------------ //
//  ウィンドウ生成
// ------------------------------------------------------------------ //
const createWindow = (): void => {
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
const registerIpcHandlers = (fm: FileManager): void => {
  // ROOT_DIR のパスを返す
  ipcMain.handle('fs:getRootDir', () => ROOT_DIR);

  // ツリー一覧を返す
  ipcMain.handle('fs:list', () => fm.listTree());

  // JSON ファイルを読み込む
  ipcMain.handle('fs:read', (_event, { relativePath }: ReadPayload) =>
    fm.readJson(relativePath),
  );

  // JSON ファイルを書き込む（新規作成 / 上書き）
  ipcMain.handle('fs:write', (_event, { relativePath, data }: WritePayload) => {
    fm.writeJson(relativePath, data);
    return fm.listTree();
  });

  // JSON ファイルを削除する
  ipcMain.handle('fs:delete', (_event, { relativePath }: DeletePayload) => {
    fm.deleteJson(relativePath);
    return fm.listTree();
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
