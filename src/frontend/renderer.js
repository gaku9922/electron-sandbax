'use strict';

// ------------------------------------------------------------------ //
//  DOM 参照
// ------------------------------------------------------------------ //
const treeEl       = document.getElementById('tree');
const editorEl     = document.getElementById('editor');
const editorTitle  = document.getElementById('editorTitle');
const editorError  = document.getElementById('editorError');
const saveBtn      = document.getElementById('saveBtn');
const deleteBtn    = document.getElementById('deleteBtn');
const refreshBtn   = document.getElementById('refreshBtn');
const newPathEl    = document.getElementById('newPath');
const newContentEl = document.getElementById('newContent');
const createError  = document.getElementById('createError');
const createBtn    = document.getElementById('createBtn');
const rootBadge    = document.getElementById('rootBadge');

// 現在エディタで開いているファイルの相対パス
let currentPath = null;

// ------------------------------------------------------------------ //
//  ツリー描画
// ------------------------------------------------------------------ //

/** ツリーを取得して再描画する */
async function refreshTree() {
  try {
    const nodes = await window.fileAPI.list();
    renderTree(nodes);
  } catch (err) {
    treeEl.innerHTML = `<p class="placeholder error">取得失敗: ${err.message}</p>`;
  }
}

/**
 * ノード配列を再帰的に <ul> へ変換する
 * @param {object[]} nodes
 * @returns {HTMLElement}
 */
function buildTreeUl(nodes) {
  const ul = document.createElement('ul');
  ul.className = 'tree__list';

  for (const node of nodes) {
    const li = document.createElement('li');
    li.className = `tree__item tree__item--${node.type}`;

    if (node.type === 'dir') {
      // ディレクトリ: 折りたたみ可能
      const toggle = document.createElement('span');
      toggle.className = 'tree__toggle';
      toggle.textContent = '▾';

      const label = document.createElement('span');
      label.className = 'tree__label';
      label.textContent = node.name;

      const children = buildTreeUl(node.children);
      children.className += ' tree__children';

      toggle.addEventListener('click', () => {
        const isOpen = children.style.display !== 'none';
        children.style.display = isOpen ? 'none' : '';
        toggle.textContent = isOpen ? '▸' : '▾';
      });

      li.append(toggle, label, children);
    } else {
      // JSON ファイル: クリックで開く
      const label = document.createElement('span');
      label.className = 'tree__label tree__label--file';
      if (node.relativePath === currentPath) {
        label.classList.add('tree__label--active');
      }
      label.textContent = node.name;
      label.addEventListener('click', () => openFile(node.relativePath));
      li.appendChild(label);
    }

    ul.appendChild(li);
  }

  return ul;
}

function renderTree(nodes) {
  treeEl.innerHTML = '';
  if (nodes.length === 0) {
    treeEl.innerHTML = '<p class="placeholder">ファイルがありません</p>';
    return;
  }
  treeEl.appendChild(buildTreeUl(nodes));
}

// ------------------------------------------------------------------ //
//  エディタ操作
// ------------------------------------------------------------------ //

/** ファイルを開いてエディタに表示する */
async function openFile(relativePath) {
  try {
    const data = await window.fileAPI.read(relativePath);
    currentPath = relativePath;
    editorTitle.textContent = relativePath;
    editorEl.value = JSON.stringify(data, null, 2);
    editorEl.disabled = false;
    saveBtn.disabled = false;
    deleteBtn.disabled = false;
    editorError.textContent = '';
    // ツリーのアクティブ表示を更新
    refreshTree();
  } catch (err) {
    editorError.textContent = `読み込み失敗: ${err.message}`;
  }
}

/** エディタの内容を保存する */
saveBtn.addEventListener('click', async () => {
  if (!currentPath) return;
  editorError.textContent = '';

  let parsed;
  try {
    parsed = JSON.parse(editorEl.value);
  } catch {
    editorError.textContent = 'JSON の形式が正しくありません。';
    return;
  }

  try {
    const newTree = await window.fileAPI.write(currentPath, parsed);
    renderTree(newTree);
    showToast('保存しました');
  } catch (err) {
    editorError.textContent = `保存失敗: ${err.message}`;
  }
});

/** 現在開いているファイルを削除する */
deleteBtn.addEventListener('click', async () => {
  if (!currentPath) return;
  if (!confirm(`「${currentPath}」を削除しますか？`)) return;

  try {
    const newTree = await window.fileAPI.delete(currentPath);
    currentPath = null;
    editorTitle.textContent = 'ファイルを選択してください';
    editorEl.value = '';
    editorEl.disabled = true;
    saveBtn.disabled = true;
    deleteBtn.disabled = true;
    editorError.textContent = '';
    renderTree(newTree);
    showToast('削除しました');
  } catch (err) {
    editorError.textContent = `削除失敗: ${err.message}`;
  }
});

// ------------------------------------------------------------------ //
//  新規作成
// ------------------------------------------------------------------ //
createBtn.addEventListener('click', async () => {
  createError.textContent = '';
  const relPath = newPathEl.value.trim();
  const rawJson = newContentEl.value.trim();

  if (!relPath) {
    createError.textContent = 'ファイルパスを入力してください。';
    return;
  }
  if (!relPath.endsWith('.json')) {
    createError.textContent = 'パスは .json で終わる必要があります。';
    return;
  }

  let parsed;
  try {
    parsed = rawJson ? JSON.parse(rawJson) : {};
  } catch {
    createError.textContent = 'JSON の形式が正しくありません。';
    return;
  }

  try {
    const newTree = await window.fileAPI.write(relPath, parsed);
    renderTree(newTree);
    newPathEl.value = '';
    newContentEl.value = '';
    showToast(`「${relPath}」を作成しました`);
    // 作成したファイルをエディタで開く
    openFile(relPath);
  } catch (err) {
    createError.textContent = `作成失敗: ${err.message}`;
  }
});

// ------------------------------------------------------------------ //
//  ユーティリティ
// ------------------------------------------------------------------ //

/** 一時的なトーストメッセージを表示する */
function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  // 少し待ってからフェードイン → 自動削除
  requestAnimationFrame(() => {
    toast.classList.add('toast--visible');
    setTimeout(() => {
      toast.classList.remove('toast--visible');
      toast.addEventListener('transitionend', () => toast.remove());
    }, 2000);
  });
}

// ------------------------------------------------------------------ //
//  初期化
// ------------------------------------------------------------------ //
refreshBtn.addEventListener('click', refreshTree);

(async () => {
  // ROOT_DIR のパスをバッジに表示
  try {
    const rootDir = await window.fileAPI.getRootDir();
    rootBadge.textContent = rootDir;
    rootBadge.title = rootDir;
  } catch {
    rootBadge.textContent = '(パス取得失敗)';
  }
  refreshTree();
})();
