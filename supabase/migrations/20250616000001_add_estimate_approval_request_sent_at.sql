-- Track when staff sent the patient estimate approval request email
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'repairs' AND column_name = 'estimate_approval_request_sent_at'
    ) THEN
        ALTER TABLE repairs ADD COLUMN estimate_approval_request_sent_at TIMESTAMPTZ;
    END IF;
END
$$;
