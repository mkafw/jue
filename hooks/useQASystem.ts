
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
  
  // Repository Factory Logic
  const [repo] = useState<IRepository>(() => {
    const workersUrl = import.meta.env.VITE_WORKERS_URL || 'https://qa-os-api.tiklt1.workers.dev';
    console.log(`[QA-OS] System initializing. Mode: ${workersUrl ? 'Workers + GitHub' : 'PROTOTYPE (Memory)'}`);
    return workersUrl ? WorkersRepository : MemoryRepository;
  });

  // Initial Load
  const refresh = useCallback(async () => {
    // Only set loading on initial load or full refreshes
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

  // L3: OPTIMISTIC ADD QUESTION
  const addQuestion = async (question: Question) => {
    // 1. Instant UI Feedback
    const prevQuestions = [...questions];
    setQuestions([question, ...questions]);

    try {
      // 2. Async Persist
      await repo.addQuestion(question);
      // No need to refresh, local state is valid
      return true;
    } catch (e) {
      console.error("Add Question failed", e);
      // 3. Rollback
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

  // L2: OPTIMISTIC UPDATE KR
  const toggleKRStatus = async (objectiveId: string, krId: string, currentStatus: KeyResult['status']) => {
    const newStatus = currentStatus === 'Completed' ? 'Pending' : 'Completed';
    
    // 1. Snapshot previous state for rollback
    const previousObjectives = [...objectives];

    // 2. Optimistic Update (Instant)
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
      // 3. Perform Actual API Call
      await repo.updateKeyResult(objectiveId, krId, newStatus);
      // No need to refresh() if successful, we are already in sync visually
    } catch (e) {
      console.error("Toggle KR failed", e);
      // 4. Rollback on Error
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
