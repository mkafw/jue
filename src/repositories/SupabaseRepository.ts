import { Question, Objective, Failure, IRepository, KeyResult } from '../types';
import { supabase } from '../lib/supabase';

export const SupabaseRepository: IRepository = {
  // Questions
  getQuestions: async (): Promise<Question[]> => {
    if (!supabase) throw new Error("Supabase not initialized");
    const { data, error } = await supabase.from('questions').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data as Question[];
  },
  
  addQuestion: async (question: Question): Promise<Question> => {
    if (!supabase) throw new Error("Supabase not initialized");
    const { data, error } = await supabase.from('questions').insert(question).select().single();
    if (error) throw error;
    return data as Question;
  },

  deleteQuestion: async (id: string): Promise<boolean> => {
    if (!supabase) throw new Error("Supabase not initialized");
    const { error } = await supabase.from('questions').delete().eq('id', id);
    if (error) {
      console.error("Supabase delete failed", error);
      return false;
    }
    return true;
  },

  // Failures
  getFailures: async (): Promise<Failure[]> => {
    if (!supabase) throw new Error("Supabase not initialized");
    const { data, error } = await supabase.from('failures').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data as Failure[];
  },

  addFailure: async (failure: Failure): Promise<Failure> => {
    if (!supabase) throw new Error("Supabase not initialized");
    const { data, error } = await supabase.from('failures').insert(failure).select().single();
    if (error) throw error;
    return data as Failure;
  },

  updateFailure: async (id: string, updates: Partial<Failure>): Promise<Failure | null> => {
    if (!supabase) throw new Error("Supabase not initialized");
    const { data, error } = await supabase.from('failures').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data as Failure;
  },

  findFailure: async (id: string): Promise<Failure | undefined> => {
    if (!supabase) throw new Error("Supabase not initialized");
    const { data } = await supabase.from('failures').select('*').eq('id', id).single();
    return data as Failure;
  },

  // Objectives
  getObjectives: async (): Promise<Objective[]> => {
    if (!supabase) throw new Error("Supabase not initialized");
    const { data, error } = await supabase.from('objectives').select('*, key_results(*)').order('created_at', { ascending: false });
    if (error) throw error;
    
    return data.map((obj: any) => ({
      ...obj,
      keyResults: obj.key_results || []
    })) as Objective[];
  },

  addObjective: async (objective: Objective): Promise<Objective> => {
    if (!supabase) throw new Error("Supabase not initialized");
    
    const { keyResults, ...objData } = objective;
    const { data: obj, error: objError } = await supabase.from('objectives').insert(objData).select().single();
    
    if (objError) throw objError;

    if (keyResults && keyResults.length > 0) {
       const krsWithId = keyResults.map(kr => ({ ...kr, objective_id: obj.id }));
       const { error: krError } = await supabase.from('key_results').insert(krsWithId);
       if (krError) console.error("Failed to insert Key Results", krError);
    }

    return { ...obj, keyResults: keyResults || [] } as Objective;
  },

  deleteObjective: async (id: string): Promise<boolean> => {
    if (!supabase) throw new Error("Supabase not initialized");
    const { error } = await supabase.from('objectives').delete().eq('id', id);
    if (error) {
       console.error("Supabase delete failed", error);
       return false;
    }
    return true;
  },

  updateKeyResult: async (objectiveId: string, krId: string, status: KeyResult['status']): Promise<void> => {
    if (!supabase) throw new Error("Supabase not initialized");
    const { error } = await supabase.from('key_results').update({ status }).eq('id', krId);
    if (error) console.error("Failed to update KR", error);
  }
};
