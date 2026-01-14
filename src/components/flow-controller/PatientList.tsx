import { usePatients, usePatientSteps } from '@/hooks/usePatients';
import { STEP_LABELS, STATUS_LABELS, Patient, PatientStep, CircuitStep } from '@/types/patient-flow';
import { User, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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

  return (
    <div className="p-4 rounded-lg border bg-card hover:shadow-md transition-all animate-slide-in">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-primary/10">
            <User className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h4 className="font-medium">{patient.name}</h4>
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
          <Badge variant="secondary">{STEP_LABELS[inProgressStep.step]}</Badge>
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
            {STEP_LABELS[step.step].split(' ')[0]}
          </span>
        ))}
      </div>
    </div>
  );
}

export function PatientList() {
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

  return (
    <div className="card-elevated p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-display font-semibold">Pacientes no Circuito</h2>
        <Badge variant="outline" className="text-base px-3 py-1">
          {patients.length}
        </Badge>
      </div>

      {patients.length === 0 ? (
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
          <p className="text-muted-foreground">Nenhum paciente no circuito</p>
          <p className="text-sm text-muted-foreground/70">Cadastre um paciente para começar</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
          {patients.map((patient) => (
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
