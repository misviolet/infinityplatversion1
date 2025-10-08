import { supabase, LoopTask, LoopTaskAuditTrail } from '../lib/supabase';
import { rolePermissionService } from './rolePermissions';

export interface ReassignTaskData {
  taskId: string;
  newDoerName: string;
  performedBy: string;
  performedByRole: string;
  notes?: string;
}

export interface ToggleTaskStatusData {
  taskId: string;
  isActive: boolean;
  performedBy: string;
  performedByRole: string;
  notes?: string;
}

class LoopTaskManagementService {
  async activateTask(data: ToggleTaskStatusData): Promise<void> {
    if (!rolePermissionService.canPerformAction(data.performedByRole, 'canActivateLoopTasks')) {
      throw new Error(`Role ${data.performedByRole} does not have permission to activate loop tasks`);
    }

    try {
      const { error } = await supabase
        .from('loop_tasks')
        .update({
          is_active: true,
          deactivated_at: null,
          deactivated_by: null,
        })
        .eq('id', data.taskId);

      if (error) throw error;

      await this.logAudit({
        taskId: data.taskId,
        actionType: 'activated',
        performedBy: data.performedBy,
        performedByRole: data.performedByRole,
        newValue: { is_active: true },
        notes: data.notes,
      });
    } catch (error) {
      console.error('Error activating loop task:', error);
      throw error;
    }
  }

  async deactivateTask(data: ToggleTaskStatusData): Promise<void> {
    if (!rolePermissionService.canPerformAction(data.performedByRole, 'canDeactivateLoopTasks')) {
      throw new Error(`Role ${data.performedByRole} does not have permission to deactivate loop tasks`);
    }

    try {
      const { error } = await supabase
        .from('loop_tasks')
        .update({
          is_active: false,
          deactivated_at: new Date().toISOString(),
          deactivated_by: data.performedBy,
        })
        .eq('id', data.taskId);

      if (error) throw error;

      await this.logAudit({
        taskId: data.taskId,
        actionType: 'deactivated',
        performedBy: data.performedBy,
        performedByRole: data.performedByRole,
        newValue: { is_active: false },
        notes: data.notes,
      });
    } catch (error) {
      console.error('Error deactivating loop task:', error);
      throw error;
    }
  }

  async reassignTask(data: ReassignTaskData): Promise<void> {
    if (!rolePermissionService.canPerformAction(data.performedByRole, 'canReassignLoopTasks')) {
      throw new Error(`Role ${data.performedByRole} does not have permission to reassign loop tasks`);
    }

    try {
      const { data: currentTask, error: fetchError } = await supabase
        .from('loop_tasks')
        .select('doer_name')
        .eq('id', data.taskId)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (!currentTask) {
        throw new Error('Task not found');
      }

      const { error } = await supabase
        .from('loop_tasks')
        .update({
          doer_name: data.newDoerName,
          last_reassigned_at: new Date().toISOString(),
          last_reassigned_by: data.performedBy,
        })
        .eq('id', data.taskId);

      if (error) throw error;

      await this.logAudit({
        taskId: data.taskId,
        actionType: 'reassigned',
        performedBy: data.performedBy,
        performedByRole: data.performedByRole,
        previousValue: { doer_name: currentTask.doer_name },
        newValue: { doer_name: data.newDoerName },
        notes: data.notes,
      });
    } catch (error) {
      console.error('Error reassigning loop task:', error);
      throw error;
    }
  }

  async getTaskAuditTrail(taskId: string): Promise<LoopTaskAuditTrail[]> {
    try {
      const { data, error } = await supabase
        .from('loop_task_audit_trail')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching audit trail:', error);
      throw error;
    }
  }

  async getAllAuditTrails(limit: number = 100): Promise<LoopTaskAuditTrail[]> {
    try {
      const { data, error } = await supabase
        .from('loop_task_audit_trail')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching all audit trails:', error);
      throw error;
    }
  }

  async getActiveLoopTasks(): Promise<LoopTask[]> {
    try {
      const { data, error } = await supabase
        .from('loop_tasks')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching active loop tasks:', error);
      throw error;
    }
  }

  async getInactiveLoopTasks(): Promise<LoopTask[]> {
    try {
      const { data, error } = await supabase
        .from('loop_tasks')
        .select('*')
        .eq('is_active', false)
        .order('deactivated_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching inactive loop tasks:', error);
      throw error;
    }
  }

  async getAllLoopTasks(): Promise<LoopTask[]> {
    try {
      const { data, error } = await supabase
        .from('loop_tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching all loop tasks:', error);
      throw error;
    }
  }

  private async logAudit(params: {
    taskId: string;
    actionType: LoopTaskAuditTrail['action_type'];
    performedBy: string;
    performedByRole: string;
    previousValue?: Record<string, any>;
    newValue?: Record<string, any>;
    notes?: string;
  }): Promise<void> {
    try {
      const { error } = await supabase
        .from('loop_task_audit_trail')
        .insert({
          task_id: params.taskId,
          action_type: params.actionType,
          performed_by: params.performedBy,
          performed_by_role: params.performedByRole,
          previous_value: params.previousValue || null,
          new_value: params.newValue || null,
          notes: params.notes || null,
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error logging audit trail:', error);
      throw error;
    }
  }

  getActionLabel(actionType: LoopTaskAuditTrail['action_type']): string {
    switch (actionType) {
      case 'created':
        return 'Task Created';
      case 'activated':
        return 'Task Activated';
      case 'deactivated':
        return 'Task Deactivated';
      case 'reassigned':
        return 'Task Reassigned';
      case 'completed':
        return 'Task Completed';
      case 'status_changed':
        return 'Status Changed';
      default:
        return actionType;
    }
  }

  getActionColor(actionType: LoopTaskAuditTrail['action_type']): string {
    switch (actionType) {
      case 'created':
        return 'text-blue-600 bg-blue-100';
      case 'activated':
        return 'text-green-600 bg-green-100';
      case 'deactivated':
        return 'text-red-600 bg-red-100';
      case 'reassigned':
        return 'text-orange-600 bg-orange-100';
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'status_changed':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  }
}

export const loopTaskManagementService = new LoopTaskManagementService();
