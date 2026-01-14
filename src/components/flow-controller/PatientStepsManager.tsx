import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Settings, CheckCircle, XCircle, Plus, Trash2, User } from 'lucide-react';
import { usePatients, usePatientSteps } from '@/hooks/usePatients';
import { STEP_LABELS, STATUS_LABELS, CircuitStep, Patient, PatientStep } from '@/types/patient-flow';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const ALL_STEPS: CircuitStep[] = [
  'triagem_medica',
  'exames_lab_ecg',
  'agendamento',
  'cardiologista',
  'exame_imagem',
];

interface PatientStepItemProps {
  step: PatientStep;
  onComplete: () => void;
  onRemove: () => void;
  isLoading: boolean;
}

function PatientStepItem({ step, onComplete, onRemove, isLoading }: PatientStepItemProps) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
      <div className="flex items-center gap-3">
        <span className="font-medium">{STEP_LABELS[step.step]}</span>
        <Badge 
          variant={step.status === 'completed' ? 'default' : 'secondary'}
          className={step.status === 'completed' ? 'bg-status-completed text-white' : ''}
        >
          {STATUS_LABELS[step.status]}
        </Badge>
      </div>
      <div className="flex items-center gap-2">
        {step.status !== 'completed' && (
          <Button 
            size="sm" 
            variant="outline" 
            onClick={onComplete}
            disabled={isLoading}
            className="text-status-completed hover:bg-status-completed/10"
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            Concluir
          </Button>
        )}
        <Button 
          size="sm" 
          variant="ghost" 
          onClick={onRemove}
          disabled={isLoading}
          className="text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

interface PatientManagerProps {
  patient: Patient;
  steps: PatientStep[];
}

function PatientManager({ patient, steps }: PatientManagerProps) {
  const [newStep, setNewStep] = useState<CircuitStep | ''>('');
  const queryClient = useQueryClient();

  const existingStepTypes = steps.map(s => s.step);
  const availableSteps = ALL_STEPS.filter(s => !existingStepTypes.includes(s));

  const completeStep = useMutation({
    mutationFn: async (stepId: string) => {
      const { error } = await supabase
        .from('patient_steps')
        .update({ 
          status: 'completed', 
          completed_at: new Date().toISOString(),
          started_at: new Date().toISOString() // Set started_at if not set
        })
        .eq('id', stepId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-steps'] });
      queryClient.invalidateQueries({ queryKey: ['queue-stats'] });
      toast.success('Etapa marcada como concluída');
    },
    onError: () => {
      toast.error('Erro ao concluir etapa');
    },
  });

  const removeStep = useMutation({
    mutationFn: async (stepId: string) => {
      const { error } = await supabase
        .from('patient_steps')
        .delete()
        .eq('id', stepId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-steps'] });
      queryClient.invalidateQueries({ queryKey: ['queue-stats'] });
      toast.success('Etapa removida');
    },
    onError: () => {
      toast.error('Erro ao remover etapa');
    },
  });

  const addStep = useMutation({
    mutationFn: async (step: CircuitStep) => {
      const { error } = await supabase
        .from('patient_steps')
        .insert({ patient_id: patient.id, step });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-steps'] });
      queryClient.invalidateQueries({ queryKey: ['queue-stats'] });
      setNewStep('');
      toast.success('Etapa adicionada');
    },
    onError: () => {
      toast.error('Erro ao adicionar etapa');
    },
  });

  const isLoading = completeStep.isPending || removeStep.isPending || addStep.isPending;

  return (
    <div className="border rounded-lg p-4 space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-full bg-primary/10">
          <User className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h4 className="font-semibold">{patient.name}</h4>
          {patient.registration_number && (
            <p className="text-sm text-muted-foreground">#{patient.registration_number}</p>
          )}
        </div>
        {patient.is_priority && (
          <Badge className="bg-amber-500 text-white">Prioritário</Badge>
        )}
      </div>

      <div className="space-y-2">
        {steps.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhuma etapa cadastrada
          </p>
        ) : (
          steps.map((step) => (
            <PatientStepItem
              key={step.id}
              step={step}
              onComplete={() => completeStep.mutate(step.id)}
              onRemove={() => removeStep.mutate(step.id)}
              isLoading={isLoading}
            />
          ))
        )}
      </div>

      {availableSteps.length > 0 && (
        <div className="flex items-center gap-2 pt-2 border-t">
          <Select value={newStep} onValueChange={(v) => setNewStep(v as CircuitStep)}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Adicionar etapa..." />
            </SelectTrigger>
            <SelectContent>
              {availableSteps.map((step) => (
                <SelectItem key={step} value={step}>
                  {STEP_LABELS[step]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            onClick={() => newStep && addStep.mutate(newStep)}
            disabled={!newStep || isLoading}
          >
            <Plus className="h-4 w-4 mr-1" />
            Adicionar
          </Button>
        </div>
      )}
    </div>
  );
}

export function PatientStepsManager() {
  const { patients } = usePatients();
  const { steps } = usePatientSteps();

  const getPatientSteps = (patientId: string) => {
    return steps.filter((s) => s.patient_id === patientId);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Settings className="h-4 w-4 mr-2" />
          Gerenciar Etapas
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Gerenciar Etapas dos Pacientes
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {patients.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Nenhum paciente no circuito
            </p>
          ) : (
            patients.map((patient) => (
              <PatientManager
                key={patient.id}
                patient={patient}
                steps={getPatientSteps(patient.id)}
              />
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
