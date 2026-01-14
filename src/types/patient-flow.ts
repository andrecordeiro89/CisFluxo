export type PatientStepStatus = 'pending' | 'called' | 'in_progress' | 'completed';

export type CircuitStep = 'triagem_medica' | 'exames_lab_ecg' | 'agendamento' | 'cardiologista' | 'exame_imagem';

export interface Patient {
  id: string;
  name: string;
  needs_cardio: boolean;
  needs_image_exam: boolean;
  registration_number: string | null;
  created_at: string;
  completed_at: string | null;
  is_completed: boolean;
}

export interface PatientStep {
  id: string;
  patient_id: string;
  step: CircuitStep;
  status: PatientStepStatus;
  called_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  station_number: number | null;
  created_at: string;
}

export interface Station {
  id: string;
  step: CircuitStep;
  station_number: number;
  name: string;
  is_active: boolean;
  current_patient_id: string | null;
  created_at: string;
}

export interface TVCall {
  id: string;
  patient_id: string;
  patient_name: string;
  step: CircuitStep;
  station_number: number;
  station_name: string;
  called_at: string;
  is_active: boolean;
}

export const STEP_LABELS: Record<CircuitStep, string> = {
  triagem_medica: 'Triagem Médica',
  exames_lab_ecg: 'Exames Lab/ECG',
  agendamento: 'Agendamento',
  cardiologista: 'Cardiologista',
  exame_imagem: 'Exame de Imagem',
};

export const STEP_COLORS: Record<CircuitStep, string> = {
  triagem_medica: 'step-triagem',
  exames_lab_ecg: 'step-exames',
  agendamento: 'step-agendamento',
  cardiologista: 'step-cardio',
  exame_imagem: 'step-imagem',
};

export const STATUS_LABELS: Record<PatientStepStatus, string> = {
  pending: 'Aguardando',
  called: 'Chamado',
  in_progress: 'Em Atendimento',
  completed: 'Concluído',
};
