/*
  # Add What/Who/How/When parameters to flow stages

  1. Changes
    - Add `who_responsible` column for person/department
    - Add `how_completion` column for form/process details
    - Add `when_duration` column for time estimation
    - Update existing stages with sample data

  2. Security
    - Maintain existing RLS policies
*/

-- Add new columns to flow_stages table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'flow_stages' AND column_name = 'who_responsible'
  ) THEN
    ALTER TABLE flow_stages ADD COLUMN who_responsible text;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'flow_stages' AND column_name = 'how_completion'
  ) THEN
    ALTER TABLE flow_stages ADD COLUMN how_completion text;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'flow_stages' AND column_name = 'when_duration'
  ) THEN
    ALTER TABLE flow_stages ADD COLUMN when_duration text;
  END IF;
END $$;

-- Update existing stages with sample data for Order to Delivery process
UPDATE flow_stages 
SET 
  who_responsible = CASE 
    WHEN name = 'Order Entry' THEN 'Sales Team'
    WHEN name = 'Inventory Check' THEN 'Warehouse Manager'
    WHEN name = 'Order Processing' THEN 'Operations Team'
    WHEN name = 'Packaging' THEN 'Fulfillment Team'
    WHEN name = 'Shipping' THEN 'Logistics Team'
    WHEN name = 'Delivery' THEN 'Delivery Partner'
    ELSE who_responsible
  END,
  how_completion = CASE 
    WHEN name = 'Order Entry' THEN 'Order Form + Payment Processing'
    WHEN name = 'Inventory Check' THEN 'Inventory Management System'
    WHEN name = 'Order Processing' THEN 'Order Processing Checklist'
    WHEN name = 'Packaging' THEN 'Packaging Guidelines Form'
    WHEN name = 'Shipping' THEN 'Shipping Label Generation'
    WHEN name = 'Delivery' THEN 'Delivery Confirmation Form'
    ELSE how_completion
  END,
  when_duration = CASE 
    WHEN name = 'Order Entry' THEN '15 minutes'
    WHEN name = 'Inventory Check' THEN '30 minutes'
    WHEN name = 'Order Processing' THEN '2 hours'
    WHEN name = 'Packaging' THEN '1 hour'
    WHEN name = 'Shipping' THEN '4 hours'
    WHEN name = 'Delivery' THEN '1-3 days'
    ELSE when_duration
  END
WHERE process_id IN (
  SELECT id FROM flow_processes WHERE name = 'Order to Delivery'
);

-- Update existing stages with sample data for Customer Onboarding process
UPDATE flow_stages 
SET 
  who_responsible = CASE 
    WHEN name = 'Initial Contact' THEN 'Sales Representative'
    WHEN name = 'Requirements Gathering' THEN 'Business Analyst'
    WHEN name = 'Proposal Creation' THEN 'Sales Manager'
    WHEN name = 'Contract Negotiation' THEN 'Legal Team'
    WHEN name = 'Account Setup' THEN 'IT Team'
    WHEN name = 'Training & Support' THEN 'Customer Success Team'
    ELSE who_responsible
  END,
  how_completion = CASE 
    WHEN name = 'Initial Contact' THEN 'Contact Information Form'
    WHEN name = 'Requirements Gathering' THEN 'Requirements Analysis Document'
    WHEN name = 'Proposal Creation' THEN 'Proposal Template'
    WHEN name = 'Contract Negotiation' THEN 'Contract Review Process'
    WHEN name = 'Account Setup' THEN 'Account Setup Checklist'
    WHEN name = 'Training & Support' THEN 'Training Completion Form'
    ELSE how_completion
  END,
  when_duration = CASE 
    WHEN name = 'Initial Contact' THEN '30 minutes'
    WHEN name = 'Requirements Gathering' THEN '2-4 hours'
    WHEN name = 'Proposal Creation' THEN '1-2 days'
    WHEN name = 'Contract Negotiation' THEN '3-7 days'
    WHEN name = 'Account Setup' THEN '2-4 hours'
    WHEN name = 'Training & Support' THEN '1-2 weeks'
    ELSE when_duration
  END
WHERE process_id IN (
  SELECT id FROM flow_processes WHERE name = 'Customer Onboarding'
);

-- Update existing stages with sample data for Product Development process
UPDATE flow_stages 
SET 
  who_responsible = CASE 
    WHEN name = 'Ideation' THEN 'Product Manager'
    WHEN name = 'Market Research' THEN 'Marketing Team'
    WHEN name = 'Design & Prototyping' THEN 'Design Team'
    WHEN name = 'Development' THEN 'Engineering Team'
    WHEN name = 'Testing' THEN 'QA Team'
    WHEN name = 'Launch' THEN 'Product Marketing'
    ELSE who_responsible
  END,
  how_completion = CASE 
    WHEN name = 'Ideation' THEN 'Idea Evaluation Form'
    WHEN name = 'Market Research' THEN 'Market Analysis Report'
    WHEN name = 'Design & Prototyping' THEN 'Design Review Checklist'
    WHEN name = 'Development' THEN 'Development Milestone Form'
    WHEN name = 'Testing' THEN 'QA Testing Report'
    WHEN name = 'Launch' THEN 'Launch Readiness Checklist'
    ELSE how_completion
  END,
  when_duration = CASE 
    WHEN name = 'Ideation' THEN '1-2 weeks'
    WHEN name = 'Market Research' THEN '2-4 weeks'
    WHEN name = 'Design & Prototyping' THEN '4-6 weeks'
    WHEN name = 'Development' THEN '8-12 weeks'
    WHEN name = 'Testing' THEN '2-4 weeks'
    WHEN name = 'Launch' THEN '1-2 weeks'
    ELSE when_duration
  END
WHERE process_id IN (
  SELECT id FROM flow_processes WHERE name = 'Product Development'
);