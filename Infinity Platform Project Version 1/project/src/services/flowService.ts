import { supabase, FlowProcess, FlowStage } from '../lib/supabase';

export interface FlowProcessFormData {
  name: string;
  description?: string;
}

export interface FlowStageFormData {
  name: string;
  description?: string;
  order_index: number;
  who_responsible?: string;
  how_completion?: string;
  when_duration?: string;
}

class FlowService {
  async getProcesses(): Promise<FlowProcess[]> {
    try {
      const { data, error } = await supabase
        .from('flow_processes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching flow processes:', error);
      throw error;
    }
  }

  async getStagesByProcessId(processId: string): Promise<FlowStage[]> {
    try {
      const { data, error } = await supabase
        .from('flow_stages')
        .select('*')
        .eq('process_id', processId)
        .order('order_index', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching flow stages:', error);
      throw error;
    }
  }

  async createProcess(processData: FlowProcessFormData, createdBy: string): Promise<FlowProcess> {
    try {
      const { data, error } = await supabase
        .from('flow_processes')
        .insert({
          name: processData.name,
          description: processData.description,
          created_by: createdBy
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating flow process:', error);
      throw error;
    }
  }

  async createStage(processId: string, stageData: FlowStageFormData): Promise<FlowStage> {
    try {
      const { data, error } = await supabase
        .from('flow_stages')
        .insert({
          process_id: processId,
          name: stageData.name,
          description: stageData.description,
          order_index: stageData.order_index,
          who_responsible: stageData.who_responsible,
          how_completion: stageData.how_completion,
          when_duration: stageData.when_duration
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating flow stage:', error);
      throw error;
    }
  }

  async updateStageCompletion(stageId: string, isCompleted: boolean): Promise<void> {
    try {
      const { error } = await supabase
        .from('flow_stages')
        .update({ 
          is_completed: isCompleted,
          updated_at: new Date().toISOString()
        })
        .eq('id', stageId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating stage completion:', error);
      throw error;
    }
  }

  async getWorkflowEntries(processId: string, stageId?: string): Promise<WorkflowEntry[]> {
    try {
      let query = supabase
        .from('workflow_entries')
        .select('*')
        .eq('process_id', processId);

      if (stageId) {
        query = query.eq('stage_id', stageId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching workflow entries:', error);
      throw error;
    }
  }

  async createWorkflowEntry(
    processId: string, 
    stageId: string, 
    entryData: WorkflowEntryFormData, 
    createdBy: string
  ): Promise<WorkflowEntry> {
    try {
      const { data, error } = await supabase
        .from('workflow_entries')
        .insert({
          process_id: processId,
          stage_id: stageId,
          entry_name: entryData.entry_name,
          entry_description: entryData.entry_description,
          assigned_to: entryData.assigned_to,
          priority: entryData.priority,
          due_date: entryData.due_date,
          created_by: createdBy
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating workflow entry:', error);
      throw error;
    }
  }

  async updateWorkflowEntryStatus(
    entryId: string, 
    status: 'Pending' | 'In Progress' | 'Completed' | 'Blocked',
    completedBy?: string,
    notes?: string
  ): Promise<void> {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      if (status === 'Completed') {
        updateData.completed_at = new Date().toISOString();
        updateData.completed_by = completedBy;
        updateData.notes = notes;
      }

      const { error } = await supabase
        .from('workflow_entries')
        .update(updateData)
        .eq('id', entryId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating workflow entry status:', error);
      throw error;
    }
  }

  async checkStageCompletion(processId: string, stageId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('workflow_entries')
        .select('status')
        .eq('process_id', processId)
        .eq('stage_id', stageId);

      if (error) throw error;
      
      if (!data || data.length === 0) return true; // No entries means stage can be considered complete
      
      // Check if all entries are completed
      return data.every(entry => entry.status === 'Completed');
    } catch (error) {
      console.error('Error checking stage completion:', error);
      throw error;
    }
  }

  async deleteProcess(processId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('flow_processes')
        .delete()
        .eq('id', processId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting flow process:', error);
      throw error;
    }
  }

  async deleteStage(stageId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('flow_stages')
        .delete()
        .eq('id', stageId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting flow stage:', error);
      throw error;
    }
  }
}

export const flowService = new FlowService();