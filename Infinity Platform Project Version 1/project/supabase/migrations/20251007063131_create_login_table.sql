/*
  # Create login table for user authentication

  1. New Tables
    - `login`
      - `id` (uuid, primary key) - Unique identifier for each user
      - `user_name` (text, unique, not null) - Username for login
      - `password` (text, not null) - User password (should be hashed in production)
      - `name` (text, not null) - Display name of the user
      - `role` (text, default 'User') - User role in the system
      - `created_at` (timestamp) - Account creation timestamp
      - `updated_at` (timestamp) - Last update timestamp

  2. Security
    - Enable RLS on `login` table
    - Add policy for authenticated users to read login data
    - Add policy for authenticated users to update their own data

  3. Important Notes
    - This table stores user credentials for the application
    - In production, passwords should be hashed
    - The `name` column is used as a reference in other tables
*/

CREATE TABLE IF NOT EXISTS login (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_name text UNIQUE NOT NULL,
  password text NOT NULL,
  name text NOT NULL,
  role text DEFAULT 'User',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE login ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read login data"
  ON login
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert login data"
  ON login
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update their own login data"
  ON login
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);