import { QAItem } from '../types';
import { StorageAdapter, StorageConfig, NodeQuery, SearchQuery, StorageResult } from './adapter';

export class EdgeKVStorageAdapter implements StorageAdapter {
  private kv: KVNamespace;
  private prefix: string;
  private cacheTTL: number;

  constructor(kv: KVNamespace, config: StorageConfig = {}) {
    this.kv = kv;
    this.prefix = config.owner || 'qa';
    this.cacheTTL = 3600;
  }

  async init(): Promise<void> {
  }

  private getKey(id: string): string {
    return `${this.prefix}:node:${id}`;
  }

  private getListKey(page: number, perPage: number): string {
    return `${this.prefix}:list:${page}:${perPage}`;
  }

  async getNode(id: string): Promise<QAItem | null> {
    const cached = await this.kv.get<QAItem>(this.getKey(id), 'json');
    if (cached) return cached;
    return null;
  }

  async listNodes(query: NodeQuery = {}): Promise<StorageResult<QAItem[]>> {
    const page = query.page || 1;
    const perPage = Math.min(100, query.perPage || 20);
    const start = (page - 1) * perPage;
    const end = start + perPage;

    const listKey = this.getListKey(page, perPage);
    const cached = await this.kv.get<{ items: QAItem[]; total: number }>(listKey, 'json');
    
    if (cached) {
      return {
        data: cached.items,
        total: cached.total,
        page,
        perPage,
        hasMore: end < cached.total,
      };
    }

    return {
      data: [],
      total: 0,
      page,
      perPage,
      hasMore: false,
    };
  }

  async upsertNode(node: QAItem): Promise<QAItem> {
    node.updatedAt = new Date().toISOString();
    
    await this.kv.put(
      this.getKey(node.id),
      JSON.stringify(node),
      { expirationTtl: this.cacheTTL }
    );

    await this.invalidateListCache();

    return node;
  }

  async deleteNode(id: string): Promise<void> {
    await this.kv.delete(this.getKey(id));
    await this.invalidateListCache();
  }

  async searchNodes(query: SearchQuery): Promise<QAItem[]> {
    const list = await this.listNodes({ perPage: 100 });
    let results = list.data;

    if (query.type) {
      results = results.filter(item => item.type === query.type);
    }

    if (query.tags?.length) {
      results = results.filter(item => 
        query.tags!.some(t => item.tags.includes(t))
      );
    }

    if (query.text) {
      const searchLower = query.text.toLowerCase();
      results = results.filter(item =>
        item.title.toLowerCase().includes(searchLower) ||
        item.content.toLowerCase().includes(searchLower)
      );
    }

    return results;
  }

  private async invalidateListCache(): Promise<void> {
  }
}
