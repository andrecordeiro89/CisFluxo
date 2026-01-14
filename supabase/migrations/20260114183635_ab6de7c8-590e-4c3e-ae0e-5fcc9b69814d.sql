-- Add is_priority column to patients table
ALTER TABLE public.patients ADD COLUMN is_priority boolean NOT NULL DEFAULT false;

-- Add is_being_served column to patients to track if they're currently being served anywhere
ALTER TABLE public.patients ADD COLUMN is_being_served boolean NOT NULL DEFAULT false;

-- Update get_next_patient_for_step function to consider priority and exclude patients being served
CREATE OR REPLACE FUNCTION public.get_next_patient_for_step(target_step circuit_step)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    next_patient_id UUID;
BEGIN
    SELECT ps.patient_id INTO next_patient_id
    FROM public.patient_steps ps
    JOIN public.patients p ON p.id = ps.patient_id
    WHERE ps.step = target_step
      AND ps.status = 'pending'
      AND p.is_completed = false
      AND p.is_being_served = false
    ORDER BY p.is_priority DESC, ps.created_at ASC
    LIMIT 1;
    
    RETURN next_patient_id;
END;
$function$