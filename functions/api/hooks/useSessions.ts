import { SessionStatus } from '../types';

export interface UseSessionsOptions {
  baseUrl: string;
  token?: string;
}

export interface UseSessionsReturn {
  sessions: SessionStatus[];
  loading: boolean;
  error: string | null;
  heartbeat: (session: SessionStatus) => Promise<SessionStatus | null>;
  fetch: () => Promise<void>;
  close: (sessionId: string) => Promise<boolean>;
}

export function useSessions(options: UseSessionsOptions): UseSessionsReturn {
  let sessions: SessionStatus[] = [];
  let loading = false;
  let error: string | null = null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (options.token) {
    headers['Authorization'] = `Bearer ${options.token}`;
  }

  async function fetch(): Promise<void> {
    loading = true;
    error = null;

    try {
      const res = await fetch(`${options.baseUrl}/api/sessions`, { headers });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch sessions');
      }

      sessions = Array.isArray(data) ? data : [];
    } catch (e) {
      error = e instanceof Error ? e.message : 'Unknown error';
      sessions = [];
    } finally {
      loading = false;
    }
  }

  async function heartbeat(session: SessionStatus): Promise<SessionStatus | null> {
    error = null;

    try {
      const res = await fetch(`${options.baseUrl}/api/sessions`, {
        method: 'POST',
        headers,
        body: JSON.stringify(session),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send heartbeat');
      }

      const existingIndex = sessions.findIndex(s => s.sessionId === session.sessionId);
      if (existingIndex >= 0) {
        sessions[existingIndex] = data;
      } else {
        sessions = [...sessions, data];
      }

      return data;
    } catch (e) {
      error = e instanceof Error ? e.message : 'Unknown error';
      return null;
    }
  }

  async function close(sessionId: string): Promise<boolean> {
    loading = true;
    error = null;

    try {
      const res = await fetch(`${options.baseUrl}/api/sessions/${sessionId}`, {
        method: 'DELETE',
        headers,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to close session');
      }

      sessions = sessions.filter(s => s.sessionId !== sessionId);
      return true;
    } catch (e) {
      error = e instanceof Error ? e.message : 'Unknown error';
      return false;
    } finally {
      loading = false;
    }
  }

  return {
    get sessions() { return sessions; },
    get loading() { return loading; },
    get error() { return error; },
    fetch,
    heartbeat,
    close,
  };
}
