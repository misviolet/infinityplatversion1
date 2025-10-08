/*
  # Create flow processes and stages tables

  1. New Tables
    - `flow_processes`
      - `id` (uuid, primary key)
      - `name` (text, process name)
      - `description` (text, process description)
      - `created_by` (text, who created the process)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `flow_stages`
      - `id` (uuid, primary key)
      - `process_id` (uuid, references flow_processes.id)
      - `name` (text, stage name)
      - `description` (text, stage description)
      - `order_index` (integer, stage order)
      - `is_completed` (boolean, default false)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for public access (matching existing pattern)
*/

CREATE TABLE IF NOT EXISTS flow_processes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_by text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS flow_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  process_id uuid NOT NULL REFERENCES flow_processes(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  order_index integer NOT NULL,
  is_completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE flow_processes ENABLE ROW LEVEL SECURITY;
ALTER TABLE flow_stages ENABLE ROW LEVEL SECURITY;

-- Create policies with public access
CREATE POLICY "Public can view all flow processes"
  ON flow_processes
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can insert flow processes"
  ON flow_processes
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Public can update flow processes"
  ON flow_processes
  FOR UPDATE
  TO public
  USING (true);

CREATE POLICY "Public can delete flow processes"
  ON flow_processes
  FOR DELETE
  TO public
  USING (true);

CREATE POLICY "Public can view all flow stages"
  ON flow_stages
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can insert flow stages"
  ON flow_stages
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Public can update flow stages"
  ON flow_stages
  FOR UPDATE
  TO public
  USING (true);

CREATE POLICY "Public can delete flow stages"
  ON flow_stages
  FOR DELETE
  TO public
  USING (true);

-- Insert sample data
INSERT INTO flow_processes (name, description, created_by) VALUES
('Order to Delivery', 'Complete process from order placement to delivery', 'System'),
('Customer Onboarding', 'Process for onboarding new customers', 'System'),
('Product Development', 'End-to-end product development workflow', 'System');

-- Insert sample stages for Order to Delivery process
INSERT INTO flow_stages (process_id, name, description, order_index) 
SELECT 
  p.id,
  stage_name,
  stage_desc,
  stage_order
FROM flow_processes p,
(VALUES 
  ('Order Entry', 'Customer places order and payment processing', 1),
  ('Inventory Check', 'Verify product availability and reserve items', 2),
  ('Order Processing', 'Prepare order for fulfillment', 3),
  ('Packaging', 'Pack items securely for shipping', 4),
  ('Shipping', 'Dispatch order to customer', 5),
  ('Delivery', 'Final delivery to customer address', 6)
) AS stages(stage_name, stage_desc, stage_order)
WHERE p.name = 'Order to Delivery';

-- Insert sample stages for Customer Onboarding process
INSERT INTO flow_stages (process_id, name, description, order_index) 
SELECT 
  p.id,
  stage_name,
  stage_desc,
  stage_order
FROM flow_processes p,
(VALUES 
  ('Initial Contact', 'First interaction with potential customer', 1),
  ('Requirements Gathering', 'Understand customer needs and requirements', 2),
  ('Proposal Creation', 'Create and send proposal to customer', 3),
  ('Contract Negotiation', 'Negotiate terms and finalize contract', 4),
  ('Account Setup', 'Set up customer account and access', 5),
  ('Training & Support', 'Provide initial training and support', 6)
) AS stages(stage_name, stage_desc, stage_order)
WHERE p.name = 'Customer Onboarding';

-- Insert sample stages for Product Development process
INSERT INTO flow_stages (process_id, name, description, order_index) 
SELECT 
  p.id,
  stage_name,
  stage_desc,
  stage_order
FROM flow_processes p,
(VALUES 
  ('Ideation', 'Generate and evaluate product ideas', 1),
  ('Market Research', 'Research market demand and competition', 2),
  ('Design & Prototyping', 'Create product design and prototype', 3),
  ('Development', 'Build and develop the product', 4),
  ('Testing', 'Test product functionality and quality', 5),
  ('Launch', 'Release product to market', 6)
) AS stages(stage_name, stage_desc, stage_order)
WHERE p.name = 'Product Development';
