import type { FileAPI, TreeNode as SharedTreeNode } from '../shared/types';

declare global {
  interface Window {
    fileAPI: FileAPI;
  }

  type TreeNode = SharedTreeNode;
}

export {};
