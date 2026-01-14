import { useState } from 'react';
import { Station, Patient, CircuitStep, STEP_LABELS } from '@/types/patient-flow';
import { useStationActions } from '@/hooks/useStations';
import { usePatients, usePatientSteps } from '@/hooks/usePatients';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Phone, Play, CheckCircle, ImageIcon, User, Clock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface StationControlCardProps {
  station: Station;
}

export function StationControlCard({ station }: StationControlCardProps) {
  const { callNextPatient, startService, finishService, addImageExam } = useStationActions(station);
  const { patients } = usePatients();
  const { steps } = usePatientSteps();
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const currentPatient = patients.find((p) => p.id === station.current_patient_id);
  const currentStep = currentPatient
    ? steps.find((s) => s.patient_id === currentPatient.id && s.step === station.step)
    : null;

  const pendingCount = steps.filter(
    (s) => s.step === station.step && s.status === 'pending'
  ).length;

  const handleCall = async () => {
    setIsLoading('call');
    try {
      await callNextPatient.mutateAsync();
      toast.success('Paciente chamado!');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao chamar paciente');
    } finally {
      setIsLoading(null);
    }
  };

  const handleStart = async () => {
    setIsLoading('start');
    try {
      await startService.mutateAsync();
      toast.success('Atendimento iniciado!');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao iniciar atendimento');
    } finally {
      setIsLoading(null);
    }
  };

  const handleFinish = async () => {
    setIsLoading('finish');
    try {
      await finishService.mutateAsync();
      toast.success('Atendimento finalizado!');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao finalizar atendimento');
    } finally {
      setIsLoading(null);
    }
  };

  const handleAddImageExam = async () => {
    if (!currentPatient) return;
    setIsLoading('image');
    try {
      await addImageExam.mutateAsync(currentPatient.id);
      toast.success('Exame de imagem adicionado!');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao adicionar exame');
    } finally {
      setIsLoading(null);
    }
  };

  const isIdle = !currentPatient;
  const isCalled = currentStep?.status === 'called';
  const isInProgress = currentStep?.status === 'in_progress';

  return (
    <Card className="card-elevated overflow-hidden">
      {/* Header */}
      <div className={`p-4 ${getStepBgClass(station.step)}`}>
        <div className="flex items-center justify-between">
          <h3 className="font-display font-semibold text-primary-foreground text-lg">
            {station.name}
          </h3>
          <Badge variant="secondary" className="bg-white/20 text-white border-0">
            {pendingCount} na fila
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Current patient info */}
        {currentPatient ? (
          <div className="mb-5 p-4 rounded-lg bg-accent/50 border">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-full bg-primary/10">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-lg">{currentPatient.name}</p>
                {currentPatient.registration_number && (
                  <p className="text-sm text-muted-foreground">#{currentPatient.registration_number}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={isCalled ? 'status-called' : 'status-in-progress'}>
                <Clock className="h-3 w-3 mr-1" />
                {isCalled ? 'Aguardando chegada' : 'Em atendimento'}
              </Badge>
            </div>
          </div>
        ) : (
          <div className="mb-5 p-4 rounded-lg border border-dashed text-center">
            <p className="text-muted-foreground">Nenhum paciente em atendimento</p>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          {isIdle && (
            <Button
              className="w-full h-12 text-base gradient-primary"
              onClick={handleCall}
              disabled={isLoading === 'call' || pendingCount === 0}
            >
              {isLoading === 'call' ? (
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              ) : (
                <Phone className="h-5 w-5 mr-2" />
              )}
              Chamar Próximo
            </Button>
          )}

          {isCalled && (
            <Button
              className="w-full h-12 text-base bg-status-in-progress hover:bg-status-in-progress/90"
              onClick={handleStart}
              disabled={isLoading === 'start'}
            >
              {isLoading === 'start' ? (
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              ) : (
                <Play className="h-5 w-5 mr-2" />
              )}
              Iniciar Atendimento
            </Button>
          )}

          {isInProgress && (
            <>
              <Button
                className="w-full h-12 text-base bg-status-completed hover:bg-status-completed/90"
                onClick={handleFinish}
                disabled={isLoading === 'finish'}
              >
                {isLoading === 'finish' ? (
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="h-5 w-5 mr-2" />
                )}
                Finalizar Atendimento
              </Button>

              {!currentPatient.needs_image_exam && (
                <Button
                  variant="outline"
                  className="w-full h-11"
                  onClick={handleAddImageExam}
                  disabled={isLoading === 'image'}
                >
                  {isLoading === 'image' ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <ImageIcon className="h-4 w-4 mr-2" />
                  )}
                  Adicionar Exame de Imagem
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </Card>
  );
}

function getStepBgClass(step: CircuitStep): string {
  const classes: Record<CircuitStep, string> = {
    triagem_medica: 'bg-step-triagem',
    exames_lab_ecg: 'bg-step-exames',
    agendamento: 'bg-step-agendamento',
    cardiologista: 'bg-step-cardio',
    exame_imagem: 'bg-step-imagem',
  };
  return classes[step];
}
