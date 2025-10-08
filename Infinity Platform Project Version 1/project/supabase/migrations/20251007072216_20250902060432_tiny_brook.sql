/*
  # Create tasks table for delegation system

  1. New Tables
    - `tasks`
      - `id` (uuid, primary key)
      - `stake_holder_name` (text, references login.Name)
      - `doer_name` (text, references login.Name)
      - `priority` (text, Low/Medium/High)
      - `task` (text, task name)
      - `expected_completion_date` (date)
      - `support_document_required` (boolean, default true)
      - `task_description` (text)
      - `supporting_document_url` (text, optional)
      - `status` (text, default 'Pending')
      - `comments` (text, optional)
      - `created_at` (timestamp)
      - `completed_at` (timestamp, optional)
      - `delegated_by` (text, who created the task)

  2. Security
    - Enable RLS on `tasks` table
    - Add policies for authenticated users to manage tasks
*/

CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stake_holder_name text NOT NULL,
  doer_name text NOT NULL,
  priority text NOT NULL CHECK (priority IN ('Low', 'Medium', 'High')),
  task text NOT NULL,
  expected_completion_date date NOT NULL,
  support_document_required boolean DEFAULT true,
  task_description text NOT NULL,
  supporting_document_url text,
  status text DEFAULT 'Pending' CHECK (status IN ('Pending', 'Completed', 'Not Applicable', 'Need Clarity', 'Shifted')),
  comments text,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  delegated_by text NOT NULL,
  shifted_to_date date
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all tasks"
  ON tasks
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert tasks"
  ON tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update tasks"
  ON tasks
  FOR UPDATE
  TO authenticated
  USING (true);
