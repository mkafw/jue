import { SessionStatus } from '../types';

export interface SessionLogicOptions {
  github: any;
  owner: string;
  repo: string;
}

export class SessionLogic {
  private github: any;
  private owner: string;
  private repo: string;
  private cache: Map<string, SessionStatus> = new Map();

  constructor(options: SessionLogicOptions) {
    this.github = options.github;
    this.owner = options.owner;
    this.repo = options.repo;
  }

  async heartbeat(session: SessionStatus): Promise<SessionStatus> {
    const now = new Date().toISOString();
    const updated: SessionStatus = {
      ...session,
      lastHeartbeat: now,
    };

    this.cache.set(session.sessionId, updated);
    return updated;
  }

  async getSession(sessionId: string): Promise<SessionStatus | null> {
    const cached = this.cache.get(sessionId);
    if (cached) {
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
      if (new Date(cached.lastHeartbeat).getTime() > fiveMinutesAgo) {
        return cached;
      }
    }
    return cached || null;
  }

  async listActiveSessions(): Promise<SessionStatus[]> {
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    const sessions: SessionStatus[] = [];

    for (const [, session] of this.cache) {
      if (new Date(session.lastHeartbeat).getTime() > fiveMinutesAgo) {
        sessions.push(session);
      }
    }

    return sessions;
  }

  async closeSession(sessionId: string): Promise<void> {
    const session = this.cache.get(sessionId);
    if (session) {
      session.status = 'completed';
      session.lastHeartbeat = new Date().toISOString();
    }
  }

  async updateSessionStatus(
    sessionId: string,
    status: 'active' | 'idle' | 'completed' | 'error'
  ): Promise<SessionStatus | null> {
    const session = this.cache.get(sessionId);
    if (!session) return null;

    session.status = status;
    session.lastHeartbeat = new Date().toISOString();
    return session;
  }

  clearInactiveSessions(): number {
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    let cleared = 0;

    for (const [id, session] of this.cache) {
      if (new Date(session.lastHeartbeat).getTime() < fiveMinutesAgo) {
        this.cache.delete(id);
        cleared++;
      }
    }

    return cleared;
  }
}
