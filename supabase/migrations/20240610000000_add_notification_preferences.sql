-- Add new notification preference fields to the repairs table
ALTER TABLE public.repairs
ADD COLUMN IF NOT EXISTS notification_preference TEXT DEFAULT 'email',
ADD COLUMN IF NOT EXISTS email TEXT;

-- Create an enum type for notification preference
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
COMMENT ON COLUMN public.repairs.email IS 'Email address for sending repair notifications';

-- Add RLS policy to allow access to notification-related fields
ALTER POLICY "Enable read access for all authenticated users" ON "public"."repairs"
USING (true);

-- Create function to log status changes only (notifications will be handled by the API)
CREATE OR REPLACE FUNCTION public.handle_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Log the status change
    INSERT INTO public.status_change_logs(
        repair_id,
        old_status,
        new_status,
        changed_at
    ) VALUES (
        NEW.id,
        OLD.status,
        NEW.status,
        now()
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create status change logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.status_change_logs(
    id SERIAL PRIMARY KEY,
    repair_id UUID NOT NULL REFERENCES public.repairs(id) ON DELETE CASCADE,
    old_status TEXT,
    new_status TEXT,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    notification_sent BOOLEAN DEFAULT false
);

-- Add RLS to status change logs
ALTER TABLE public.status_change_logs ENABLE ROW LEVEL SECURITY;

-- Create a policy for status change logs
CREATE POLICY "Enable read access for all authenticated users"
ON public.status_change_logs
FOR SELECT
USING (true);

-- Create a trigger to log status changes
DROP TRIGGER IF EXISTS on_status_change ON public.repairs;
CREATE TRIGGER on_status_change
AFTER UPDATE OF status ON public.repairs
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION public.handle_status_change(); 