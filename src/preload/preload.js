'use strict';

const { contextBridge, ipcRenderer } = require('electron');

/**
 * window.fileAPI としてレンダラーに公開する。
 * ipcRenderer を直接レンダラーに渡さず、必要な操作だけをラップすることで
 * contextIsolation の恩恵を最大限に活かす。
 */
contextBridge.exposeInMainWorld('fileAPI', {
  /** ROOT_DIR の絶対パスを取得 */
  getRootDir: () =>
    ipcRenderer.invoke('fs:getRootDir'),

  /** ディレクトリ・ファイルのツリーを取得 */
  list: () =>
    ipcRenderer.invoke('fs:list'),

  /** JSON ファイルを読み込む */
  read: (relativePath) =>
    ipcRenderer.invoke('fs:read', { relativePath }),

  /** JSON ファイルを書き込む（新規 / 上書き） */
  write: (relativePath, data) =>
    ipcRenderer.invoke('fs:write', { relativePath, data }),

  /** JSON ファイルを削除する */
  delete: (relativePath) =>
    ipcRenderer.invoke('fs:delete', { relativePath }),
});
