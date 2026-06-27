'use strict';

const fs   = require('fs');
const path = require('path');


class FileManager {
  /**
   * @param {string} rootDir  操作対象のルートディレクトリ（絶対パス）
   */
  constructor(rootDir) {
    this.rootDir = path.resolve(rootDir);
    // ルートが存在しない場合は作成する
    fs.mkdirSync(this.rootDir, { recursive: true });
  }

  // ------------------------------------------------------------------ //
  //  Public API
  // ------------------------------------------------------------------ //

  /**
   * ルート配下のツリー構造を返す。
   * @returns {{ name: string, relativePath: string, type: 'dir'|'json', children?: [] }[]}
   */
  listTree() {
    return this._buildTree(this.rootDir, '');
  }

  /**
   * JSON ファイルを読み込む。
   * @param {string} relativePath  ルートからの相対パス
   * @returns {object}  パース済みの JSON オブジェクト
   */
  readJson(relativePath) {
    const abs = this._safePath(relativePath);
    const raw = fs.readFileSync(abs, 'utf-8');
    return JSON.parse(raw);
  }

  /**
   * JSON ファイルを書き込む（新規作成・上書き共用）。
   * 途中のディレクトリが存在しなければ再帰的に作成する。
   * @param {string} relativePath  ルートからの相対パス（.json で終わること）
   * @param {object} data          書き込む JavaScript オブジェクト
   */
  writeJson(relativePath, data) {
    if (!relativePath.endsWith('.json')) {
      throw new Error('ファイルパスは .json で終わる必要があります。');
    }
    const abs = this._safePath(relativePath);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, JSON.stringify(data, null, 2), 'utf-8');
  }

  /**
   * JSON ファイルを削除する。
   * @param {string} relativePath  ルートからの相対パス
   */
  deleteJson(relativePath) {
    const abs = this._safePath(relativePath);
    if (!abs.endsWith('.json')) {
      throw new Error('削除できるのは .json ファイルのみです。');
    }
    fs.unlinkSync(abs);
  }

  // ------------------------------------------------------------------ //
  //  Private helpers
  // ------------------------------------------------------------------ //

  /**
   * 相対パスを絶対パスに変換し、ルートの外を指していないか検証する。
   * @param {string} relativePath
   * @returns {string} 絶対パス
   */
  _safePath(relativePath) {
    const abs = path.resolve(this.rootDir, relativePath);
    if (!abs.startsWith(this.rootDir + path.sep) && abs !== this.rootDir) {
      throw new Error(`不正なパスです: ${relativePath}`);
    }
    return abs;
  }

  /**
   * 指定ディレクトリを再帰的に走査し、ディレクトリと JSON ファイルのみを
   * ツリー配列として返す。
   * @param {string} absDir       現在のディレクトリの絶対パス
   * @param {string} relativeDir  ルートからの相対パス
   * @returns {object[]}
   */
  _buildTree(absDir, relativeDir) {
    const entries = fs.readdirSync(absDir, { withFileTypes: true });
    const nodes = [];

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

    // ディレクトリを先に、次にファイルをアルファベット順で表示
    nodes.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

    return nodes;
  }
}

module.exports = FileManager;
