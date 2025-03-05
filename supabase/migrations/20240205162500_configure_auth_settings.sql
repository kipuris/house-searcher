-- Create a table to track user approval status
CREATE TABLE public.user_approvals (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  is_approved BOOLEAN DEFAULT false,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on user_approvals
ALTER TABLE public.user_approvals ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own approval status
CREATE POLICY "Users can view their own approval status"
  ON public.user_approvals
  FOR SELECT
  USING (auth.uid() = id);

-- Allow admins to view and update all approval statuses (we'll set this up later)
CREATE POLICY "Admins can view all approval statuses"
  ON public.user_approvals
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

-- Function to handle new user registrations
CREATE OR REPLACE FUNCTION handle_new_user_registration()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_approvals (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create approval record for new users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user_registration();

-- Function to check if user is approved
CREATE OR REPLACE FUNCTION is_user_approved(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_approvals
    WHERE id = user_id AND is_approved = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 