import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import FileManager from './fileManager';
import type { DeletePayload, ReadPayload, WritePayload } from '../shared/types';

const ROOT_DIR = '/Users/gakumurakami/000_develop/ナレッジ管理ディレクトリ';

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

const registerIpcHandlers = (fm: FileManager): void => {
  ipcMain.handle('fs:getRootDir', () => ROOT_DIR);

  ipcMain.handle('fs:list', () => fm.listTree());

  ipcMain.handle('fs:read', (_event, { relativePath }: ReadPayload) =>
    fm.readJson(relativePath),
  );

  ipcMain.handle('fs:write', (_event, { relativePath, data }: WritePayload) => {
    fm.writeJson(relativePath, data);
    return fm.listTree();
  });

  ipcMain.handle('fs:delete', (_event, { relativePath }: DeletePayload) => {
    fm.deleteJson(relativePath);
    return fm.listTree();
  });
};

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
