-- Check existing enum values
DO $$
BEGIN
  -- First, check if we need to update the enum
  IF EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'warranty_status'
    AND e.enumlabel = 'In Warranty'
  ) THEN
    -- We need to update the enum
    -- Create a temporary type
    CREATE TYPE warranty_status_new AS ENUM (
      '2 years warranty',
      '3 years warranty',
      '4 years warranty',
      'Out of warranty'
    );

    -- Update the repairs table to use the new type
    ALTER TABLE repairs
      ALTER COLUMN warranty TYPE warranty_status_new USING
        CASE warranty::text
          WHEN 'In Warranty' THEN '2 years warranty'::warranty_status_new
          WHEN 'Extended Warranty' THEN '3 years warranty'::warranty_status_new
          ELSE 'Out of warranty'::warranty_status_new
        END;

    -- Drop the old type
    DROP TYPE warranty_status;

    -- Rename the new type to the original name
    ALTER TYPE warranty_status_new RENAME TO warranty_status;
  END IF;
END $$; 