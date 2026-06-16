-- Track who approved the repair estimate (patient via portal, or staff on behalf after phone confirmation)
ALTER TABLE repairs
  ADD COLUMN IF NOT EXISTS estimate_approved_by TEXT;

ALTER TABLE repairs
  DROP CONSTRAINT IF EXISTS estimate_approved_by_check;

ALTER TABLE repairs
  ADD CONSTRAINT estimate_approved_by_check
  CHECK (estimate_approved_by IS NULL OR estimate_approved_by IN ('patient', 'staff'));
