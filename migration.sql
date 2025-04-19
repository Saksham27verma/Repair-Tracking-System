-- Add estimate_status column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'repairs' AND column_name = 'estimate_status'
    ) THEN
        ALTER TABLE repairs ADD COLUMN estimate_status TEXT DEFAULT 'Not Required';
        
        -- Add constraint for valid estimate status values
        ALTER TABLE repairs 
        ADD CONSTRAINT estimate_status_check 
        CHECK (estimate_status IS NULL OR estimate_status IN ('Pending', 'Approved', 'Declined', 'Not Required'));
    END IF;
    
    -- Add estimate_approval_date column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'repairs' AND column_name = 'estimate_approval_date'
    ) THEN
        ALTER TABLE repairs ADD COLUMN estimate_approval_date TIMESTAMPTZ;
    END IF;
END
$$;

-- Refresh the schema cache by querying the table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'repairs';
