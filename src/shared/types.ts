export type JsonFileNode = {
  name: string;
  relativePath: string;
  type: 'json';
};

export type DirNode = {
  name: string;
  relativePath: string;
  type: 'dir';
  children: TreeNode[];
};

export type TreeNode = JsonFileNode | DirNode;

export type JsonValue = unknown;

export interface FileAPI {
  getRootDir(): Promise<string>;
  list(): Promise<TreeNode[]>;
  read(relativePath: string): Promise<JsonValue>;
  write(relativePath: string, data: JsonValue): Promise<TreeNode[]>;
  delete(relativePath: string): Promise<TreeNode[]>;
}

export interface ReadPayload {
  relativePath: string;
}

export interface WritePayload {
  relativePath: string;
  data: JsonValue;
}

export interface DeletePayload {
  relativePath: string;
}
