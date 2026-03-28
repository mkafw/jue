export interface QAItem {
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

export interface SessionStatus {
  sessionId: string;
  status: 'active' | 'idle' | 'completed' | 'error';
  lastHeartbeat: string;
  messageCount: number;
  agents: string[];
  metadata?: Record<string, unknown>;
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
