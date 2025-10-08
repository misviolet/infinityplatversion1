import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please check your .env file.')
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing')
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Set' : 'Missing')
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
)

export interface LoginUser {
  id: number;
  name: string;
  user_name: string;
  password: string;
  role: string;
}

export interface Task {
  id: string;
  stake_holder_name: string;
  doer_name: string;
  priority: 'Low' | 'Medium' | 'High';
  task: string;
  expected_completion_date: string;
  support_document_required: boolean;
  task_description: string;
  supporting_document_url?: string;
  status: 'Pending' | 'Completed' | 'Not Applicable' | 'Need Clarity' | 'Shifted';
  comments?: string;
  created_at: string;
  completed_at?: string;
  delegated_by: string;
  shifted_to_date?: string;
}

export interface LoopTask {
  id: string;
  task_name: string;
  priority: 'Critical' | 'Non Critical';
  task_owner: string;
  doer_name: string;
  department: string;
  frequency: 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly' | 'Yearly';
  task_description: string;
  guideline_url?: string;
  category: 'Compliances Task - Internal' | 'Compliances Task - Client' | 'Internal Task - Non Client' | 'Client Task' | 'Product';
  status: 'Pending' | 'Completed' | 'Not Applicable' | 'Need Clarity' | 'Shifted';
  comments?: string;
  created_at: string;
  completed_at?: string;
  created_by: string;
  next_due_date?: string;
  last_completed_date?: string;
  shifted_to_date?: string;
  is_active: boolean;
  deactivated_at?: string;
  deactivated_by?: string;
  last_reassigned_at?: string;
  last_reassigned_by?: string;
}

export interface LoopTaskAuditTrail {
  id: string;
  task_id: string;
  action_type: 'created' | 'activated' | 'deactivated' | 'reassigned' | 'completed' | 'status_changed';
  performed_by: string;
  performed_by_role: string;
  previous_value?: Record<string, any>;
  new_value?: Record<string, any>;
  notes?: string;
  created_at: string;
}

export interface FlowProcess {
  id: string;
  name: string;
  description?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface FlowStage {
  id: string;
  process_id: string;
  name: string;
  description?: string;
  order_index: number;
  is_completed: boolean;
  who_responsible?: string;
  how_completion?: string;
  when_duration?: string;
  created_at: string;
  updated_at: string;
}

export interface WorkflowEntry {
  id: string;
  process_id: string;
  stage_id: string;
  entry_name: string;
  entry_description?: string;
  assigned_to: string;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Blocked';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  due_date?: string;
  completed_at?: string;
  completed_by?: string;
  notes?: string;
  created_at: string;
  created_by: string;
  updated_at: string;
}