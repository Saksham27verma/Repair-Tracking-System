-- First, check if the foc column exists and remove it
ALTER TABLE repairs DROP COLUMN IF EXISTS foc;

-- Create a type for company options if it doesn't exist already
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'company_type'
  ) THEN
    -- Create a new enum type for company options
    CREATE TYPE company_type AS ENUM (
      'Signia',
      'Phonak',
      'Widex',
      'Starkey',
      'GNResound',
      'Unitron',
      'Oticon',
      'Siemens',
      'Others'
    );
  END IF;
END $$;

-- Update the company column to use the new type
DO $$
BEGIN
  -- First, make sure the column exists
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'repairs'
    AND column_name = 'company'
  ) THEN
    -- If it's a TEXT column, alter it to be company_type
    IF (
      SELECT data_type
      FROM information_schema.columns
      WHERE table_name = 'repairs'
      AND column_name = 'company'
    ) = 'text' THEN
      -- Then convert to the enum type
      ALTER TABLE repairs
        ALTER COLUMN company TYPE company_type USING
          CASE
            WHEN company = 'Signia' THEN 'Signia'::company_type
            WHEN company = 'Phonak' THEN 'Phonak'::company_type
            WHEN company = 'Widex' THEN 'Widex'::company_type
            WHEN company = 'Starkey' THEN 'Starkey'::company_type
            WHEN company = 'GNResound' THEN 'GNResound'::company_type
            WHEN company = 'Unitron' THEN 'Unitron'::company_type
            WHEN company = 'Oticon' THEN 'Oticon'::company_type
            WHEN company = 'Siemens' THEN 'Siemens'::company_type
            WHEN company IS NOT NULL THEN 'Others'::company_type
            ELSE NULL
          END;
    END IF;
  END IF;
END $$;

-- Create a type for mould options if it doesn't exist already
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'mould_type'
  ) THEN
    -- Create a new enum type for mould options
    CREATE TYPE mould_type AS ENUM (
      'Soft Half Concha Mould',
      'Soft Full Concha Mould',
      'Hard Half Concha Mould',
      'Hard Full Concha Mould',
      'Soft Silicon Mould',
      'Hard Acrylic Mould',
      'Other'
    );
  END IF;
END $$;

-- Create a type for ear options if it doesn't exist already
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'ear_type'
  ) THEN
    -- Create a new enum type for ear options
    CREATE TYPE ear_type AS ENUM (
      'left',
      'right',
      'both'
    );
  END IF;
END $$;

-- Add the ear column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'repairs'
    AND column_name = 'ear'
  ) THEN
    -- Add the ear column
    ALTER TABLE repairs ADD COLUMN ear ear_type;
  ELSE
    -- If it exists but is a TEXT column with the wrong constraint, update it
    IF (
      SELECT data_type
      FROM information_schema.columns
      WHERE table_name = 'repairs'
      AND column_name = 'ear'
    ) = 'text' THEN
      -- First drop any constraints on the column
      ALTER TABLE repairs DROP CONSTRAINT IF EXISTS repairs_ear_check;
      
      -- Then convert to the enum type
      ALTER TABLE repairs
        ALTER COLUMN ear TYPE ear_type USING
          CASE
            WHEN LOWER(ear) = 'left' THEN 'left'::ear_type
            WHEN LOWER(ear) = 'right' THEN 'right'::ear_type
            WHEN LOWER(ear) = 'both' THEN 'both'::ear_type
            ELSE NULL
          END;
    END IF;
  END IF;
END $$;

-- Update the mould column to use the new type
DO $$
BEGIN
  -- First, make sure the column exists
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'repairs'
    AND column_name = 'mould'
  ) THEN
    -- If it's a TEXT column, alter it to be mould_type
    IF (
      SELECT data_type
      FROM information_schema.columns
      WHERE table_name = 'repairs'
      AND column_name = 'mould'
    ) = 'text' THEN
      -- First drop any constraints on the column
      ALTER TABLE repairs DROP CONSTRAINT IF EXISTS repairs_mould_check;
      
      -- Then convert to the enum type
      ALTER TABLE repairs
        ALTER COLUMN mould TYPE mould_type USING
          CASE
            WHEN mould = 'Soft Half Concha Mould' THEN 'Soft Half Concha Mould'::mould_type
            WHEN mould = 'Soft Full Concha Mould' THEN 'Soft Full Concha Mould'::mould_type
            WHEN mould = 'Hard Half Concha Mould' THEN 'Hard Half Concha Mould'::mould_type
            WHEN mould = 'Hard Full Concha Mould' THEN 'Hard Full Concha Mould'::mould_type
            WHEN mould = 'Soft Silicon Mould' THEN 'Soft Silicon Mould'::mould_type
            WHEN mould = 'Hard Acrylic Mould' THEN 'Hard Acrylic Mould'::mould_type
            ELSE 'Other'::mould_type
          END;
    END IF;
  ELSE
    -- If the column doesn't exist, add it
    ALTER TABLE repairs ADD COLUMN mould mould_type;
  END IF;
END $$; 