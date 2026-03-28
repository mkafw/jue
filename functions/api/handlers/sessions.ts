import type { Env } from "../index";
import { Octokit } from '@octokit/rest';

export interface SessionStatus {
  sessionId: string;
  status: 'active' | 'idle' | 'completed' | 'error';
  lastHeartbeat: string;
  messageCount: number;
  agents: string[];
  metadata?: Record<string, unknown>;
}

export interface SessionStorage {
  sessions: Record<string, SessionStatus>;
  lastUpdate: string;
}

const LABEL_SESSION = 'qa-session';
const SESSION_ISSUE_TITLE = '🎯 QA-OS Session Status';

// 内存缓存（Cloudflare Workers 会在多个请求间保持）
const sessionCache = new Map<string, { data: SessionStatus; timestamp: number }>();
const CACHE_TTL = 60 * 1000; // 1分钟缓存

function getOwnerRepo(env: { GITHUB_OWNER?: string; GITHUB_REPO?: string }) {
  return {
    owner: env.GITHUB_OWNER || 'mkafw',
    repo: env.GITHUB_REPO || '-QA-',
  };
}

// 获取或创建会话状态 Issue
async function getOrCreateSessionIssue(
  octokit: Octokit,
  owner: string,
  repo: string
): Promise<{ number: number; body: string }> {
  const { data: issues } = await octokit.issues.listForRepo({
    owner,
    repo,
    labels: LABEL_SESSION,
    per_page: 1,
  });

  if (issues.length > 0) {
    return { number: issues[0].number, body: issues[0].body || '{}' };
  }

  const { data: issue } = await octokit.issues.create({
    owner,
    repo,
    title: SESSION_ISSUE_TITLE,
    body: JSON.stringify({ sessions: {}, lastUpdate: new Date().toISOString() }),
    labels: [LABEL_SESSION],
  });

  return { number: issue.number, body: '{}' };
}

// 从 Issue body 解析会话状态
function parseSessionStorage(body: string): SessionStorage {
  try {
    return JSON.parse(body || '{}');
  } catch {
    return { sessions: {}, lastUpdate: new Date().toISOString() };
  }
}

// 序列化会话状态
function serializeSessionStorage(storage: SessionStorage): string {
  return JSON.stringify(storage, null, 2);
}

// 心跳上报
export async function heartbeat(
  octokit: Octokit,
  owner: string,
  repo: string,
  session: SessionStatus
): Promise<SessionStatus> {
  const { number, body } = await getOrCreateSessionIssue(octokit, owner, repo);
  const storage = parseSessionStorage(body);

  // 更新会话状态
  storage.sessions[session.sessionId] = {
    ...session,
    lastHeartbeat: new Date().toISOString(),
  };
  storage.lastUpdate = new Date().toISOString();

  // 更新 Issue
  await octokit.issues.update({
    owner,
    repo,
    issue_number: number,
    body: serializeSessionStorage(storage),
  });

  // 更新缓存
  sessionCache.set(session.sessionId, {
    data: storage.sessions[session.sessionId],
    timestamp: Date.now(),
  });

  return storage.sessions[session.sessionId];
}

// 获取所有会话状态
export async function getSessions(
  octokit: Octokit,
  owner: string,
  repo: string,
  includeMetadata: boolean = false
): Promise<SessionStatus[]> {
  const cacheKey = `all_${includeMetadata}`;
  const cached = sessionCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return Object.values(cached.data as unknown as SessionStorage).filter(
      (s): s is SessionStatus => s !== null
    );
  }

  const { number, body } = await getOrCreateSessionIssue(octokit, owner, repo);
  const storage = parseSessionStorage(body);

  let sessions = Object.values(storage.sessions);

  // 过滤活跃会话（最近5分钟有心跳）
  if (!includeMetadata) {
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    sessions = sessions.filter(s => {
      const lastHeartbeat = new Date(s.lastHeartbeat).getTime();
      return lastHeartbeat > fiveMinutesAgo;
    });
  }

  sessionCache.set(cacheKey, {
    data: storage,
    timestamp: Date.now(),
  });

  return sessions;
}

// 获取单个会话状态
export async function getSession(
  octokit: Octokit,
  owner: string,
  repo: string,
  sessionId: string
): Promise<SessionStatus | null> {
  // 先从缓存获取
  const cached = sessionCache.get(sessionId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const { body } = await getOrCreateSessionIssue(octokit, owner, repo);
  const storage = parseSessionStorage(body);
  
  const session = storage.sessions[sessionId] || null;
  
  if (session) {
    sessionCache.set(sessionId, {
      data: session,
      timestamp: Date.now(),
    });
  }

  return session;
}

// 删除会话（关闭会话）
export async function closeSession(
  octokit: Octokit,
  owner: string,
  repo: string,
  sessionId: string
): Promise<void> {
  const { number, body } = await getOrCreateSessionIssue(octokit, owner, repo);
  const storage = parseSessionStorage(body);

  if (storage.sessions[sessionId]) {
    storage.sessions[sessionId].status = 'completed';
    storage.sessions[sessionId].lastHeartbeat = new Date().toISOString();
    storage.lastUpdate = new Date().toISOString();

    await octokit.issues.update({
      owner,
      repo,
      issue_number: number,
      body: serializeSessionStorage(storage),
    });

    sessionCache.delete(sessionId);
  }
}

// 导出处理函数
export async function handleSessions(
  request: Request,
  env: Env,
  octokit: Octokit
): Promise<Response> {
  const { owner, repo } = getOwnerRepo(env);
  const url = new URL(request.url);
  const pathParts = url.pathname.replace('/api/sessions', '').split('/').filter(Boolean);
  const sessionId = pathParts[0];

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // 处理 OPTIONS 预检请求
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // POST /api/sessions - 心跳上报
    if (request.method === 'POST' && !sessionId) {
      const session: SessionStatus = await request.json();
      
      if (!session.sessionId) {
        return new Response(JSON.stringify({ error: 'Missing sessionId' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      const result = await heartbeat(octokit, owner, repo, session);
      return new Response(JSON.stringify(result), {
        status: 201,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // GET /api/sessions - 获取所有会话
    if (request.method === 'GET' && !sessionId) {
      const includeMetadata = url.searchParams.get('includeMetadata') === 'true';
      const sessions = await getSessions(octokit, owner, repo, includeMetadata);
      return new Response(JSON.stringify(sessions), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // GET /api/sessions/:id - 获取单个会话
    if (request.method === 'GET' && sessionId) {
      const session = await getSession(octokit, owner, repo, sessionId);
      
      if (!session) {
        return new Response(JSON.stringify({ error: 'Session not found', sessionId }), {
          status: 404,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      return new Response(JSON.stringify(session), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // DELETE /api/sessions/:id - 关闭会话
    if (request.method === 'DELETE' && sessionId) {
      await closeSession(octokit, owner, repo, sessionId);
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error) {
    return new Response(JSON.stringify({ 
      error: 'Session operation failed',
      detail: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
}
