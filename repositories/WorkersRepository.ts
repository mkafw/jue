
import { Question, Objective, Failure, IRepository, KeyResult } from '../types';

const WORKERS_URL = import.meta.env.VITE_WORKERS_URL || 'https://qa-os-api.tiklt1.workers.dev';
const API_BASE = "/api/issues";

async function fetchAPI(method: string, endpoint: string = '', data?: any): Promise<any> {
  const url = endpoint ? `${API_BASE}/${endpoint}` : API_BASE;
  const response = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: data ? JSON.stringify(data) : undefined,
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }
  if (response.status === 204) return null;
  return response.json();
}

export const WorkersRepository: IRepository = {
  getQuestions: async (): Promise<Question[]> => {
    const items = await fetchAPI('GET');
    return items.filter((item: any) => item.type === 'QUESTION');
  },

  addQuestion: async (question: Question): Promise<Question> => {
    return fetchAPI('POST', '', question);
  },

  deleteQuestion: async (id: string): Promise<boolean> => {
    await fetchAPI('DELETE', id);
    return true;
  },

  getFailures: async (): Promise<Failure[]> => {
    const items = await fetchAPI('GET');
    return items.filter((item: any) => item.type === 'FAILURE');
  },

  addFailure: async (failure: Failure): Promise<Failure> => {
    return fetchAPI('POST', '', failure);
  },

  updateFailure: async (id: string, updates: Partial<Failure>): Promise<Failure | null> => {
    return fetchAPI('PATCH', id, { ...updates, id });
  },

  findFailure: async (id: string): Promise<Failure | undefined> => {
    const items = await fetchAPI('GET');
    return items.find((item: any) => item.id === id && item.type === 'FAILURE');
  },

  getObjectives: async (): Promise<Objective[]> => {
    const items = await fetchAPI('GET');
    return items.filter((item: any) => item.type === 'OBJECTIVE');
  },

  addObjective: async (objective: Objective): Promise<Objective> => {
    return fetchAPI('POST', '', objective);
  },

  deleteObjective: async (id: string): Promise<boolean> => {
    await fetchAPI('DELETE', id);
    return true;
  },

  updateKeyResult: async (objectiveId: string, krId: string, status: KeyResult['status']): Promise<void> => {
    const objectives = await WorkersRepository.getObjectives();
    const objective = objectives.find(o => o.id === objectiveId);
    if (!objective) return;
    
    const updatedObjective = {
      ...objective,
      keyResults: objective.keyResults.map(kr => 
        kr.id === krId ? { ...kr, status, updatedAt: new Date().toISOString() } : kr
      ),
      updatedAt: new Date().toISOString()
    };
    
    await fetchAPI('PATCH', objectiveId, updatedObjective);
  }
};
