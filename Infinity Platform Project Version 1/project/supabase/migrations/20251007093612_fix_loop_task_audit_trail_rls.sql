/*
  # Fix RLS Policy for Loop Task Audit Trail
  
  1. Changes
    - Add policy to allow anonymous users to insert audit trail records
    - This enables the app to log audit records when using the anon key
  
  2. Security
    - Maintains read access for both anonymous and authenticated users
    - Allows both anonymous and authenticated users to create audit records
*/

-- Drop existing authenticated-only insert policy
DROP POLICY IF EXISTS "Authenticated users can insert audit records" ON loop_task_audit_trail;

-- Create new policy that allows both anonymous and authenticated users to insert
CREATE POLICY "Public can insert audit records"
  ON loop_task_audit_trail
  FOR INSERT
  TO public
  WITH CHECK (true);
