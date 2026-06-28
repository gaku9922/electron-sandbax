// ------------------------------------------------------------------ //
//  DOM 参照
// ------------------------------------------------------------------ //
const treeEl = document.getElementById('tree')!;
const editorEl = document.getElementById('editor') as HTMLTextAreaElement;
const editorTitle = document.getElementById('editorTitle')!;
const editorError = document.getElementById('editorError')!;
const saveBtn = document.getElementById('saveBtn') as HTMLButtonElement;
const deleteBtn = document.getElementById('deleteBtn') as HTMLButtonElement;
const refreshBtn = document.getElementById('refreshBtn')!;
const newPathEl = document.getElementById('newPath') as HTMLInputElement;
const newContentEl = document.getElementById('newContent') as HTMLTextAreaElement;
const createError = document.getElementById('createError')!;
const createBtn = document.getElementById('createBtn')!;
const rootBadge = document.getElementById('rootBadge')!;

// 現在エディタで開いているファイルの相対パス
let currentPath: string | null = null;

// ------------------------------------------------------------------ //
//  ツリー描画
// ------------------------------------------------------------------ //
function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

/** ツリーを取得して再描画する */
async function refreshTree(): Promise<void> {
  try {
    const nodes = await window.fileAPI.list();
    renderTree(nodes);
  } catch (err) {
    treeEl.innerHTML = `<p class="placeholder error">取得失敗: ${errorMessage(err)}</p>`;
  }
}

/** ノード配列を再帰的に <ul> へ変換する */
function buildTreeUl(nodes: TreeNode[]): HTMLUListElement {
  const ul = document.createElement('ul');
  ul.className = 'tree__list';

  for (const node of nodes) {
    const li = document.createElement('li');
    li.className = `tree__item tree__item--${node.type}`;

    if (node.type === 'dir') {
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

function renderTree(nodes: TreeNode[]): void {
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
async function openFile(relativePath: string): Promise<void> {
  try {
    const data = await window.fileAPI.read(relativePath);
    currentPath = relativePath;
    editorTitle.textContent = relativePath;
    editorEl.value = JSON.stringify(data, null, 2);
    editorEl.disabled = false;
    saveBtn.disabled = false;
    deleteBtn.disabled = false;
    editorError.textContent = '';
    refreshTree();
  } catch (err) {
    editorError.textContent = `読み込み失敗: ${errorMessage(err)}`;
  }
}

/** エディタの内容を保存する */
saveBtn.addEventListener('click', async () => {
  if (!currentPath) return;
  editorError.textContent = '';

  let parsed: unknown;
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
    editorError.textContent = `保存失敗: ${errorMessage(err)}`;
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
    editorError.textContent = `削除失敗: ${errorMessage(err)}`;
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

  let parsed: unknown;
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
    openFile(relPath);
  } catch (err) {
    createError.textContent = `作成失敗: ${errorMessage(err)}`;
  }
});

// ------------------------------------------------------------------ //
//  ユーティリティ
// ------------------------------------------------------------------ //

/** 一時的なトーストメッセージを表示する */
function showToast(message: string): void {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);
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
  try {
    const rootDir = await window.fileAPI.getRootDir();
    rootBadge.textContent = rootDir;
    rootBadge.title = rootDir;
  } catch {
    rootBadge.textContent = '(パス取得失敗)';
  }
  refreshTree();
})();
