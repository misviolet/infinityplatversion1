import { supabase, LoopTask } from '../lib/supabase';

export interface LoopTaskFormData {
  taskName: string;
  priority: 'Critical' | 'Non Critical';
  taskOwner: string;
  doerName: string;
  department: string;
  frequency: 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly' | 'Yearly';
  taskDescription: string;
  guidelineUrl?: string;
  category: 'Compliances Task - Internal' | 'Compliances Task - Client' | 'Internal Task - Non Client' | 'Client Task' | 'Product';
}

export interface LoopTaskCompletionData {
  taskId: string;
  comments: string;
  status: 'Completed' | 'Not Applicable' | 'Need Clarity' | 'Shifted';
  shiftedToDate?: string;
}

class LoopTaskService {
  // Calculate next due date based on frequency
  private calculateNextDueDate(frequency: string, startDate?: string, lastCompleted?: string): string {
    const baseDate = lastCompleted ? new Date(lastCompleted) : (startDate ? new Date(startDate) : new Date());
    const nextDate = new Date(baseDate);

    switch (frequency) {
      case 'Daily':
        nextDate.setDate(nextDate.getDate() + 1);
        break;
      case 'Weekly':
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case 'Monthly':
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case 'Quarterly':
        nextDate.setMonth(nextDate.getMonth() + 3);
        break;
      case 'Yearly':
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        break;
      default:
        nextDate.setDate(nextDate.getDate() + 1);
    }

    return nextDate.toISOString().split('T')[0];
  }

  async createLoopTask(taskData: LoopTaskFormData, createdBy: string): Promise<void> {
    try {
      const nextDueDate = this.calculateNextDueDate(taskData.frequency, taskData.startDate);

      const { error } = await supabase
        .from('loop_tasks')
        .insert({
          task_name: taskData.taskName,
          priority: taskData.priority,
          task_owner: taskData.taskOwner,
          doer_name: taskData.doerName,
          department: taskData.department,
          frequency: taskData.frequency,
          task_description: taskData.taskDescription,
          guideline_url: taskData.guidelineUrl,
          category: taskData.category,
          created_by: createdBy,
          status: 'Pending',
          next_due_date: nextDueDate
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error creating loop task:', error);
      throw error;
    }
  }

  async getLoopTasks(): Promise<LoopTask[]> {
    try {
      const { data, error } = await supabase
        .from('loop_tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching loop tasks:', error);
      throw error;
    }
  }

  async getLoopTasksForUser(userName: string): Promise<LoopTask[]> {
    try {
      const { data, error } = await supabase
        .from('loop_tasks')
        .select('*')
        .eq('doer_name', userName)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching user loop tasks:', error);
      throw error;
    }
  }

  async completeLoopTask(completionData: LoopTaskCompletionData): Promise<void> {
    try {
      const updateData: any = {
        status: completionData.status,
        comments: completionData.comments,
        completed_at: new Date().toISOString()
      };

      if (completionData.status === 'Shifted' && completionData.shiftedToDate) {
        updateData.shifted_to_date = completionData.shiftedToDate;
      }

      // If task is completed, update last completed date and calculate next due date
      if (completionData.status === 'Completed') {
        updateData.last_completed_date = new Date().toISOString().split('T')[0];
        
        // Get the task to calculate next due date
        const { data: task, error: fetchError } = await supabase
          .from('loop_tasks')
          .select('frequency')
          .eq('id', completionData.taskId)
          .single();

        if (fetchError) throw fetchError;

        if (task) {
          updateData.next_due_date = this.calculateNextDueDate(task.frequency, undefined, updateData.last_completed_date);
          updateData.status = 'Pending'; // Reset to pending for next cycle
        }
      }

      const { error } = await supabase
        .from('loop_tasks')
        .update(updateData)
        .eq('id', completionData.taskId);

      if (error) throw error;

      // If task is shifted, create a new task with the new date
      if (completionData.status === 'Shifted' && completionData.shiftedToDate) {
        const { data: originalTask, error: fetchError } = await supabase
          .from('loop_tasks')
          .select('*')
          .eq('id', completionData.taskId)
          .single();

        if (fetchError) throw fetchError;

        if (originalTask) {
          const { error: insertError } = await supabase
            .from('loop_tasks')
            .insert({
              task_name: originalTask.task_name,
              priority: originalTask.priority,
              task_owner: originalTask.task_owner,
              doer_name: originalTask.doer_name,
              department: originalTask.department,
              frequency: originalTask.frequency,
              task_description: originalTask.task_description,
              guideline_url: originalTask.guideline_url,
              category: originalTask.category,
              created_by: originalTask.created_by,
              status: 'Pending',
              next_due_date: completionData.shiftedToDate
            });

          if (insertError) throw insertError;
        }
      }
    } catch (error) {
      console.error('Error completing loop task:', error);
      throw error;
    }
  }

  // Get departments list (you can expand this based on your needs)
  getDepartments(): string[] {
    return [
      'Human Resources',
      'Finance',
      'Operations',
      'Marketing',
      'Sales',
      'IT',
      'Legal',
      'Compliance',
      'Customer Service',
      'Product Development'
    ];
  }
}

export const loopTaskService = new LoopTaskService();