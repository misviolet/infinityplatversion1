/*
  # Create loop_tasks table for Infinity Loop module

  1. New Tables
    - `loop_tasks`
      - `id` (uuid, primary key)
      - `task_name` (text, task name)
      - `priority` (text, Critical/Non Critical)
      - `task_owner` (text, references login.Name)
      - `doer_name` (text, references login.Name)
      - `department` (text, department name)
      - `frequency` (text, Daily/Weekly/Monthly/Quarterly/Yearly)
      - `task_description` (text)
      - `guideline_url` (text, optional)
      - `category` (text, task category)
      - `status` (text, default 'Pending')
      - `comments` (text, optional)
      - `created_at` (timestamp)
      - `completed_at` (timestamp, optional)
      - `created_by` (text, who created the task)
      - `next_due_date` (date, calculated based on frequency)
      - `last_completed_date` (date, optional)

  2. Security
    - Enable RLS on `loop_tasks` table
    - Add policies for authenticated users to manage loop tasks
*/

CREATE TABLE IF NOT EXISTS loop_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_name text NOT NULL,
  priority text NOT NULL CHECK (priority IN ('Critical', 'Non Critical')),
  task_owner text NOT NULL,
  doer_name text NOT NULL,
  department text NOT NULL,
  frequency text NOT NULL CHECK (frequency IN ('Daily', 'Weekly', 'Monthly', 'Quarterly', 'Yearly')),
  task_description text NOT NULL,
  guideline_url text,
  category text NOT NULL CHECK (category IN ('Compliances Task - Internal', 'Compliances Task - Client', 'Internal Task - Non Client', 'Client Task', 'Product')),
  status text DEFAULT 'Pending' CHECK (status IN ('Pending', 'Completed', 'Not Applicable', 'Need Clarity', 'Shifted')),
  comments text,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  created_by text NOT NULL,
  next_due_date date,
  last_completed_date date,
  shifted_to_date date
);

ALTER TABLE loop_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all loop tasks"
  ON loop_tasks
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert loop tasks"
  ON loop_tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update loop tasks"
  ON loop_tasks
  FOR UPDATE
  TO authenticated
  USING (true);
