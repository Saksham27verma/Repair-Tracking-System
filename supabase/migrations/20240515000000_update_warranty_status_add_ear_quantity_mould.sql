-- Drop the old warranty status type and recreate with new values
ALTER TYPE warranty_status RENAME TO warranty_status_old;

CREATE TYPE warranty_status AS ENUM (
  '2 years warranty',
  '3 years warranty',
  '4 years warranty',
  'Out of warranty'
);

-- Convert existing data
ALTER TABLE repairs
  ALTER COLUMN warranty TYPE warranty_status USING
    CASE warranty::text
      WHEN 'In Warranty' THEN '2 years warranty'::warranty_status
      WHEN 'Extended Warranty' THEN '3 years warranty'::warranty_status
      ELSE 'Out of warranty'::warranty_status
    END;

-- Remove product_name and foc columns
ALTER TABLE repairs
  DROP COLUMN product_name,
  DROP COLUMN foc;

-- Add new columns
ALTER TABLE repairs
  ADD COLUMN ear TEXT CHECK (ear IN ('left', 'right', 'both')),
  ADD COLUMN mould TEXT CHECK (mould IN (
    'Soft Half Concha Mould',
    'Soft Full Concha Mould',
    'Hard Half Concha Mould',
    'Hard Full Concha Mould'
  ));

-- Quantity column already exists, but let's set default value
ALTER TABLE repairs
  ALTER COLUMN quantity SET DEFAULT 1;

-- Drop old enum type
DROP TYPE warranty_status_old; 