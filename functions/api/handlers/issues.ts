import { encrypt, decrypt } from '../crypto';
import { Octokit } from '@octokit/rest';

interface QAItem {
  id: string;
  type: 'QUESTION' | 'OKR';
  title: string;
  content: string;
  level: number;
  tags: string[];
  linkedQuestionIds: string[];
  linkedOKRIds: string[];
  status: string;
  createdAt: string;
  updatedAt: string;
}

const LABEL_QA_OS = 'qa-os';
const LABEL_TYPE = 'type:question';

function getOwnerRepo(env: { GITHUB_OWNER?: string; GITHUB_REPO?: string }) {
  return {
    owner: env.GITHUB_OWNER || 'mkafw',
    repo: env.GITHUB_REPO || '-QA-',
  };
}

function qaToBody(item: QAItem): string {
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

function bodyToQA(body: string): QAItem {
  return JSON.parse(body);
}

export async function handleIssues(
  request: Request,
  env: Env,
  octokit: Octokit
): Promise<Response> {
  const { owner, repo } = getOwnerRepo(env);
  const url = new URL(request.url);
  const pathParts = url.pathname.replace('/api/issues', '').split('/').filter(Boolean);
  const issueId = pathParts[0];

  if (request.method === 'GET') {
    try {
      const { data: issues } = await octokit.issues.listForRepo({
        owner,
        repo,
        labels: LABEL_QA_OS,
        per_page: 100,
      });

      const items: QAItem[] = [];
      for (const issue of issues) {
        if (!issue.body) continue;
        try {
          const decryptedBody = await decrypt(issue.body, env.ENCRYPTION_KEY);
          const item = bodyToQA(decryptedBody);
          items.push(item);
        } catch {
          continue;
        }
      }

      return new Response(JSON.stringify(items), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to fetch issues' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }
  }

  if (request.method === 'POST') {
    try {
      const item: QAItem = await request.json();
      const encryptedBody = await encrypt(qaToBody(item), env.ENCRYPTION_KEY);

      const { data: issue } = await octokit.issues.create({
        owner,
        repo,
        title: item.title,
        body: encryptedBody,
        labels: [LABEL_QA_OS, LABEL_TYPE],
      });

      return new Response(JSON.stringify({ ...item, number: issue.number }), {
        status: 201,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to create issue' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }
  }

  if (issueId && request.method === 'PATCH') {
    try {
      const { data: issues } = await octokit.issues.listForRepo({
        owner,
        repo,
        labels: LABEL_QA_OS,
        per_page: 100,
      });

      const targetIssue = issues.find(i => i.body?.includes(`"id":"${issueId}"`));
      if (!targetIssue) {
        return new Response(JSON.stringify({ error: 'Issue not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
      }

      const item: QAItem = await request.json();
      item.updatedAt = new Date().toISOString();
      const encryptedBody = await encrypt(qaToBody(item), env.ENCRYPTION_KEY);

      await octokit.issues.update({
        owner,
        repo,
        issue_number: targetIssue.number,
        title: item.title,
        body: encryptedBody,
      });

      return new Response(JSON.stringify(item), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to update issue' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }
  }

  if (issueId && request.method === 'DELETE') {
    try {
      const { data: issues } = await octokit.issues.listForRepo({
        owner,
        repo,
        labels: LABEL_QA_OS,
        per_page: 100,
      });

      const targetIssue = issues.find(i => i.body?.includes(`"id":"${issueId}"`));
      if (!targetIssue) {
        return new Response(JSON.stringify({ error: 'Issue not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
      }

      await octokit.issues.update({
        owner,
        repo,
        issue_number: targetIssue.number,
        state: 'closed',
      });

      return new Response(null, { status: 204 });
    } catch (error) {
      return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to delete issue' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
}
