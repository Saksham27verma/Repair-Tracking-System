-- Per-customer repair visit numbering (Visit 1, Visit 2, ...)

ALTER TABLE repairs
  ADD COLUMN IF NOT EXISTS visit_number INTEGER;

-- Link legacy repairs missing customer_id via phone match
UPDATE repairs r
SET customer_id = c.id
FROM customers c
WHERE r.customer_id IS NULL
  AND r.phone IS NOT NULL
  AND c.phone = r.phone;

-- Backfill visit numbers ordered by receipt date per customer
WITH numbered AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY customer_id
      ORDER BY date_of_receipt ASC NULLS LAST, created_at ASC
    ) AS vn
  FROM repairs
  WHERE customer_id IS NOT NULL
)
UPDATE repairs r
SET visit_number = n.vn
FROM numbered n
WHERE r.id = n.id
  AND r.visit_number IS NULL;

-- Repairs still without a customer get visit 1
UPDATE repairs
SET visit_number = 1
WHERE visit_number IS NULL;

ALTER TABLE repairs
  ALTER COLUMN visit_number SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS repairs_customer_visit_number_idx
  ON repairs (customer_id, visit_number)
  WHERE customer_id IS NOT NULL;

COMMENT ON COLUMN repairs.visit_number IS 'Per-customer repair visit counter (1 = first visit)';

-- Auto-assign visit_number on insert
CREATE OR REPLACE FUNCTION set_repair_visit_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.customer_id IS NOT NULL AND (NEW.visit_number IS NULL OR NEW.visit_number <= 0) THEN
    SELECT COALESCE(MAX(visit_number), 0) + 1
    INTO NEW.visit_number
    FROM repairs
    WHERE customer_id = NEW.customer_id;
  ELSIF NEW.visit_number IS NULL THEN
    NEW.visit_number := 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_repair_visit_number ON repairs;

CREATE TRIGGER trg_set_repair_visit_number
  BEFORE INSERT ON repairs
  FOR EACH ROW
  EXECUTE FUNCTION set_repair_visit_number();
