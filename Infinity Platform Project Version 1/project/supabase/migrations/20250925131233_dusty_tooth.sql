/*
  # Create workflow entries table for flow stages

  1. New Tables
    - `workflow_entries`
      - `id` (uuid, primary key)
      - `process_id` (uuid, references flow_processes.id)
      - `stage_id` (uuid, references flow_stages.id)
      - `entry_name` (text, name of the specific entry)
      - `entry_description` (text, description of the entry)
      - `assigned_to` (text, who is assigned to complete this entry)
      - `status` (text, Pending/In Progress/Completed/Blocked)
      - `priority` (text, Low/Medium/High/Critical)
      - `due_date` (date, when this entry should be completed)
      - `completed_at` (timestamp, when completed)
      - `completed_by` (text, who completed it)
      - `notes` (text, completion notes)
      - `created_at` (timestamp)
      - `created_by` (text, who created the entry)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on workflow_entries table
    - Add policies for public access
*/

CREATE TABLE IF NOT EXISTS workflow_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  process_id uuid NOT NULL REFERENCES flow_processes(id) ON DELETE CASCADE,
  stage_id uuid NOT NULL REFERENCES flow_stages(id) ON DELETE CASCADE,
  entry_name text NOT NULL,
  entry_description text,
  assigned_to text NOT NULL,
  status text DEFAULT 'Pending' CHECK (status IN ('Pending', 'In Progress', 'Completed', 'Blocked')),
  priority text DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Critical')),
  due_date date,
  completed_at timestamptz,
  completed_by text,
  notes text,
  created_at timestamptz DEFAULT now(),
  created_by text NOT NULL,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE workflow_entries ENABLE ROW LEVEL SECURITY;

-- Create policies with public access
CREATE POLICY "Public can view all workflow entries"
  ON workflow_entries
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can insert workflow entries"
  ON workflow_entries
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Public can update workflow entries"
  ON workflow_entries
  FOR UPDATE
  TO public
  USING (true);

CREATE POLICY "Public can delete workflow entries"
  ON workflow_entries
  FOR DELETE
  TO public
  USING (true);

-- Insert sample workflow entries for Order to Delivery process
INSERT INTO workflow_entries (process_id, stage_id, entry_name, entry_description, assigned_to, priority, due_date, created_by)
SELECT 
  p.id as process_id,
  s.id as stage_id,
  entry_data.entry_name,
  entry_data.entry_description,
  entry_data.assigned_to,
  entry_data.priority,
  CURRENT_DATE + INTERVAL '1 day' as due_date,
  'System' as created_by
FROM flow_processes p
JOIN flow_stages s ON s.process_id = p.id
CROSS JOIN (
  VALUES 
    ('Order #ORD-001', 'Customer order for laptop and accessories', 'John Smith', 'High'),
    ('Order #ORD-002', 'Bulk order for office supplies', 'Sarah Johnson', 'Medium'),
    ('Order #ORD-003', 'Rush order for presentation materials', 'Mike Davis', 'Critical'),
    ('Order #ORD-004', 'Regular monthly inventory restock', 'Lisa Wilson', 'Low'),
    ('Order #ORD-005', 'Special custom product order', 'David Brown', 'High')
) AS entry_data(entry_name, entry_description, assigned_to, priority)
WHERE p.name = 'Order to Delivery' AND s.name = 'Order Entry';

-- Insert sample entries for Inventory Check stage
INSERT INTO workflow_entries (process_id, stage_id, entry_name, entry_description, assigned_to, priority, due_date, created_by)
SELECT 
  p.id as process_id,
  s.id as stage_id,
  entry_data.entry_name,
  entry_data.entry_description,
  entry_data.assigned_to,
  entry_data.priority,
  CURRENT_DATE + INTERVAL '2 days' as due_date,
  'System' as created_by
FROM flow_processes p
JOIN flow_stages s ON s.process_id = p.id
CROSS JOIN (
  VALUES 
    ('Check Stock - ORD-001', 'Verify laptop and accessories availability', 'Warehouse Team', 'High'),
    ('Check Stock - ORD-002', 'Verify office supplies inventory', 'Warehouse Team', 'Medium'),
    ('Check Stock - ORD-003', 'Rush check for presentation materials', 'Warehouse Team', 'Critical')
) AS entry_data(entry_name, entry_description, assigned_to, priority)
WHERE p.name = 'Order to Delivery' AND s.name = 'Inventory Check';