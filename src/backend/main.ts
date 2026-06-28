import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import dotenv from 'dotenv';
import FileManager from './fileManager';
import type {
  DeletePayload,
  DownloadPayload,
  ReadPayload,
  UploadPayload,
  WritePayload,
} from '../shared/types';

// ------------------------------------------------------------------ //
//  定数: 操作対象のルートディレクトリ
// ------------------------------------------------------------------ //
dotenv.config({ path: path.join(app.getAppPath(), '.env') });

const ROOT_DIR: string = process.env.ROOT_DIR ?? (() => {
  throw new Error('.env に ROOT_DIR が設定されていません');
})();

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

  // ------------------------------------------------------------------ //
  //  ダウンロード: ネイティブの「名前を付けて保存」ダイアログを開く
  // ------------------------------------------------------------------ //
  ipcMain.handle('fs:download', async (
    _event,
    { relativePath }: DownloadPayload,
  ) => {
    const fileName = relativePath.split('/').pop() ?? relativePath;
    const { canceled, filePath } = await dialog.showSaveDialog({
      defaultPath: fileName,
    });
    if (canceled || !filePath) return;
    fm.downloadFile(relativePath, filePath);
  });

  // ------------------------------------------------------------------ //
  //  アップロード: ネイティブの「ファイルを開く」ダイアログを開く
  // ------------------------------------------------------------------ //
  ipcMain.handle('fs:upload', async (
    _event,
    { destRelativeDir }: UploadPayload,
  ) => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openFile'],
    });
    if (canceled || filePaths.length === 0) return fm.listTree();
    fm.uploadFile(filePaths[0], destRelativeDir);
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
