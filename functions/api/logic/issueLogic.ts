import { QAItem } from '../types';
import { GitHubIssuesStorageAdapter } from '../storage/github-adapter';

export interface IssueLogicOptions {
  token: string;
  owner?: string;
  repo?: string;
  encryptionKey?: string;
}

export class IssueLogic {
  private storage: GitHubIssuesStorageAdapter;

  constructor(options: IssueLogicOptions) {
    this.storage = new GitHubIssuesStorageAdapter(options.token, {
      owner: options.owner,
      repo: options.repo,
      encryptionKey: options.encryptionKey,
    });
  }

  async createIssue(input: {
    id: string;
    type: 'QUESTION' | 'OKR';
    title: string;
    content?: string;
    level?: number;
    tags?: string[];
  }): Promise<QAItem> {
    const item: QAItem = {
      id: input.id,
      type: input.type,
      title: input.title,
      content: input.content || '',
      level: input.level || 0,
      tags: input.tags || [],
      linkedQuestionIds: [],
      linkedOKRIds: [],
      status: 'open',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return this.storage.upsertNode(item);
  }

  async updateIssue(id: string, updates: Partial<QAItem>): Promise<QAItem | null> {
    const existing = await this.storage.getNode(id);
    if (!existing) return null;

    const updated = { ...existing, ...updates };
    return this.storage.upsertNode(updated);
  }

  async deleteIssue(id: string): Promise<void> {
    await this.storage.deleteNode(id);
  }

  async getIssue(id: string): Promise<QAItem | null> {
    return this.storage.getNode(id);
  }

  async listIssues(options: {
    type?: 'QUESTION' | 'OKR';
    status?: string;
    tags?: string[];
    page?: number;
    perPage?: number;
  } = {}): Promise<{ items: QAItem[]; total: number; hasMore: boolean }> {
    const result = await this.storage.listNodes({
      type: options.type,
      status: options.status,
      tags: options.tags,
      page: options.page,
      perPage: options.perPage,
    });

    return {
      items: result.data,
      total: result.total,
      hasMore: result.hasMore,
    };
  }

  async searchIssues(query: string, options: {
    type?: 'QUESTION' | 'OKR';
    tags?: string[];
  } = {}): Promise<QAItem[]> {
    return this.storage.searchNodes({
      text: query,
      type: options.type,
      tags: options.tags,
    });
  }

  async linkQuestionToOKR(questionId: string, okrId: string): Promise<QAItem | null> {
    const question = await this.storage.getNode(questionId);
    if (!question) return null;

    if (!question.linkedOKRIds.includes(okrId)) {
      question.linkedOKRIds.push(okrId);
      return this.storage.upsertNode(question);
    }

    return question;
  }

  async getRelatedIssues(id: string): Promise<{ questions: QAItem[]; okrs: QAItem[] }> {
    const item = await this.storage.getNode(id);
    if (!item) return { questions: [], okrs: [] };

    const questions: QAItem[] = [];
    const okrs: QAItem[] = [];

    for (const qId of item.linkedQuestionIds) {
      const q = await this.storage.getNode(qId);
      if (q) questions.push(q);
    }

    for (const oId of item.linkedOKRIds) {
      const o = await this.storage.getNode(oId);
      if (o) okrs.push(o);
    }

    return { questions, okrs };
  }
}
