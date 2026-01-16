-- Add 'CARDIOLOGIA' to medical_specialty enum if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'medical_specialty' AND e.enumlabel = 'CARDIOLOGIA'
  ) THEN
    ALTER TYPE public.medical_specialty ADD VALUE 'CARDIOLOGIA';
  END IF;
END
$$;
