-- Add email field to customers table if it doesn't already exist
ALTER TABLE public.customers 
ADD COLUMN IF NOT EXISTS email TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.customers.email IS 'Email address for customer notifications';

-- Update policies to include the new column
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_catalog.pg_policy p
        JOIN pg_catalog.pg_class c ON p.polrelid = c.oid
        JOIN pg_catalog.pg_namespace n ON c.relnamespace = n.oid
        WHERE p.polname = 'Allow all to read customers' 
        AND c.relname = 'customers'
        AND n.nspname = 'public'
    ) THEN
        -- Policy exists, so alter it
        ALTER POLICY "Allow all to read customers" ON public.customers
        USING (true);
    ELSE
        -- Policy doesn't exist, so create it
        CREATE POLICY "Allow all to read customers" 
        ON public.customers 
        FOR SELECT
        TO authenticated, anon
        USING (true);
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM pg_catalog.pg_policy p
        JOIN pg_catalog.pg_class c ON p.polrelid = c.oid
        JOIN pg_catalog.pg_namespace n ON c.relnamespace = n.oid
        WHERE p.polname = 'Allow all to update customers' 
        AND c.relname = 'customers'
        AND n.nspname = 'public'
    ) THEN
        -- Policy exists, so alter it
        ALTER POLICY "Allow all to update customers" ON public.customers
        USING (true);
    ELSE
        -- Policy doesn't exist, so create it
        CREATE POLICY "Allow all to update customers" 
        ON public.customers 
        FOR UPDATE
        TO authenticated, anon
        USING (true);
    END IF;
END
$$; 