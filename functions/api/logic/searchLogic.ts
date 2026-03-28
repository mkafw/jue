import { QAItem } from '../types';
import { GitHubIssuesStorageAdapter } from '../storage/github-adapter';

export interface SearchOptions {
  query: string;
  type?: 'QUESTION' | 'OKR';
  tags?: string[];
  limit?: number;
}

export interface SearchResult {
  items: QAItem[];
  total: number;
  query: string;
}

export class SearchLogic {
  private storage: GitHubIssuesStorageAdapter;

  constructor(token: string, options: { owner?: string; repo?: string } = {}) {
    this.storage = new GitHubIssuesStorageAdapter(token, options);
  }

  async search(options: SearchOptions): Promise<SearchResult> {
    const results = await this.storage.searchNodes({
      text: options.query,
      type: options.type,
      tags: options.tags,
    });

    const limit = options.limit || 20;
    const items = results.slice(0, limit);

    return {
      items,
      total: results.length,
      query: options.query,
    };
  }

  async searchByTags(tags: string[], options: { limit?: number } = {}): Promise<QAItem[]> {
    const result = await this.storage.listNodes({
      tags,
      perPage: options.limit || 100,
    });

    return result.data;
  }

  async searchByType(type: 'QUESTION' | 'OKR', options: { limit?: number } = {}): Promise<QAItem[]> {
    const result = await this.storage.listNodes({
      type,
      perPage: options.limit || 100,
    });

    return result.data;
  }

  async getRelated(id: string): Promise<QAItem[]> {
    const item = await this.storage.getNode(id);
    if (!item) return [];

    const related: QAItem[] = [];

    for (const qId of item.linkedQuestionIds) {
      const q = await this.storage.getNode(qId);
      if (q) related.push(q);
    }

    for (const oId of item.linkedOKRIds) {
      const o = await this.storage.getNode(oId);
      if (o) related.push(o);
    }

    return related;
  }
}
