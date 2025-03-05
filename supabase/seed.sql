-- This file will be used for seeding the database with initial data
-- For now, we'll leave it empty as we don't need any seed data
-- You can add test data here later if needed 

-- Set up extension if not exists
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Ensure clean state for users
TRUNCATE auth.users CASCADE;

-- Create default admin user in auth.users
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'admin@example.com',
  crypt('admin123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  now(),
  now(),
  '',
  '',
  '',
  ''
), (
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000001',
  'authenticated',
  'authenticated',
  'user@example.com',
  crypt('user123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  now(),
  now(),
  '',
  '',
  '',
  ''
);

-- Set up admin and user approvals and roles
INSERT INTO public.user_approvals (
  id,
  is_approved,
  role,
  approved_at,
  approved_by,
  created_at,
  updated_at
) VALUES 
  (
    '00000000-0000-0000-0000-000000000000',
    true,
    'admin',
    now(),
    '00000000-0000-0000-0000-000000000000',
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    true,
    'user',
    now(),
    '00000000-0000-0000-0000-000000000000',
    now(),
    now()
  )
ON CONFLICT (id) DO UPDATE SET
  is_approved = EXCLUDED.is_approved,
  role = EXCLUDED.role,
  approved_at = EXCLUDED.approved_at,
  approved_by = EXCLUDED.approved_by,
  updated_at = EXCLUDED.updated_at;

-- Sync the users view
SELECT initialize_users_view(); 