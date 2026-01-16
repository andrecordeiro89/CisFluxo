-- Add scheduling_pending_reason column to patients table
ALTER TABLE public.patients
ADD COLUMN scheduling_pending_reason text DEFAULT NULL;