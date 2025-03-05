-- Create users table that will be kept in sync
CREATE TABLE public.users_view (
    id uuid PRIMARY KEY,
    email text,
    created_at timestamptz,
    is_approved boolean,
    role public.user_role,
    approved_at timestamptz,
    approved_by uuid
);

-- Enable RLS
ALTER TABLE public.users_view ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for the table
CREATE POLICY "Users can view their own info"
ON public.users_view
FOR SELECT
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Admins can view all users"
ON public.users_view
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 
        FROM public.user_approvals 
        WHERE id = auth.uid() 
        AND role = 'admin'
    )
);

-- Function for initial sync
CREATE OR REPLACE FUNCTION initialize_users_view()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    INSERT INTO public.users_view
    SELECT 
        au.id,
        au.email,
        au.created_at,
        ua.is_approved,
        ua.role,
        ua.approved_at,
        ua.approved_by
    FROM auth.users au
    LEFT JOIN public.user_approvals ua ON au.id = ua.id
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        created_at = EXCLUDED.created_at,
        is_approved = EXCLUDED.is_approved,
        role = EXCLUDED.role,
        approved_at = EXCLUDED.approved_at,
        approved_by = EXCLUDED.approved_by;
END;
$$;

-- Function for trigger-based sync
CREATE OR REPLACE FUNCTION sync_users_view()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    INSERT INTO public.users_view
    SELECT 
        au.id,
        au.email,
        au.created_at,
        ua.is_approved,
        ua.role,
        ua.approved_at,
        ua.approved_by
    FROM auth.users au
    LEFT JOIN public.user_approvals ua ON au.id = ua.id
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        created_at = EXCLUDED.created_at,
        is_approved = EXCLUDED.is_approved,
        role = EXCLUDED.role,
        approved_at = EXCLUDED.approved_at,
        approved_by = EXCLUDED.approved_by;
    
    -- Handle deletions by removing records that no longer exist in source tables
    DELETE FROM public.users_view uv
    WHERE NOT EXISTS (
        SELECT 1 FROM auth.users au WHERE au.id = uv.id
    );
    
    RETURN NULL;
END;
$$;

-- Create triggers to keep the table in sync
CREATE TRIGGER sync_users_view_on_auth_users
AFTER INSERT OR UPDATE OR DELETE ON auth.users
FOR EACH STATEMENT
EXECUTE FUNCTION sync_users_view();

CREATE TRIGGER sync_users_view_on_user_approvals
AFTER INSERT OR UPDATE OR DELETE ON public.user_approvals
FOR EACH STATEMENT
EXECUTE FUNCTION sync_users_view();

-- Initial sync
SELECT initialize_users_view();

-- Grant access to the table
GRANT SELECT ON public.users_view TO authenticated; 