-- Drop and recreate the repair_status enum to ensure it has all the correct values
DO $$ 
BEGIN
    -- First update any rows with 'Cancelled' status to 'Received'
    UPDATE repairs 
    SET status = 'Received'::text 
    WHERE status = 'Cancelled'::text;
    
    -- Update enum by temporarily allowing multiple enum values, then dropping and recreating
    ALTER TYPE "repair_status" RENAME TO "repair_status_old";
    
    CREATE TYPE "repair_status" AS ENUM (
        'Received',
        'Sent to Company for Repair',
        'Returned from Manufacturer',
        'Ready for Pickup',
        'Completed'
    );
    
    -- Update column to use the new enum
    ALTER TABLE repairs 
    ALTER COLUMN status TYPE "repair_status" 
    USING status::text::"repair_status";
    
    -- Drop the old enum
    DROP TYPE "repair_status_old";
END $$;

-- Add the 'Reshelling of Machine' as a common purpose option in the system
-- This is for reference only since we handle this in the frontend options
COMMENT ON TABLE repairs IS 'Hearing aid repair records. Common purpose options include:
- Hearing aid is physically damaged
- Sound from the hearing aid is unclear or distorted
- Hearing aid is not connecting with external devices
- Ear hook is loose, broken, or needs replacement
- General maintenance or servicing is required
- Hearing aid is not charging properly
- Hearing aid turns off automatically
- Hearing aid is not turning on
- Reshelling of Machine
- Other (please specify)'; 