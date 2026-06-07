-- Add email field to repairs table if it doesn't already exist
ALTER TABLE public.repairs 
ADD COLUMN IF NOT EXISTS email TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.repairs.email IS 'Email address for repair status notifications';

-- Add column for notification preferences if it doesn't exist
ALTER TABLE public.repairs
ADD COLUMN IF NOT EXISTS notification_preference TEXT DEFAULT 'email';

-- Add comment for documentation
COMMENT ON COLUMN public.repairs.notification_preference IS 'Preference for whether the patient wants to receive email notifications'; 