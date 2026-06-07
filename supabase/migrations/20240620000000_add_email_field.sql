-- Add email field to repairs table if it doesn't already exist
ALTER TABLE public.repairs 
ADD COLUMN IF NOT EXISTS email TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.repairs.email IS 'Email address for repair status notifications';

-- Add column for notification preferences if it doesn't exist
ALTER TABLE public.repairs
ADD COLUMN IF NOT EXISTS notification_preference TEXT DEFAULT 'email';

-- Create an enum type for notification preference if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_preference_type') THEN
        CREATE TYPE notification_preference_type AS ENUM ('email', 'none');
        
        -- Add a constraint to ensure notification_preference only accepts valid values
        ALTER TABLE public.repairs
        ADD CONSTRAINT notification_preference_check
        CHECK (notification_preference::notification_preference_type IN ('email', 'none'));
    END IF;
END
$$;

-- Add comment for documentation
COMMENT ON COLUMN public.repairs.notification_preference IS 'Preference for whether the patient wants to receive email notifications';

-- Check if the policy exists first and create it if it doesn't
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_catalog.pg_policy p
        JOIN pg_catalog.pg_class c ON p.polrelid = c.oid
        JOIN pg_catalog.pg_namespace n ON c.relnamespace = n.oid
        WHERE p.polname = 'Allow all to read repairs' 
        AND c.relname = 'repairs'
        AND n.nspname = 'public'
    ) THEN
        -- Policy exists, so alter it
        ALTER POLICY "Allow all to read repairs" ON public.repairs
        USING (true);
    ELSE
        -- Policy doesn't exist, so create it
        CREATE POLICY "Allow all to read repairs" 
        ON public.repairs 
        FOR SELECT
        TO authenticated, anon
        USING (true);
    END IF;
END
$$; 