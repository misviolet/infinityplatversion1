/*
  # Fix login RLS policies and add users with department

  1. Changes
    - Drop existing RLS policies
    - Add `department` column to `login` table
    - Change `id` to serial (integer with auto-increment)
    - Create new RLS policy that allows anonymous access for SELECT (needed for login)
    - Populate table with initial users

  2. Users Added
    - admin (Admin department, admin role)
    - paresh (Director department, MIS role)
    - komal (Director department, PC role)
    - anjali (PC department, PC role)
    - paresh@mail.com (Doer department, Admin role)
    - nirman (Doer department, Doer role)

  3. Important Notes
    - Anonymous users can SELECT from login table (required for authentication)
    - Only authenticated users can INSERT or UPDATE
    - Passwords are stored in plain text (should be hashed in production)
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read login data" ON login;
DROP POLICY IF EXISTS "Users can insert login data" ON login;
DROP POLICY IF EXISTS "Users can update their own login data" ON login;
DROP POLICY IF EXISTS "Allow anonymous read for login" ON login;
DROP POLICY IF EXISTS "Allow authenticated read" ON login;
DROP POLICY IF EXISTS "Authenticated users can insert" ON login;
DROP POLICY IF EXISTS "Authenticated users can update" ON login;

-- Drop and recreate table with integer ID and department
DROP TABLE IF EXISTS login CASCADE;

CREATE TABLE login (
  id serial PRIMARY KEY,
  user_name text UNIQUE NOT NULL,
  password text NOT NULL,
  name text NOT NULL,
  role text DEFAULT 'User',
  department text DEFAULT 'General',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Insert users
INSERT INTO login (id, name, user_name, password, role, department) VALUES
(1, 'adminDoer', 'admin', 'admin123', 'admin', 'Admin'),
(2, 'Paresh Kasare', 'paresh', 'paresh123', 'MIS', 'Director'),
(3, 'Komal Shukla', 'komal', 'komal123', 'PC', 'Director'),
(4, 'Anjali Yadav', 'anjali', 'anjali123', 'PC', 'PC'),
(5, 'Paresh Kasare', 'paresh@mail.com', 'paresh123', 'Admin', 'Doer'),
(6, 'Nirman Dave', 'nirman', 'nirmanh123', 'Doer', 'Doer');

-- Reset sequence
SELECT setval('login_id_seq', 6, true);

-- Enable RLS
ALTER TABLE login ENABLE ROW LEVEL SECURITY;

-- Create policy that allows ANONYMOUS users to SELECT (needed for login validation)
CREATE POLICY "Allow anonymous read for login"
  ON login
  FOR SELECT
  TO anon
  USING (true);

-- Create policy that allows AUTHENTICATED users to SELECT
CREATE POLICY "Allow authenticated read"
  ON login
  FOR SELECT
  TO authenticated
  USING (true);

-- Only authenticated users can insert
CREATE POLICY "Authenticated users can insert"
  ON login
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Only authenticated users can update
CREATE POLICY "Authenticated users can update"
  ON login
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
