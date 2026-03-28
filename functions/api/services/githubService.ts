import { Octokit } from '@octokit/rest';

export interface GitHubConfig {
  owner: string;
  repo: string;
  token: string;
}

export class GitHubService {
  private octokit: Octokit;
  private owner: string;
  private repo: string;

  constructor(config: GitHubConfig) {
    this.octokit = new Octokit({ auth: config.token });
    this.owner = config.owner;
    this.repo = config.repo;
  }

  getClient(): Octokit {
    return this.octokit;
  }

  getOwner(): string {
    return this.owner;
  }

  getRepo(): string {
    return this.repo;
  }

  async listIssues(options: {
    labels?: string;
    state?: 'open' | 'closed' | 'all';
    per_page?: number;
    page?: number;
  }): Promise<any[]> {
    const { data } = await this.octokit.issues.listForRepo({
      owner: this.owner,
      repo: this.repo,
      labels: options.labels,
      state: options.state || 'open',
      per_page: options.per_page || 100,
      page: options.page || 1,
    });
    return data;
  }

  async getIssue(number: number): Promise<any> {
    const { data } = await this.octokit.issues.get({
      owner: this.owner,
      repo: this.repo,
      issue_number: number,
    });
    return data;
  }

  async createIssue(options: {
    title: string;
    body: string;
    labels?: string[];
  }): Promise<any> {
    const { data } = await this.octokit.issues.create({
      owner: this.owner,
      repo: this.repo,
      title: options.title,
      body: options.body,
      labels: options.labels,
    });
    return data;
  }

  async updateIssue(number: number, options: {
    title?: string;
    body?: string;
    labels?: string[];
    state?: 'open' | 'closed';
  }): Promise<any> {
    const { data } = await this.octokit.issues.update({
      owner: this.owner,
      repo: this.repo,
      issue_number: number,
      ...options,
    });
    return data;
  }

  async searchIssues(query: string, options: { per_page?: number } = {}): Promise<any[]> {
    const { data } = await this.octokit.search.issuesAndPullRequests({
      q: query,
      per_page: options.per_page || 100,
    });
    return data.items;
  }
}
