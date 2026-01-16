export type PatientStepStatus = 'pending' | 'called' | 'in_progress' | 'completed';

export type CircuitStep = 'triagem_medica' | 'exames_lab_ecg' | 'agendamento' | 'cardiologista' | 'exame_imagem' | 'especialista';

export type FlowType = 'consulta_especialista' | 'circuito_preop';

export type MedicalSpecialty = 'ORTOPEDIA' | 'OTORRINO' | 'OFTALMO' | 'TRAUMA' | 'GERAL' | 'UROLOGIA' | 'GINECOLOGIA' | 'OUTROS';

export const SPECIALTY_LABELS: Record<MedicalSpecialty, string> = {
  ORTOPEDIA: 'Ortopedia',
  OTORRINO: 'Otorrino',
  OFTALMO: 'Oftalmo',
  TRAUMA: 'Trauma',
  GERAL: 'Geral',
  UROLOGIA: 'Urologia',
  GINECOLOGIA: 'Ginecologia',
  OUTROS: 'Outros',
};

export const FLOW_TYPE_LABELS: Record<FlowType, string> = {
  consulta_especialista: 'Primeira Consulta com Especialista',
  circuito_preop: 'Circuito Pré-Operatório',
};

export interface Patient {
  id: string;
  name: string;
  specialty: MedicalSpecialty;
  needs_cardio: boolean;
  needs_image_exam: boolean;
  registration_number: string | null;
  created_at: string;
  completed_at: string | null;
  is_completed: boolean;
  is_priority: boolean;
  is_being_served: boolean;
  flow_type: FlowType;
  has_surgery_indication: boolean;
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
  current_specialty: MedicalSpecialty | null;
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
  especialista: 'Consulta Especialista',
};

export const STEP_COLORS: Record<CircuitStep, string> = {
  triagem_medica: 'step-triagem',
  exames_lab_ecg: 'step-exames',
  agendamento: 'step-agendamento',
  cardiologista: 'step-cardio',
  exame_imagem: 'step-imagem',
  especialista: 'step-especialista',
};

export const STATUS_LABELS: Record<PatientStepStatus, string> = {
  pending: 'Aguardando',
  called: 'Chamado',
  in_progress: 'Em Atendimento',
  completed: 'Concluído',
};
