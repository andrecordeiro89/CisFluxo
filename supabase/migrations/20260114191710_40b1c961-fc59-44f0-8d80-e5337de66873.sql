-- Create enum for specialties
CREATE TYPE public.medical_specialty AS ENUM (
  'ORTOPEDIA',
  'OTORRINO',
  'OFTALMO',
  'TRAUMA',
  'GERAL',
  'UROLOGIA',
  'GINECOLOGIA',
  'OUTROS'
);

-- Add specialty column to patients table
ALTER TABLE public.patients 
ADD COLUMN specialty public.medical_specialty NOT NULL DEFAULT 'GERAL';