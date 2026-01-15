-- Add 'especialista' to the circuit_step enum
ALTER TYPE circuit_step ADD VALUE IF NOT EXISTS 'especialista';

-- Add 'has_surgery_indication' column to patients table to track if patient needs surgery
ALTER TABLE public.patients 
ADD COLUMN IF NOT EXISTS has_surgery_indication boolean DEFAULT false;

-- Add 'flow_type' column to patients to determine if goes to specialist first or pre-op circuit
-- 'consulta_especialista' = goes to specialist first
-- 'circuito_preop' = goes directly to pre-operative circuit
ALTER TABLE public.patients 
ADD COLUMN IF NOT EXISTS flow_type text NOT NULL DEFAULT 'circuito_preop';