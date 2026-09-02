import { useState, useEffect, useCallback } from 'react';
import { Question, Objective, Failure, IRepository, KeyResult } from '../types';
import { MemoryRepository } from '../repositories/MemoryRepository';
import { WorkersRepository } from '../repositories/WorkersRepository';

/**
 * Controller Hook
 * Connects View to Data/Service layers.
 */
export const useQASystem = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [failures, setFailures] = useState<Failure[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Repository Factory: 只有明确配置了 VITE_WORKERS_URL 才走 Workers，否则用 Memory（带 mock 数据）
  const [repo] = useState<IRepository>(() => {
    const workersUrl = import.meta.env.VITE_WORKERS_URL;
    if (workersUrl) {
      console.log(`[QA-OS] Mode: Workers API (${workersUrl})`);
      return WorkersRepository;
    }
    console.log('[QA-OS] Mode: Memory (prototype with mock data)');
    return MemoryRepository;
  });

  // Initial Load
  const refresh = useCallback(async () => {
    if (questions.length === 0) setLoading(true);
    try {
      const [q, o, f] = await Promise.all([
        repo.getQuestions(),
        repo.getObjectives(),
        repo.getFailures()
      ]);
      setQuestions(q);
      setObjectives(o);
      setFailures(f);
    } catch (error) {
      console.error("Failed to load neural core:", error);
    } finally {
      setLoading(false);
    }
  }, [repo]); 

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Actions
  const handleSediment = async (failureId: string) => {
    try {
      const failure = await repo.findFailure(failureId);
      if (!failure) throw new Error("Failure not found");

      const newQuestionId = `q-sed-${Date.now()}`;
      const newQuestion: Question = {
        id: newQuestionId,
        type: 'QUESTION' as any,
        title: `Analysis: ${failure.description.substring(0, 40)}...`,
        content: `### Root Cause Analysis\n\n${failure.analysis5W2H}\n\n*Sedimented from Failure ${failure.id}*`,
        level: 0,
        tags: ['Sediment', 'Auto-Generated'],
        linkedQuestionIds: [],
        linkedOKRIds: failure.relatedKRId ? [failure.relatedKRId] : [],
        status: 'Draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await repo.addQuestion(newQuestion);
      await repo.updateFailure(failureId, {
        status: 'Sedimented',
        convertedToQuestionId: newQuestionId
      });

      await refresh(); 
      return true;
    } catch (e) {
      console.error("Sedimentation failed", e);
      return false;
    }
  };

  const addQuestion = async (question: Question) => {
    const prevQuestions = [...questions];
    setQuestions([question, ...questions]);

    try {
      await repo.addQuestion(question);
      return true;
    } catch (e) {
      console.error("Add Question failed", e);
      setQuestions(prevQuestions);
      return false;
    }
  };

  const addObjective = async (objective: Objective) => {
    try {
      await repo.addObjective(objective);
      await refresh();
      return true;
    } catch (e) {
      console.error("Add Objective failed", e);
      return false;
    }
  };

  const addFailure = async (failure: Failure) => {
    try {
      await repo.addFailure(failure);
      await refresh();
      return true;
    } catch (e) {
      console.error("Add Failure failed", e);
      return false;
    }
  };

  const deleteNode = async (id: string, type: 'QUESTION' | 'OBJECTIVE') => {
    try {
      let success = false;
      if (type === 'QUESTION') {
        success = await repo.deleteQuestion(id);
      } else {
        success = await repo.deleteObjective(id);
      }
      
      if (success) {
        console.log(`[QA-OS] Deleted ${type} node: ${id}`);
        await refresh();
      }
      return success;
    } catch (e) {
      console.error("Delete failed", e);
      return false;
    }
  };

  const toggleKRStatus = async (objectiveId: string, krId: string, currentStatus: KeyResult['status']) => {
    const newStatus = currentStatus === 'Completed' ? 'Pending' : 'Completed';
    const previousObjectives = [...objectives];

    setObjectives(prev => prev.map(obj => {
        if (obj.id !== objectiveId) return obj;
        return {
            ...obj,
            keyResults: obj.keyResults.map(kr => 
                kr.id === krId ? { ...kr, status: newStatus } : kr
            )
        };
    }));

    try {
      await repo.updateKeyResult(objectiveId, krId, newStatus);
    } catch (e) {
      console.error("Toggle KR failed", e);
      setObjectives(previousObjectives);
      return false;
    }
    return true;
  };

  return {
    data: { questions, objectives, failures },
    loading,
    actions: {
      sedimentFailure: handleSediment,
      addQuestion,
      addObjective,
      addFailure,
      deleteNode,
      toggleKRStatus,
      refresh
    }
  };
};
