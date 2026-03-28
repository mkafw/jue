import { QAItem } from '../types';

export interface UseIssuesOptions {
  baseUrl: string;
  token?: string;
}

export interface UseIssuesReturn {
  issues: QAItem[];
  loading: boolean;
  error: string | null;
  fetch: (options?: {
    type?: 'QUESTION' | 'OKR';
    status?: string;
    tags?: string[];
    page?: number;
  }) => Promise<void>;
  create: (issue: Partial<QAItem>) => Promise<QAItem | null>;
  update: (id: string, updates: Partial<QAItem>) => Promise<QAItem | null>;
  remove: (id: string) => Promise<boolean>;
}

export function useIssues(options: UseIssuesOptions): UseIssuesReturn {
  let issues: QAItem[] = [];
  let loading = false;
  let error: string | null = null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (options.token) {
    headers['Authorization'] = `Bearer ${options.token}`;
  }

  async function fetch(fetchOptions?: {
    type?: 'QUESTION' | 'OKR';
    status?: string;
    tags?: string[];
    page?: number;
  }): Promise<void> {
    loading = true;
    error = null;

    try {
      const params = new URLSearchParams();
      if (fetchOptions?.page) params.set('page', String(fetchOptions.page));
      if (fetchOptions?.type) params.set('type', fetchOptions.type);
      if (fetchOptions?.status) params.set('status', fetchOptions.status);
      if (fetchOptions?.tags) params.set('tags', fetchOptions.tags.join(','));

      const url = `${options.baseUrl}/api/issues${params.toString() ? '?' + params : ''}`;
      const res = await fetch(url, { headers });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch issues');
      }

      issues = data.items || [];
    } catch (e) {
      error = e instanceof Error ? e.message : 'Unknown error';
      issues = [];
    } finally {
      loading = false;
    }
  }

  async function create(issue: Partial<QAItem>): Promise<QAItem | null> {
    loading = true;
    error = null;

    try {
      const res = await fetch(`${options.baseUrl}/api/issues`, {
        method: 'POST',
        headers,
        body: JSON.stringify(issue),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create issue');
      }

      issues = [...issues, data.item];
      return data.item;
    } catch (e) {
      error = e instanceof Error ? e.message : 'Unknown error';
      return null;
    } finally {
      loading = false;
    }
  }

  async function update(id: string, updates: Partial<QAItem>): Promise<QAItem | null> {
    loading = true;
    error = null;

    try {
      const res = await fetch(`${options.baseUrl}/api/issues/${id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(updates),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update issue');
      }

      issues = issues.map(i => i.id === id ? data.item : i);
      return data.item;
    } catch (e) {
      error = e instanceof Error ? e.message : 'Unknown error';
      return null;
    } finally {
      loading = false;
    }
  }

  async function remove(id: string): Promise<boolean> {
    loading = true;
    error = null;

    try {
      const res = await fetch(`${options.baseUrl}/api/issues/${id}`, {
        method: 'DELETE',
        headers,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete issue');
      }

      issues = issues.filter(i => i.id !== id);
      return true;
    } catch (e) {
      error = e instanceof Error ? e.message : 'Unknown error';
      return false;
    } finally {
      loading = false;
    }
  }

  return {
    get issues() { return issues; },
    get loading() { return loading; },
    get error() { return error; },
    fetch,
    create,
    update,
    remove,
  };
}
