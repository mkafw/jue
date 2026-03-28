import { Octokit } from '@octokit/rest';
import { encrypt, decrypt } from '../crypto';
import { QAItem } from '../types';
import { StorageAdapter, StorageConfig, NodeQuery, SearchQuery, StorageResult } from './adapter';

const LABEL_QA_OS = 'qa-os';

export class GitHubIssuesStorageAdapter implements StorageAdapter {
  private octokit: Octokit;
  private owner: string;
  private repo: string;
  private encryptionKey: string;

  constructor(
    token: string,
    config: StorageConfig = {}
  ) {
    this.octokit = new Octokit({ auth: token });
    this.owner = config.owner || 'mkafw';
    this.repo = config.repo || '-QA-';
    this.encryptionKey = config.encryptionKey || '';
  }

  async init(): Promise<void> {
  }

  private getTypeLabel(type: string): string {
    return type === 'QUESTION' ? 'type:question' : 'type:okr';
  }

  private findIssueById(issues: any[], targetId: string): any {
    const regex = new RegExp(`"id"\\s*:\\s*"${targetId.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}"`);
    return issues.find(i => i.body && regex.test(i.body));
  }

  private qaToBody(item: QAItem): string {
    return JSON.stringify({
      id: item.id,
      type: item.type,
      title: item.title,
      content: item.content,
      level: item.level,
      tags: item.tags,
      linkedQuestionIds: item.linkedQuestionIds,
      linkedOKRIds: item.linkedOKRIds,
      status: item.status,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    });
  }

  private bodyToQA(body: string): QAItem {
    return JSON.parse(body);
  }

  async getNode(id: string): Promise<QAItem | null> {
    const { data: issues } = await this.octokit.issues.listForRepo({
      owner: this.owner,
      repo: this.repo,
      labels: LABEL_QA_OS,
      per_page: 100,
    });

    const targetIssue = this.findIssueById(issues, id);
    if (!targetIssue) return null;

    const decryptedBody = await decrypt(targetIssue.body || '', this.encryptionKey);
    return this.bodyToQA(decryptedBody);
  }

  async listNodes(query: NodeQuery = {}): Promise<StorageResult<QAItem[]>> {
    const page = query.page || 1;
    const perPage = Math.min(100, query.perPage || 20);

    const { data: issues, headers } = await this.octokit.issues.listForRepo({
      owner: this.owner,
      repo: this.repo,
      labels: LABEL_QA_OS,
      per_page: perPage,
      page,
    });

    const total = parseInt(headers['x-total-count'] || '0', 10);
    const items: QAItem[] = [];

    for (const issue of issues) {
      if (!issue.body) continue;
      try {
        const decryptedBody = await decrypt(issue.body, this.encryptionKey);
        const item = this.bodyToQA(decryptedBody);
        
        if (query.type && item.type !== query.type) continue;
        if (query.status && item.status !== query.status) continue;
        if (query.tags?.length && !query.tags.some(t => item.tags.includes(t))) continue;
        
        items.push(item);
      } catch {
      }
    }

    return {
      data: items,
      total,
      page,
      perPage,
      hasMore: page * perPage < total,
    };
  }

  async upsertNode(node: QAItem): Promise<QAItem> {
    const existing = await this.getNode(node.id);
    
    if (existing) {
      node.updatedAt = new Date().toISOString();
      const encryptedBody = await encrypt(this.qaToBody(node), this.encryptionKey);
      
      const { data: issues } = await this.octokit.issues.listForRepo({
        owner: this.owner,
        repo: this.repo,
        labels: LABEL_QA_OS,
        per_page: 100,
      });
      
      const targetIssue = this.findIssueById(issues, node.id);
      if (targetIssue) {
        await this.octokit.issues.update({
          owner: this.owner,
          repo: this.repo,
          issue_number: targetIssue.number,
          title: node.title,
          body: encryptedBody,
        });
      }
    } else {
      node.createdAt = new Date().toISOString();
      node.updatedAt = node.createdAt;
      const encryptedBody = await encrypt(this.qaToBody(node), this.encryptionKey);
      
      await this.octokit.issues.create({
        owner: this.owner,
        repo: this.repo,
        title: node.title,
        body: encryptedBody,
        labels: [LABEL_QA_OS, this.getTypeLabel(node.type), ...node.tags],
      });
    }

    return node;
  }

  async deleteNode(id: string): Promise<void> {
    const { data: issues } = await this.octokit.issues.listForRepo({
      owner: this.owner,
      repo: this.repo,
      labels: LABEL_QA_OS,
      per_page: 100,
    });

    const targetIssue = this.findIssueById(issues, id);
    if (!targetIssue) throw new Error(`Node ${id} not found`);

    await this.octokit.issues.update({
      owner: this.owner,
      repo: this.repo,
      issue_number: targetIssue.number,
      state: 'closed',
    });
  }

  async searchNodes(query: SearchQuery): Promise<QAItem[]> {
    const result = await this.listNodes({
      type: query.type,
      tags: query.tags,
    });

    if (!query.text) return result.data;

    const searchLower = query.text.toLowerCase();
    return result.data.filter(item =>
      item.title.toLowerCase().includes(searchLower) ||
      item.content.toLowerCase().includes(searchLower)
    );
  }
}
