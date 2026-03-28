import { ChatMessage } from '../types';

export interface UseAIOptions {
  baseUrl: string;
  token?: string;
}

export interface UseAIReturn {
  loading: boolean;
  error: string | null;
  chat: (messages: ChatMessage[], options?: {
    model?: string;
    max_tokens?: number;
  }) => Promise<string | null>;
  chatStream: (
    messages: ChatMessage[],
    onChunk: (chunk: string) => void,
    options?: { model?: string; max_tokens?: number }
  ) => Promise<void>;
}

export function useAI(options: UseAIOptions): UseAIReturn {
  let loading = false;
  let error: string | null = null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (options.token) {
    headers['Authorization'] = `Bearer ${options.token}`;
  }

  async function chat(
    messages: ChatMessage[],
    chatOptions?: { model?: string; max_tokens?: number }
  ): Promise<string | null> {
    loading = true;
    error = null;

    try {
      const res = await fetch(`${options.baseUrl}/api/ai`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          messages,
          model: chatOptions?.model,
          max_tokens: chatOptions?.max_tokens || 1000,
          stream: false,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'AI request failed');
      }

      return data.response || null;
    } catch (e) {
      error = e instanceof Error ? e.message : 'Unknown error';
      return null;
    } finally {
      loading = false;
    }
  }

  async function chatStream(
    messages: ChatMessage[],
    onChunk: (chunk: string) => void,
    chatOptions?: { model?: string; max_tokens?: number }
  ): Promise<void> {
    loading = true;
    error = null;

    try {
      const res = await fetch(`${options.baseUrl}/api/ai`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          messages,
          model: chatOptions?.model,
          max_tokens: chatOptions?.max_tokens || 1000,
          stream: true,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'AI request failed');
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') return;
            try {
              const parsed = JSON.parse(data);
              if (parsed.response) {
                onChunk(parsed.response);
              }
            } catch {
            }
          }
        }
      }
    } catch (e) {
      error = e instanceof Error ? e.message : 'Unknown error';
    } finally {
      loading = false;
    }
  }

  return {
    get loading() { return loading; },
    get error() { return error; },
    chat,
    chatStream,
  };
}
