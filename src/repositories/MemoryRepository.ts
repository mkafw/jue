import { Question, Objective, Failure, IRepository, KeyResult } from '../types';
import { INITIAL_QUESTIONS, INITIAL_OKRS, INITIAL_FAILURES } from '../services/mockData';

// Singleton instance storage (simulating DB)
let _questions = [...INITIAL_QUESTIONS];
let _failures = [...INITIAL_FAILURES];
let _objectives = [...INITIAL_OKRS];

export const MemoryRepository: IRepository = {
  // Questions
  getQuestions: async (): Promise<Question[]> => {
    // Simulate network delay for realism
    await new Promise(resolve => setTimeout(resolve, 300));
    return [..._questions];
  },
  
  addQuestion: async (question: Question): Promise<Question> => {
    _questions = [question, ..._questions];
    return question;
  },

  deleteQuestion: async (id: string): Promise<boolean> => {
    const initialLen = _questions.length;
    _questions = _questions.filter(q => q.id !== id);
    return _questions.length < initialLen;
  },

  // Failures
  getFailures: async (): Promise<Failure[]> => {
    return [..._failures];
  },

  addFailure: async (failure: Failure): Promise<Failure> => {
    _failures = [failure, ..._failures];
    return failure;
  },

  updateFailure: async (id: string, updates: Partial<Failure>): Promise<Failure | null> => {
    const idx = _failures.findIndex(f => f.id === id);
    if (idx === -1) return null;
    
    _failures[idx] = { ..._failures[idx], ...updates, updatedAt: new Date().toISOString() };
    return _failures[idx];
  },

  findFailure: async (id: string): Promise<Failure | undefined> => {
    return _failures.find(f => f.id === id);
  },

  // Objectives
  getObjectives: async (): Promise<Objective[]> => {
    return [..._objectives];
  },

  addObjective: async (objective: Objective): Promise<Objective> => {
    _objectives = [objective, ..._objectives];
    return objective;
  },

  deleteObjective: async (id: string): Promise<boolean> => {
    const initialLen = _objectives.length;
    _objectives = _objectives.filter(o => o.id !== id);
    return _objectives.length < initialLen;
  },

  updateKeyResult: async (objectiveId: string, krId: string, status: KeyResult['status']): Promise<void> => {
    const objIdx = _objectives.findIndex(o => o.id === objectiveId);
    if (objIdx === -1) return;

    const obj = _objectives[objIdx];
    const krIdx = obj.keyResults.findIndex(k => k.id === krId);
    if (krIdx === -1) return;

    const newKRs = [...obj.keyResults];
    newKRs[krIdx] = { ...newKRs[krIdx], status, updatedAt: new Date().toISOString() };
    
    _objectives[objIdx] = { ...obj, keyResults: newKRs, updatedAt: new Date().toISOString() };
  }
};
