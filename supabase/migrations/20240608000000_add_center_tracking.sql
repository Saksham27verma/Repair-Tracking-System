-- Center-to-center repair tracking migration

-- Location and movement type enums
CREATE TYPE location_type AS ENUM (
  'center',
  'manufacturer',
  'customer',
  'in_transit'
);

CREATE TYPE movement_type AS ENUM (
  'received',
  'center_transfer',
  'sent_to_manufacturer',
  'returned_from_manufacturer',
  'ready_for_pickup',
  'delivered'
);

CREATE TYPE current_location_type AS ENUM (
  'at_center',
  'in_transit',
  'at_manufacturer',
  'with_customer'
);

-- Centers table
CREATE TABLE IF NOT EXISTS public.centers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  address TEXT,
  phone TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed existing centers
INSERT INTO public.centers (name, address, phone) VALUES
  ('Rohini', 'Rohini, Delhi', NULL),
  ('Green Park', 'Green Park, Delhi', NULL),
  ('Indirapuram', 'Indirapuram, Ghaziabad', NULL),
  ('Sanjay Nagar', 'Sanjay Nagar, Ghaziabad', NULL)
ON CONFLICT (name) DO NOTHING;

-- Extend repairs table with location tracking
ALTER TABLE public.repairs
  ADD COLUMN IF NOT EXISTS current_center_id UUID REFERENCES public.centers(id),
  ADD COLUMN IF NOT EXISTS pickup_center_id UUID REFERENCES public.centers(id),
  ADD COLUMN IF NOT EXISTS current_location_type current_location_type DEFAULT 'at_center';

-- Repair movements log
CREATE TABLE IF NOT EXISTS public.repair_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  repair_id UUID NOT NULL REFERENCES public.repairs(id) ON DELETE CASCADE,
  from_location_type location_type,
  from_center_id UUID REFERENCES public.centers(id),
  to_location_type location_type NOT NULL,
  to_center_id UUID REFERENCES public.centers(id),
  movement_type movement_type NOT NULL,
  carrier TEXT,
  tracking_number TEXT,
  shipped_at TIMESTAMPTZ,
  expected_arrival TIMESTAMPTZ,
  received_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS repair_movements_repair_id_idx ON public.repair_movements(repair_id);
CREATE INDEX IF NOT EXISTS repair_movements_created_at_idx ON public.repair_movements(created_at);
CREATE INDEX IF NOT EXISTS repairs_current_center_id_idx ON public.repairs(current_center_id);
CREATE INDEX IF NOT EXISTS repairs_pickup_center_id_idx ON public.repairs(pickup_center_id);
CREATE INDEX IF NOT EXISTS repairs_current_location_type_idx ON public.repairs(current_location_type);

-- Trigger for centers updated_at
CREATE TRIGGER update_centers_updated_at
  BEFORE UPDATE ON public.centers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS policies
ALTER TABLE public.centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repair_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all to read centers"
  ON public.centers FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow all to read repair_movements"
  ON public.repair_movements FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow all to insert repair_movements"
  ON public.repair_movements FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow all to update repair_movements"
  ON public.repair_movements FOR UPDATE
  TO anon, authenticated
  USING (true);

-- Backfill: map existing receiving_center to current_center_id and pickup_center_id
UPDATE public.repairs r
SET
  current_center_id = c.id,
  pickup_center_id = COALESCE(r.pickup_center_id, c.id),
  current_location_type = CASE
    WHEN r.status = 'Completed' THEN 'with_customer'::current_location_type
    WHEN r.status = 'Sent to Company for Repair' THEN 'at_manufacturer'::current_location_type
    ELSE 'at_center'::current_location_type
  END
FROM public.centers c
WHERE r.receiving_center IS NOT NULL
  AND r.receiving_center = c.name
  AND r.current_center_id IS NULL;

-- Backfill: create initial 'received' movement for repairs with a center
INSERT INTO public.repair_movements (
  repair_id,
  from_location_type,
  to_location_type,
  to_center_id,
  movement_type,
  received_at,
  created_at
)
SELECT
  r.id,
  'customer'::location_type,
  'center'::location_type,
  r.current_center_id,
  'received'::movement_type,
  r.date_of_receipt,
  r.date_of_receipt
FROM public.repairs r
WHERE r.current_center_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.repair_movements rm
    WHERE rm.repair_id = r.id AND rm.movement_type = 'received'
  );
