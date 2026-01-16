import { usePatients, usePatientSteps } from '@/hooks/usePatients';
import { STEP_LABELS, SPECIALTY_LABELS, STATUS_LABELS, Patient, PatientStep, CircuitStep } from '@/types/patient-flow';
import { User, Clock, CheckCircle2, AlertCircle, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { QueueFilterOption } from './QueueFilter';

function getPatientProgress(steps: PatientStep[]) {
  const completed = steps.filter((s) => s.status === 'completed').length;
  const total = steps.length;
  return { completed, total, percentage: total > 0 ? (completed / total) * 100 : 0 };
}

interface PatientCardProps {
  patient: Patient;
  steps: PatientStep[];
}

function PatientCard({ patient, steps }: PatientCardProps) {
  const progress = getPatientProgress(steps);
  const inProgressStep = steps.find((s) => s.status === 'in_progress' || s.status === 'called');

  // Get display label for step - show specialty for specialist step
  const getStepDisplayLabel = (step: CircuitStep) => {
    if (step === 'especialista') {
      return `Consulta ${SPECIALTY_LABELS[patient.specialty]}`;
    }
    return STEP_LABELS[step];
  };

  // Get short label for badge
  const getShortStepLabel = (step: CircuitStep) => {
    if (step === 'especialista') {
      return SPECIALTY_LABELS[patient.specialty];
    }
    return STEP_LABELS[step].split(' ')[0];
  };

  return (
    <div className={`p-4 rounded-lg border bg-card hover:shadow-md transition-all animate-slide-in ${patient.is_priority ? 'border-amber-500/50 bg-amber-500/5' : ''}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full ${patient.is_priority ? 'bg-amber-500/20' : 'bg-primary/10'}`}>
            {patient.is_priority ? (
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            ) : (
              <User className="h-4 w-4 text-primary" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              {patient.is_priority && (
                <Badge className="bg-amber-500 text-white text-xs px-1.5 py-0">⚡ PRIORITÁRIO</Badge>
              )}
              <h4 className="font-medium">{patient.name}</h4>
            </div>
            {patient.registration_number && (
              <p className="text-sm text-muted-foreground">#{patient.registration_number}</p>
            )}
          </div>
        </div>
        <span className="text-xs text-muted-foreground">
          {new Date(patient.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>{progress.completed}/{progress.total} etapas</span>
          <span>{Math.round(progress.percentage)}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full gradient-primary transition-all duration-500"
            style={{ width: `${progress.percentage}%` }}
          />
        </div>
      </div>

      {/* Current status */}
      {inProgressStep && (
        <div className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-status-in-progress" />
          <span className="text-muted-foreground">Em:</span>
          <Badge variant="secondary">{getStepDisplayLabel(inProgressStep.step)}</Badge>
        </div>
      )}

      {/* Step indicators */}
      <div className="flex flex-wrap gap-1.5 mt-3">
        {steps.map((step) => (
          <span
            key={step.id}
            className={`status-badge text-xs ${
              step.status === 'completed'
                ? 'status-completed'
                : step.status === 'in_progress' || step.status === 'called'
                ? 'status-in-progress'
                : 'status-pending'
            }`}
          >
            {step.status === 'completed' && <CheckCircle2 className="h-3 w-3" />}
            {(step.status === 'in_progress' || step.status === 'called') && <Clock className="h-3 w-3" />}
            {getShortStepLabel(step.step)}
          </span>
        ))}
      </div>
    </div>
  );
}

interface PatientListProps {
  filter: QueueFilterOption;
}

export function PatientList({ filter }: PatientListProps) {
  const { patients, isLoading } = usePatients();
  const { steps } = usePatientSteps();

  if (isLoading) {
    return (
      <div className="card-elevated p-6">
        <div className="h-6 bg-muted rounded w-1/3 mb-4" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-muted rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const getPatientSteps = (patientId: string) => {
    return steps.filter((s) => s.patient_id === patientId);
  };

  // Filter patients based on selected step filter
  const filteredPatients = filter === 'all' 
    ? patients 
    : patients.filter(patient => {
        const patientSteps = getPatientSteps(patient.id);
        // Show patient if they have a pending or in_progress step for the selected filter
        return patientSteps.some(s => s.step === filter && (s.status === 'pending' || s.status === 'in_progress' || s.status === 'called'));
      });

  // Sort patients by priority first, then by created_at
  const sortedPatients = [...filteredPatients].sort((a, b) => {
    if (a.is_priority !== b.is_priority) {
      return a.is_priority ? -1 : 1;
    }
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });

  const title = filter === 'all' 
    ? 'Pacientes no Circuito' 
    : `Pacientes: ${STEP_LABELS[filter]}`;

  return (
    <div className="card-elevated p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-display font-semibold">{title}</h2>
        <Badge variant="outline" className="text-base px-3 py-1">
          {sortedPatients.length}
        </Badge>
      </div>

      {sortedPatients.length === 0 ? (
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
          <p className="text-muted-foreground">
            {filter === 'all' ? 'Nenhum paciente no circuito' : `Nenhum paciente aguardando nesta etapa`}
          </p>
          <p className="text-sm text-muted-foreground/70">
            {filter === 'all' ? 'Cadastre um paciente para começar' : 'Selecione outra etapa ou visualize todas'}
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
          {sortedPatients.map((patient) => (
            <PatientCard
              key={patient.id}
              patient={patient}
              steps={getPatientSteps(patient.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
