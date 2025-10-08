/*
  # Add Loop Task Management Features with Role-Based Permissions

  1. Changes to loop_tasks table
    - Add `is_active` column (boolean) - Controls if task is active/deactivated
    - Add `deactivated_at` (timestamp) - When task was deactivated
    - Add `deactivated_by` (text) - Who deactivated the task
    - Add `last_reassigned_at` (timestamp) - When task was last reassigned
    - Add `last_reassigned_by` (text) - Who reassigned the task

  2. New Table: loop_task_audit_trail
    - Track all actions performed on loop tasks
    - Includes: creation, activation, deactivation, reassignment
    - Maintains complete history of who did what and when

  3. Security
    - RLS policies remain the same for loop_tasks
    - Add RLS policies for audit trail table

  4. Role Permissions (enforced at application level)
    - PC Role: Create, Activate, Deactivate, Reassign
    - Admin Role: Activate, Deactivate, Reassign (NO create)
    - MIS Role: Activate, Deactivate, Reassign (NO create)
*/

-- Add new columns to loop_tasks table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'loop_tasks' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE loop_tasks ADD COLUMN is_active boolean DEFAULT true NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'loop_tasks' AND column_name = 'deactivated_at'
  ) THEN
    ALTER TABLE loop_tasks ADD COLUMN deactivated_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'loop_tasks' AND column_name = 'deactivated_by'
  ) THEN
    ALTER TABLE loop_tasks ADD COLUMN deactivated_by text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'loop_tasks' AND column_name = 'last_reassigned_at'
  ) THEN
    ALTER TABLE loop_tasks ADD COLUMN last_reassigned_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'loop_tasks' AND column_name = 'last_reassigned_by'
  ) THEN
    ALTER TABLE loop_tasks ADD COLUMN last_reassigned_by text;
  END IF;
END $$;

-- Create audit trail table
CREATE TABLE IF NOT EXISTS loop_task_audit_trail (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES loop_tasks(id) ON DELETE CASCADE,
  action_type text NOT NULL CHECK (action_type IN ('created', 'activated', 'deactivated', 'reassigned', 'completed', 'status_changed')),
  performed_by text NOT NULL,
  performed_by_role text NOT NULL,
  previous_value jsonb,
  new_value jsonb,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Create index for faster audit trail queries
CREATE INDEX IF NOT EXISTS idx_audit_trail_task_id ON loop_task_audit_trail(task_id);
CREATE INDEX IF NOT EXISTS idx_audit_trail_created_at ON loop_task_audit_trail(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_trail_action_type ON loop_task_audit_trail(action_type);

-- Enable RLS on audit trail table
ALTER TABLE loop_task_audit_trail ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to view audit trails
CREATE POLICY "Allow anonymous read audit trail"
  ON loop_task_audit_trail
  FOR SELECT
  TO anon
  USING (true);

-- Allow authenticated users to view audit trails
CREATE POLICY "Allow authenticated read audit trail"
  ON loop_task_audit_trail
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert audit records
CREATE POLICY "Authenticated users can insert audit records"
  ON loop_task_audit_trail
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create function to automatically log audit trail on loop_tasks changes
CREATE OR REPLACE FUNCTION log_loop_task_audit()
RETURNS TRIGGER AS $$
BEGIN
  -- On INSERT (task creation)
  IF TG_OP = 'INSERT' THEN
    INSERT INTO loop_task_audit_trail (
      task_id,
      action_type,
      performed_by,
      performed_by_role,
      new_value
    ) VALUES (
      NEW.id,
      'created',
      NEW.created_by,
      'PC',
      jsonb_build_object(
        'task_name', NEW.task_name,
        'doer_name', NEW.doer_name,
        'priority', NEW.priority,
        'frequency', NEW.frequency
      )
    );
  END IF;

  -- On UPDATE
  IF TG_OP = 'UPDATE' THEN
    -- Track activation/deactivation
    IF OLD.is_active != NEW.is_active THEN
      INSERT INTO loop_task_audit_trail (
        task_id,
        action_type,
        performed_by,
        performed_by_role,
        previous_value,
        new_value
      ) VALUES (
        NEW.id,
        CASE WHEN NEW.is_active THEN 'activated' ELSE 'deactivated' END,
        COALESCE(NEW.deactivated_by, NEW.last_reassigned_by, NEW.created_by),
        'Unknown',
        jsonb_build_object('is_active', OLD.is_active),
        jsonb_build_object('is_active', NEW.is_active)
      );
    END IF;

    -- Track reassignment
    IF OLD.doer_name != NEW.doer_name THEN
      INSERT INTO loop_task_audit_trail (
        task_id,
        action_type,
        performed_by,
        performed_by_role,
        previous_value,
        new_value
      ) VALUES (
        NEW.id,
        'reassigned',
        COALESCE(NEW.last_reassigned_by, NEW.created_by),
        'Unknown',
        jsonb_build_object('doer_name', OLD.doer_name),
        jsonb_build_object('doer_name', NEW.doer_name)
      );
    END IF;

    -- Track status changes
    IF OLD.status != NEW.status THEN
      INSERT INTO loop_task_audit_trail (
        task_id,
        action_type,
        performed_by,
        performed_by_role,
        previous_value,
        new_value
      ) VALUES (
        NEW.id,
        CASE WHEN NEW.status = 'Completed' THEN 'completed' ELSE 'status_changed' END,
        COALESCE(NEW.last_reassigned_by, NEW.created_by),
        'Unknown',
        jsonb_build_object('status', OLD.status),
        jsonb_build_object('status', NEW.status)
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for audit logging
DROP TRIGGER IF EXISTS loop_task_audit_trigger ON loop_tasks;
CREATE TRIGGER loop_task_audit_trigger
  AFTER INSERT OR UPDATE ON loop_tasks
  FOR EACH ROW
  EXECUTE FUNCTION log_loop_task_audit();
