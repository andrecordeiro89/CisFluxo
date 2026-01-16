-- Add current_specialty column to stations to track which specialty is being served
ALTER TABLE public.stations 
ADD COLUMN IF NOT EXISTS current_specialty text DEFAULT NULL;