/*
  # Complete Authentication and Submission System

  ## Overview
  This migration creates a complete custom authentication and code submission system
  with role-based access control for students and professors.

  ## New Tables

  ### 1. `users`
  Core authentication table for all users (students and professors)
  - `id` (uuid, primary key) - Unique user identifier
  - `email` (text, unique, not null) - User email for login
  - `password_hash` (text, not null) - Bcrypt hashed password
  - `name` (text, not null) - Full name of user
  - `role` (text, not null) - Either 'student' or 'professor'
  - `created_at` (timestamptz) - Account creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 2. `students`
  Extended profile information for students
  - `id` (uuid, primary key) - References users.id
  - `prn` (text, unique, not null) - Permanent Registration Number
  - `roll_number` (text, unique, not null) - Student roll number
  - `created_at` (timestamptz) - Profile creation timestamp

  ### 3. `professors`
  Extended profile information for professors
  - `id` (uuid, primary key) - References users.id
  - `department` (text) - Professor's department
  - `created_at` (timestamptz) - Profile creation timestamp

  ### 4. `batches`
  Batches managed by professors
  - `id` (uuid, primary key) - Unique batch identifier
  - `name` (text, not null) - Batch name (e.g., "CS-A1", "IT-B2")
  - `professor_id` (uuid, not null) - References professors.id
  - `description` (text) - Optional batch description
  - `created_at` (timestamptz) - Batch creation timestamp

  ### 5. `submissions`
  Code submissions from students
  - `id` (uuid, primary key) - Unique submission identifier
  - `student_id` (uuid, not null) - References students.id
  - `batch_id` (uuid, not null) - References batches.id
  - `code` (text, not null) - Submitted code content
  - `language` (text, not null) - Programming language
  - `commit_message` (text) - Optional commit message
  - `ai_marks` (integer) - Marks given by Gemini AI (0-10)
  - `professor_marks` (integer) - Marks adjusted by professor (0-10)
  - `remarks` (text) - Professor's remarks/feedback
  - `status` (text, not null) - Status: 'pending', 'reviewed', 'completed'
  - `submitted_at` (timestamptz) - Submission timestamp
  - `reviewed_at` (timestamptz) - Review timestamp
  - `created_at` (timestamptz) - Record creation timestamp

  ## Security
  - Enable RLS on all tables
  - Students can only read their own data and create submissions
  - Professors can read their assigned batches and all submissions in those batches
  - Professors can update submissions (marks, remarks, status)
  - Only authenticated users can access the system

  ## Important Notes
  - Passwords must be hashed using bcrypt before insertion
  - JWT tokens will be handled at the application layer
  - Each batch is assigned to exactly one professor
  - Students select batch at submission time, not at signup
  - AI evaluation happens automatically, then professor can override
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  name text NOT NULL,
  role text NOT NULL CHECK (role IN ('student', 'professor')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create students table
CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  prn text UNIQUE NOT NULL,
  roll_number text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create professors table
CREATE TABLE IF NOT EXISTS professors (
  id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  department text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Create batches table
CREATE TABLE IF NOT EXISTS batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  professor_id uuid NOT NULL REFERENCES professors(id) ON DELETE CASCADE,
  description text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  UNIQUE(name, professor_id)
);

-- Create submissions table
CREATE TABLE IF NOT EXISTS submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  batch_id uuid NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  code text NOT NULL,
  language text NOT NULL DEFAULT 'javascript',
  commit_message text DEFAULT '',
  ai_marks integer CHECK (ai_marks >= 0 AND ai_marks <= 10),
  professor_marks integer CHECK (professor_marks >= 0 AND professor_marks <= 10),
  remarks text DEFAULT '',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'completed')),
  submitted_at timestamptz DEFAULT now(),
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_batches_professor ON batches(professor_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student ON submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_submissions_batch ON submissions(batch_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE professors ENABLE ROW LEVEL SECURITY;
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can read own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- RLS Policies for students table
CREATE POLICY "Students can read own profile"
  ON students FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Students can insert own profile"
  ON students FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- RLS Policies for professors table
CREATE POLICY "Professors can read own profile"
  ON professors FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Anyone authenticated can view professor info"
  ON professors FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for batches table
CREATE POLICY "Students can view all batches"
  ON batches FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Professors can view their batches"
  ON batches FOR SELECT
  TO authenticated
  USING (
    professor_id IN (
      SELECT id FROM professors WHERE id = auth.uid()
    )
  );

CREATE POLICY "Professors can manage their batches"
  ON batches FOR ALL
  TO authenticated
  USING (
    professor_id IN (
      SELECT id FROM professors WHERE id = auth.uid()
    )
  );

-- RLS Policies for submissions table
CREATE POLICY "Students can view their own submissions"
  ON submissions FOR SELECT
  TO authenticated
  USING (
    student_id IN (
      SELECT id FROM students WHERE id = auth.uid()
    )
  );

CREATE POLICY "Students can create submissions"
  ON submissions FOR INSERT
  TO authenticated
  WITH CHECK (
    student_id IN (
      SELECT id FROM students WHERE id = auth.uid()
    )
  );

CREATE POLICY "Professors can view submissions in their batches"
  ON submissions FOR SELECT
  TO authenticated
  USING (
    batch_id IN (
      SELECT id FROM batches WHERE professor_id = auth.uid()
    )
  );

CREATE POLICY "Professors can update submissions in their batches"
  ON submissions FOR UPDATE
  TO authenticated
  USING (
    batch_id IN (
      SELECT id FROM batches WHERE professor_id = auth.uid()
    )
  )
  WITH CHECK (
    batch_id IN (
      SELECT id FROM batches WHERE professor_id = auth.uid()
    )
  );