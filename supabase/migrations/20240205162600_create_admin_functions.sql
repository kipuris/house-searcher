-- Create admin role type
CREATE TYPE public.user_role AS ENUM ('user', 'admin');

-- Add role column to user_approvals
ALTER TABLE public.user_approvals
ADD COLUMN role public.user_role DEFAULT 'user';

-- Function to approve a user
CREATE OR REPLACE FUNCTION approve_user(
  user_id UUID,
  admin_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_admin_role public.user_role;
BEGIN
  -- Check if the admin user has admin role
  SELECT role INTO v_admin_role
  FROM public.user_approvals
  WHERE id = admin_id;

  IF v_admin_role != 'admin' THEN
    RAISE EXCEPTION 'Only admins can approve users';
  END IF;

  -- Update user approval status
  UPDATE public.user_approvals
  SET 
    is_approved = true,
    approved_at = NOW(),
    approved_by = admin_id,
    updated_at = NOW()
  WHERE id = user_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to make a user an admin
CREATE OR REPLACE FUNCTION make_user_admin(
  target_user_id UUID,
  admin_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_admin_role public.user_role;
BEGIN
  -- Check if the admin user has admin role
  SELECT role INTO v_admin_role
  FROM public.user_approvals
  WHERE id = admin_id;

  IF v_admin_role != 'admin' THEN
    RAISE EXCEPTION 'Only admins can create other admins';
  END IF;

  -- Update user role to admin
  UPDATE public.user_approvals
  SET 
    role = 'admin',
    updated_at = NOW()
  WHERE id = target_user_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the first admin user (you'll need to replace the UUID with your user's ID)
-- This should be run manually with your user ID after creating your first account
-- INSERT INTO public.user_approvals (id, is_approved, role, approved_at, approved_by)
-- VALUES ('your-user-id-here', true, 'admin', NOW(), 'your-user-id-here'); 