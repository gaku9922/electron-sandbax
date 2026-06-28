import { contextBridge, ipcRenderer } from 'electron';
import type { FileAPI, JsonValue } from '../shared/types';

// ------------------------------------------------------------------ //
//  フロントエンドに公開するAPIの定義
// ------------------------------------------------------------------ //
const fileAPI: FileAPI = {
  getRootDir: () => ipcRenderer.invoke('fs:getRootDir'),

  list: () => ipcRenderer.invoke('fs:list'),

  read: (relativePath: string) =>
    ipcRenderer.invoke('fs:read', { relativePath }),

  write: (relativePath: string, data: JsonValue) =>
    ipcRenderer.invoke('fs:write', { relativePath, data }),

  delete: (relativePath: string) =>
    ipcRenderer.invoke('fs:delete', { relativePath }),
};

// ------------------------------------------------------------------ //
//  APIの公開
// ------------------------------------------------------------------ //
contextBridge.exposeInMainWorld('fileAPI', fileAPI);