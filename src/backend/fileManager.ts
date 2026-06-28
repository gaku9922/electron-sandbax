import fs from 'fs';
import path from 'path';
import type { JsonValue, TreeNode } from '../shared/types';

export default class FileManager {
  private readonly rootDir: string;

  constructor(rootDir: string) {
    this.rootDir = path.resolve(rootDir);
    fs.mkdirSync(this.rootDir, { recursive: true });
  }

  listTree(): TreeNode[] {
    return this._buildTree(this.rootDir, '');
  }

  readJson(relativePath: string): JsonValue {
    const abs = this._safePath(relativePath);
    const raw = fs.readFileSync(abs, 'utf-8');
    return JSON.parse(raw) as JsonValue;
  }

  writeJson(relativePath: string, data: JsonValue): void {
    if (!relativePath.endsWith('.json')) {
      throw new Error('ファイルパスは .json で終わる必要があります。');
    }
    const abs = this._safePath(relativePath);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, JSON.stringify(data, null, 2), 'utf-8');
  }

  deleteJson(relativePath: string): void {
    const abs = this._safePath(relativePath);
    if (!abs.endsWith('.json')) {
      throw new Error('削除できるのは .json ファイルのみです。');
    }
    fs.unlinkSync(abs);
  }

  private _safePath(relativePath: string): string {
    const abs = path.resolve(this.rootDir, relativePath);
    if (!abs.startsWith(this.rootDir + path.sep) && abs !== this.rootDir) {
      throw new Error(`不正なパスです: ${relativePath}`);
    }
    return abs;
  }

  private _buildTree(absDir: string, relativeDir: string): TreeNode[] {
    const entries = fs.readdirSync(absDir, { withFileTypes: true });
    const nodes: TreeNode[] = [];

    for (const entry of entries) {
      const relPath = relativeDir ? `${relativeDir}/${entry.name}` : entry.name;

      if (entry.isDirectory()) {
        nodes.push({
          name: entry.name,
          relativePath: relPath,
          type: 'dir',
          children: this._buildTree(path.join(absDir, entry.name), relPath),
        });
      } else if (entry.isFile() && entry.name.endsWith('.json')) {
        nodes.push({
          name: entry.name,
          relativePath: relPath,
          type: 'json',
        });
      }
    }

    nodes.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

    return nodes;
  }
}
