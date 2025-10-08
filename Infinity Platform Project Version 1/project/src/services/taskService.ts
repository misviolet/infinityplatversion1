import { supabase, Task } from '../lib/supabase';

export interface TaskFormData {
  stakeHolderName: string;
  doerName: string;
  priority: 'Low' | 'Medium' | 'High';
  task: string;
  expectedCompletionDate: string;
  supportDocumentRequired: boolean;
  taskDescription: string;
  supportingDocumentUrl?: string;
}

export interface TaskCompletionData {
  taskId: string;
  comments: string;
  status: 'Completed' | 'Not Applicable' | 'Need Clarity' | 'Shifted';
  shiftedToDate?: string;
  supportDocumentUrl?: string;
}

class TaskService {
  async createTask(taskData: TaskFormData, delegatedBy: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('tasks')
        .insert({
          stake_holder_name: taskData.stakeHolderName,
          doer_name: taskData.doerName,
          priority: taskData.priority,
          task: taskData.task,
          expected_completion_date: taskData.expectedCompletionDate,
          support_document_required: taskData.supportDocumentRequired,
          task_description: taskData.taskDescription,
          supporting_document_url: taskData.supportingDocumentUrl,
          delegated_by: delegatedBy,
          status: 'Pending'
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  }

  async getTasks(): Promise<Task[]> {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching tasks:', error);
      throw error;
    }
  }

  async getTasksForUser(userName: string): Promise<Task[]> {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('doer_name', userName)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching user tasks:', error);
      throw error;
    }
  }

  async completeTask(completionData: TaskCompletionData): Promise<void> {
    try {
      const updateData: any = {
        status: completionData.status,
        comments: completionData.comments,
        completed_at: new Date().toISOString()
      };

      if (completionData.status === 'Shifted' && completionData.shiftedToDate) {
        updateData.shifted_to_date = completionData.shiftedToDate;
      }

      if (completionData.supportDocumentUrl) {
        updateData.supporting_document_url = completionData.supportDocumentUrl;
      }

      const { error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', completionData.taskId);

      if (error) throw error;

      // If task is shifted, create a new task with the new date
      if (completionData.status === 'Shifted' && completionData.shiftedToDate) {
        const { data: originalTask, error: fetchError } = await supabase
          .from('tasks')
          .select('*')
          .eq('id', completionData.taskId)
          .single();

        if (fetchError) throw fetchError;

        if (originalTask) {
          const { error: insertError } = await supabase
            .from('tasks')
            .insert({
              stake_holder_name: originalTask.stake_holder_name,
              doer_name: originalTask.doer_name,
              priority: originalTask.priority,
              task: originalTask.task,
              expected_completion_date: completionData.shiftedToDate,
              support_document_required: originalTask.support_document_required,
              task_description: originalTask.task_description,
              supporting_document_url: originalTask.supporting_document_url,
              delegated_by: originalTask.delegated_by,
              status: 'Pending'
            });

          if (insertError) throw insertError;
        }
      }
    } catch (error) {
      console.error('Error completing task:', error);
      throw error;
    }
  }
}

export const taskService = new TaskService();