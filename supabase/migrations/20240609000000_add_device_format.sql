-- Support kit (pair) vs single piece intake for repairs
ALTER TABLE repairs
  ADD COLUMN IF NOT EXISTS device_format TEXT DEFAULT 'piece',
  ADD COLUMN IF NOT EXISTS serial_no_2 TEXT;

ALTER TABLE repairs
  ALTER COLUMN device_format SET DEFAULT 'piece';

UPDATE repairs SET device_format = 'piece' WHERE device_format IS NULL;

ALTER TABLE repairs
  ALTER COLUMN device_format SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'repairs_device_format_check'
  ) THEN
    ALTER TABLE repairs
      ADD CONSTRAINT repairs_device_format_check
      CHECK (device_format IN ('kit', 'piece'));
  END IF;
END $$;

-- Backfill: existing multi-quantity records were likely pair kits
UPDATE repairs
SET device_format = 'kit', quantity = 2
WHERE quantity >= 2;

UPDATE repairs
SET device_format = 'piece', quantity = 1
WHERE quantity < 2 OR quantity IS NULL;

COMMENT ON COLUMN repairs.device_format IS 'kit = pair sold together (2 devices), piece = single device';
COMMENT ON COLUMN repairs.serial_no_2 IS 'Second device serial number when device_format is kit';
