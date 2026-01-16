-- Add column to track patients pending surgical scheduling
ALTER TABLE public.patients 
ADD COLUMN IF NOT EXISTS pending_surgery_scheduling boolean DEFAULT false;

-- Add column to store when scheduling was marked as pending
ALTER TABLE public.patients 
ADD COLUMN IF NOT EXISTS scheduling_pending_at timestamp with time zone DEFAULT null;