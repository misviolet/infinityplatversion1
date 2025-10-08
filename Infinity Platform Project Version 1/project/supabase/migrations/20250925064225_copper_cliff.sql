/*
  # Fix RLS policies for loop_tasks table

  1. Changes
    - Update RLS policies to allow public access instead of authenticated only
    - This resolves the RLS violation errors when using custom authentication

  2. Security Note
    - This change reduces security by allowing public access
    - Consider implementing proper Supabase authentication for production use
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view all loop tasks" ON loop_tasks;
DROP POLICY IF EXISTS "Users can insert loop tasks" ON loop_tasks;
DROP POLICY IF EXISTS "Users can update loop tasks" ON loop_tasks;

-- Create new policies with public access
CREATE POLICY "Public can view all loop tasks"
  ON loop_tasks
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can insert loop tasks"
  ON loop_tasks
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Public can update loop tasks"
  ON loop_tasks
  FOR UPDATE
  TO public
  USING (true);