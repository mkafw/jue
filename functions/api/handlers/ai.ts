export interface Env {
  AI: Ai;
  GITHUB_TOKEN: string;
  GITHUB_OWNER: string;
  GITHUB_REPO: string;
  ENCRYPTION_KEY: string;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
  model?: string;
  stream?: boolean;
  max_tokens?: number;
}

const DEFAULT_MODEL = '@cf/meta/llama-3.1-70b-instruct';

export async function handleAI(
  request: Request,
  env: Env
): Promise<Response> {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: ChatRequest = await request.json();
    const messages = body.messages || [];
    const model = body.model || DEFAULT_MODEL;
    const stream = body.stream ?? false;
    const max_tokens = body.max_tokens || 1000;

    if (!messages || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Messages are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const ai = env.AI;

    if (stream) {
      const streamResponse = await ai.run(model, {
        messages,
        stream: true,
        max_tokens,
      });

      return new Response(streamResponse as any, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Transfer-Encoding': 'chunked',
          ...corsHeaders,
        },
      });
    } else {
      const result = await ai.run(model, {
        messages,
        max_tokens,
      });

      return new Response(
        JSON.stringify({
          model,
          response: (result as any).response,
          usage: {
            tokens: (result as any).usage?.total_tokens || 0,
          },
        }),
        { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: 'AI request failed',
        detail: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
}
