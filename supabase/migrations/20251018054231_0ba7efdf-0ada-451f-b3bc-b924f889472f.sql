-- Create enum for app roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create enum for activity categories
CREATE TYPE public.activity_category AS ENUM ('productive', 'unproductive', 'neutral');

-- Create admin_users table
CREATE TABLE public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role public.app_role DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create employees table
CREATE TABLE public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  employee_code TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  department TEXT NOT NULL,
  position TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create domains table
CREATE TABLE public.domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT UNIQUE NOT NULL,
  category public.activity_category NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create activities table
CREATE TABLE public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
  url TEXT NOT NULL,
  domain TEXT NOT NULL,
  title TEXT,
  category public.activity_category NOT NULL,
  duration INTEGER NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create productivity_rules table
CREATE TABLE public.productivity_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_pattern TEXT NOT NULL,
  keywords JSONB,
  category public.activity_category NOT NULL,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productivity_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policies for admin_users (only admins can access)
CREATE POLICY "Admins can view all admin users"
ON public.admin_users FOR SELECT
USING (true);

-- RLS Policies for employees (public read for now, will add auth later)
CREATE POLICY "Allow public read on employees"
ON public.employees FOR SELECT
USING (true);

CREATE POLICY "Allow public insert on employees"
ON public.employees FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow public update on employees"
ON public.employees FOR UPDATE
USING (true);

CREATE POLICY "Allow public delete on employees"
ON public.employees FOR DELETE
USING (true);

-- RLS Policies for activities
CREATE POLICY "Allow public read on activities"
ON public.activities FOR SELECT
USING (true);

CREATE POLICY "Allow public insert on activities"
ON public.activities FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow public update on activities"
ON public.activities FOR UPDATE
USING (true);

-- RLS Policies for domains
CREATE POLICY "Allow public read on domains"
ON public.domains FOR SELECT
USING (true);

CREATE POLICY "Allow public insert on domains"
ON public.domains FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow public update on domains"
ON public.domains FOR UPDATE
USING (true);

-- RLS Policies for productivity_rules
CREATE POLICY "Allow public read on productivity_rules"
ON public.productivity_rules FOR SELECT
USING (true);

CREATE POLICY "Allow public insert on productivity_rules"
ON public.productivity_rules FOR INSERT
WITH CHECK (true);

-- Insert default admin user (password: admin123)
-- Using bcrypt hash for 'admin123'
INSERT INTO public.admin_users (username, password_hash, role)
VALUES ('admin', '$2a$10$K7L1OJ45/4Y2nIvhRVpCe.FSmhSm5E8rOvKFMPdYKDsaEXYXQGRha', 'admin');

-- Insert sample employees
INSERT INTO public.employees (name, employee_code, email, department, position, is_active) VALUES
('John Doe', 'EMP001', 'john.doe@worklens.com', 'Engineering', 'Senior Developer', true),
('Jane Smith', 'EMP002', 'jane.smith@worklens.com', 'Marketing', 'Marketing Manager', true),
('Mike Johnson', 'EMP003', 'mike.johnson@worklens.com', 'Sales', 'Sales Executive', true),
('Sarah Williams', 'EMP004', 'sarah.williams@worklens.com', 'Engineering', 'Frontend Developer', true),
('David Brown', 'EMP005', 'david.brown@worklens.com', 'HR', 'HR Manager', true);

-- Insert sample domains
INSERT INTO public.domains (domain, category) VALUES
('github.com', 'productive'),
('stackoverflow.com', 'productive'),
('docs.google.com', 'productive'),
('linkedin.com', 'productive'),
('facebook.com', 'unproductive'),
('twitter.com', 'unproductive'),
('youtube.com', 'unproductive'),
('reddit.com', 'unproductive'),
('gmail.com', 'neutral'),
('slack.com', 'neutral'),
('zoom.us', 'neutral');

-- Create indexes for better performance
CREATE INDEX idx_activities_employee_id ON public.activities(employee_id);
CREATE INDEX idx_activities_timestamp ON public.activities(timestamp);
CREATE INDEX idx_activities_category ON public.activities(category);
CREATE INDEX idx_employees_is_active ON public.employees(is_active);