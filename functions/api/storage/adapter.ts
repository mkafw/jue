import { QAItem } from './types';

export interface NodeQuery {
  type?: 'QUESTION' | 'OKR';
  tags?: string[];
  status?: string;
  page?: number;
  perPage?: number;
}

export interface SearchQuery {
  text?: string;
  tags?: string[];
  type?: 'QUESTION' | 'OKR';
}

export interface StorageResult<T> {
  data: T;
  total: number;
  page: number;
  perPage: number;
  hasMore: boolean;
}

export interface StorageAdapter {
  init(): Promise<void>;
  
  getNode(id: string): Promise<QAItem | null>;
  
  listNodes(query?: NodeQuery): Promise<StorageResult<QAItem[]>>;
  
  upsertNode(node: QAItem): Promise<QAItem>;
  
  deleteNode(id: string): Promise<void>;
  
  searchNodes(query: SearchQuery): Promise<QAItem[]>;
}

export interface StorageConfig {
  owner?: string;
  repo?: string;
  encryptionKey?: string;
}
