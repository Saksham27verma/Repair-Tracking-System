-- Add email field to customers table if it doesn't already exist
ALTER TABLE public.customers 
ADD COLUMN IF NOT EXISTS email TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.customers.email IS 'Email address for customer notifications'; 