import { create } from 'zustand';
import { BrandTask, TaskResponse } from '../types';
import { supabase } from '../config/supabase';
import { DEV_USER_ID } from '../config/constants';

interface TaskState {
  tasks: BrandTask[];
  loading: boolean;
  fetchTasks: () => Promise<void>;
  submitResponse: (taskId: string, response: Partial<TaskResponse>) => Promise<void>;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  loading: false,

  fetchTasks: async () => {
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from('brand_tasks')
        .select('*')
        .gte('active_to', new Date().toISOString());
      
      if (error) {
        console.error('Fetch tasks error:', error);
      } else {
        set({ tasks: data || [] });
      }
    } catch (err) {
      console.error('Unexpected task fetch error:', err);
    } finally {
      set({ loading: false });
    }
  },

  submitResponse: async (taskId: string, response: Partial<TaskResponse>) => {
    const { error } = await supabase
      .from('task_responses')
      .insert({
        user_id: DEV_USER_ID,
        task_id: taskId,
        ...response,
      });

    if (error) throw error;
  },
}));