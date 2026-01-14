-- Enum para status do paciente em cada etapa
CREATE TYPE public.patient_step_status AS ENUM ('pending', 'called', 'in_progress', 'completed');

-- Enum para as etapas do circuito
CREATE TYPE public.circuit_step AS ENUM ('triagem_medica', 'exames_lab_ecg', 'agendamento', 'cardiologista', 'exame_imagem');

-- Tabela de pacientes
CREATE TABLE public.patients (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    needs_cardio BOOLEAN NOT NULL DEFAULT false,
    needs_image_exam BOOLEAN NOT NULL DEFAULT false,
    registration_number TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    completed_at TIMESTAMP WITH TIME ZONE,
    is_completed BOOLEAN NOT NULL DEFAULT false
);

-- Tabela de etapas do paciente
CREATE TABLE public.patient_steps (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    step circuit_step NOT NULL,
    status patient_step_status NOT NULL DEFAULT 'pending',
    called_at TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    station_number INTEGER,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(patient_id, step)
);

-- Tabela de estações de trabalho
CREATE TABLE public.stations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    step circuit_step NOT NULL,
    station_number INTEGER NOT NULL,
    name TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    current_patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(step, station_number)
);

-- Tabela de chamadas para TV
CREATE TABLE public.tv_calls (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    patient_name TEXT NOT NULL,
    step circuit_step NOT NULL,
    station_number INTEGER NOT NULL,
    station_name TEXT NOT NULL,
    called_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    is_active BOOLEAN NOT NULL DEFAULT true
);

-- Índices para performance
CREATE INDEX idx_patients_is_completed ON public.patients(is_completed);
CREATE INDEX idx_patient_steps_status ON public.patient_steps(status);
CREATE INDEX idx_patient_steps_patient_step ON public.patient_steps(patient_id, step);
CREATE INDEX idx_tv_calls_active ON public.tv_calls(is_active, called_at DESC);

-- Função para obter próximo paciente disponível para uma etapa
CREATE OR REPLACE FUNCTION public.get_next_patient_for_step(target_step circuit_step)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    next_patient_id UUID;
BEGIN
    SELECT ps.patient_id INTO next_patient_id
    FROM public.patient_steps ps
    JOIN public.patients p ON p.id = ps.patient_id
    WHERE ps.step = target_step
      AND ps.status = 'pending'
      AND p.is_completed = false
    ORDER BY ps.created_at ASC
    LIMIT 1;
    
    RETURN next_patient_id;
END;
$$;

-- Enable RLS
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tv_calls ENABLE ROW LEVEL SECURITY;

-- Políticas públicas (sistema hospitalar interno sem autenticação individual)
CREATE POLICY "Allow all access to patients" ON public.patients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to patient_steps" ON public.patient_steps FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to stations" ON public.stations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to tv_calls" ON public.tv_calls FOR ALL USING (true) WITH CHECK (true);

-- Habilitar realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.patients;
ALTER PUBLICATION supabase_realtime ADD TABLE public.patient_steps;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tv_calls;
ALTER PUBLICATION supabase_realtime ADD TABLE public.stations;

-- Inserir estações padrão
INSERT INTO public.stations (step, station_number, name) VALUES
('triagem_medica', 1, 'Triagem Médica 1'),
('triagem_medica', 2, 'Triagem Médica 2'),
('exames_lab_ecg', 1, 'Exames Lab/ECG 1'),
('exames_lab_ecg', 2, 'Exames Lab/ECG 2'),
('agendamento', 1, 'Agendamento 1'),
('agendamento', 2, 'Agendamento 2'),
('cardiologista', 1, 'Cardiologista 1'),
('exame_imagem', 1, 'Exame de Imagem 1');