import { Ai } from '@cloudflare/ai';
import { handleIssues } from './handlers/issues';
import { handleSessions } from './handlers/sessions';
import { handleAI } from './handlers/ai';
import { Octokit } from '@octokit/rest';

export interface Env {
  AI: Ai;
  GITHUB_TOKEN: string;
  GITHUB_OWNER: string;
  GITHUB_REPO: string;
  ENCRYPTION_KEY: string;
}

const API_BASE = '/api';

async function handleRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Encryption-Key',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (path.startsWith(`${API_BASE}/ai`)) {
    return await handleAI(request, env);
  }

  if (!env.GITHUB_TOKEN) {
    return new Response(JSON.stringify({ error: 'GITHUB_TOKEN is required' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  try {
    const octokit = new Octokit({ auth: env.GITHUB_TOKEN });
    
    if (path.startsWith(`${API_BASE}/issues`)) {
      return await handleIssues(request, env, octokit);
    }

    if (path.startsWith(`${API_BASE}/sessions`)) {
      return await handleSessions(request, env, octokit);
    }

    if (path === '/health' || path === '/') {
      return new Response(JSON.stringify({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        endpoints: ['/api/issues', '/api/sessions', '/api/ai']
      }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    return new Response(JSON.stringify({ error: 'Not Found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Internal Server Error' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    return handleRequest(request, env);
  },
};
