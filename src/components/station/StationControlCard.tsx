import { useState, useEffect, useRef } from 'react';
import { Station, Patient, CircuitStep, STEP_LABELS, MedicalSpecialty, DischargeOutcome } from '@/types/patient-flow';
import { useStationActions } from '@/hooks/useStations';
import { usePatients, usePatientSteps } from '@/hooks/usePatients';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Phone, Play, CheckCircle, ImageIcon, User, Clock, Loader2, AlertTriangle, Heart, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { SurgeryIndicationDialog } from './SurgeryIndicationDialog';
import { DischargeOutcomeDialog } from './DischargeOutcomeDialog';
import { SpecialtySelector } from './SpecialtySelector';

interface StationControlCardProps {
  station: Station;
}

const AUTO_CANCEL_TIMEOUT_MS = 3 * 60 * 1000; // 3 minutes

export function StationControlCard({ station }: StationControlCardProps) {
  const { callNextPatient, startService, finishService, cancelCall, addImageExam, addCardioStep, updateStationSpecialty } = useStationActions(station);
  const { patients, addToPreopCircuit } = usePatients();
  const { steps } = usePatientSteps();
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const autoCancelTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  
  // Surgery indication dialog state
  const [showSurgeryDialog, setShowSurgeryDialog] = useState(false);
  const [showDischargeDialog, setShowDischargeDialog] = useState(false);
  const [pendingFinishPatient, setPendingFinishPatient] = useState<Patient | null>(null);

  const currentPatient = patients.find((p) => p.id === station.current_patient_id);
  const currentStep = currentPatient
    ? steps.find((s) => s.patient_id === currentPatient.id && s.step === station.step)
    : null;

  const isCalled = currentStep?.status === 'called';

  // Auto-cancel timer for called patients
  useEffect(() => {
    if (isCalled && currentStep?.called_at) {
      const calledTime = new Date(currentStep.called_at).getTime();
      const now = Date.now();
      const elapsed = now - calledTime;
      const remaining = AUTO_CANCEL_TIMEOUT_MS - elapsed;

      if (remaining <= 0) {
        // Already expired, cancel immediately
        handleCancel();
      } else {
        // Set remaining time
        setTimeRemaining(Math.ceil(remaining / 1000));

        // Set auto-cancel timer
        autoCancelTimerRef.current = setTimeout(() => {
          handleAutoCancel();
        }, remaining);

        // Start countdown
        countdownRef.current = setInterval(() => {
          setTimeRemaining((prev) => {
            if (prev === null || prev <= 1) {
              return null;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } else {
      setTimeRemaining(null);
    }

    return () => {
      if (autoCancelTimerRef.current) {
        clearTimeout(autoCancelTimerRef.current);
      }
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, [isCalled, currentStep?.called_at]);

  const handleAutoCancel = async () => {
    try {
      await cancelCall.mutateAsync();
      toast.info('Chamada cancelada automaticamente (tempo expirado)');
    } catch (error: any) {
      console.error('Auto-cancel failed:', error);
    }
  };

  // Count pending patients excluding those being served
  const pendingCount = steps.filter((s) => {
    if (s.step !== station.step || s.status !== 'pending') return false;
    const patient = patients.find((p) => p.id === s.patient_id);
    return patient && !patient.is_being_served;
  }).length;

  const handleSpecialtyChange = async (specialty: MedicalSpecialty) => {
    try {
      await updateStationSpecialty.mutateAsync(specialty);
      toast.success('Especialidade atualizada!');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao atualizar especialidade');
    }
  };

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
      // Clear timers
      if (autoCancelTimerRef.current) clearTimeout(autoCancelTimerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
      
      await startService.mutateAsync();
      toast.success('Atendimento iniciado!');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao iniciar atendimento');
    } finally {
      setIsLoading(null);
    }
  };

  const handleFinish = async () => {
    // For specialist station, show surgery indication dialog
    if (station.step === 'especialista' && currentPatient) {
      setPendingFinishPatient(currentPatient);
      setShowSurgeryDialog(true);
      return;
    }

    // For other stations, finish directly
    await performFinish();
  };

  const performFinish = async () => {
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

  const handleSurgeryIndication = async (hasSurgeryIndication: boolean) => {
    if (hasSurgeryIndication) {
      // Has surgery indication - add to pre-op circuit
      setIsLoading('finish');
      try {
        await finishService.mutateAsync();
        if (pendingFinishPatient) {
          await addToPreopCircuit.mutateAsync(pendingFinishPatient.id);
          toast.success('Paciente incluído no circuito pré-operatório!');
        }
      } catch (error: any) {
        toast.error(error.message || 'Erro ao finalizar atendimento');
      } finally {
        setIsLoading(null);
        setShowSurgeryDialog(false);
        setPendingFinishPatient(null);
      }
    } else {
      // No surgery indication - show discharge outcome dialog
      setShowSurgeryDialog(false);
      setShowDischargeDialog(true);
    }
  };

  const handleDischargeOutcome = async (outcome: DischargeOutcome) => {
    setIsLoading('finish');
    try {
      await finishService.mutateAsync();
      
      const outcomeMessages: Record<DischargeOutcome, string> = {
        ALTA: 'Paciente liberado com alta',
        EXAMES_COMPLEMENTARES: 'Paciente encaminhado para exames complementares',
        ACOMPANHAMENTO_AMBULATORIAL: 'Paciente encaminhado para acompanhamento ambulatorial',
      };
      
      toast.success(outcomeMessages[outcome]);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao finalizar atendimento');
    } finally {
      setIsLoading(null);
      setShowDischargeDialog(false);
      setPendingFinishPatient(null);
    }
  };

  const handleCancel = async () => {
    setIsLoading('cancel');
    try {
      // Clear timers
      if (autoCancelTimerRef.current) clearTimeout(autoCancelTimerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
      
      await cancelCall.mutateAsync();
      toast.info('Chamada cancelada - paciente devolvido para a fila');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao cancelar chamada');
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

  const handleAddCardio = async () => {
    if (!currentPatient) return;
    setIsLoading('cardio');
    try {
      await addCardioStep.mutateAsync(currentPatient.id);
      toast.success('Cardiologista adicionado!');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao adicionar cardiologista');
    } finally {
      setIsLoading(null);
    }
  };

  const isIdle = !currentPatient;
  const isInProgress = currentStep?.status === 'in_progress';

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
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
          {/* Specialty selector for specialist stations */}
          {station.step === 'especialista' && (
            <SpecialtySelector
              currentSpecialty={station.current_specialty}
              onSpecialtyChange={handleSpecialtyChange}
              disabled={!!currentPatient}
            />
          )}

          {/* Current patient info */}
          {currentPatient ? (
            <div className={`mb-5 p-4 rounded-lg border ${currentPatient.is_priority ? 'bg-amber-500/10 border-amber-500/50' : 'bg-accent/50'}`}>
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-full ${currentPatient.is_priority ? 'bg-amber-500/20' : 'bg-primary/10'}`}>
                  {currentPatient.is_priority ? (
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                  ) : (
                    <User className="h-5 w-5 text-primary" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-lg">{currentPatient.name}</p>
                    {currentPatient.is_priority && (
                      <Badge className="bg-amber-500 text-white text-xs">PRIORITÁRIO</Badge>
                    )}
                  </div>
                  {currentPatient.registration_number && (
                    <p className="text-sm text-muted-foreground">#{currentPatient.registration_number}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={isCalled ? 'status-called' : 'status-in-progress'}>
                  <Clock className="h-3 w-3 mr-1" />
                  {isCalled ? 'Aguardando chegada' : 'Em atendimento'}
                </Badge>
                {isCalled && timeRemaining !== null && (
                  <Badge variant="outline" className="text-amber-600 border-amber-300">
                    ⏱️ {formatTime(timeRemaining)}
                  </Badge>
                )}
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
              <>
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
                <Button
                  variant="outline"
                  className="w-full h-11 text-destructive border-destructive/50 hover:bg-destructive/10"
                  onClick={handleCancel}
                  disabled={isLoading === 'cancel'}
                >
                  {isLoading === 'cancel' ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <XCircle className="h-4 w-4 mr-2" />
                  )}
                  Cancelar e Devolver para Fila
                </Button>
              </>
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

                <Button
                  variant="outline"
                  className="w-full h-11 text-destructive border-destructive/50 hover:bg-destructive/10"
                  onClick={handleCancel}
                  disabled={isLoading === 'cancel'}
                >
                  {isLoading === 'cancel' ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <XCircle className="h-4 w-4 mr-2" />
                  )}
                  Cancelar e Devolver para Fila
                </Button>

                {station.step === 'triagem_medica' && (
                  <div className="flex gap-2">
                    {!currentPatient.needs_cardio && (
                      <Button
                        variant="outline"
                        className="flex-1 h-11"
                        onClick={handleAddCardio}
                        disabled={isLoading === 'cardio'}
                      >
                        {isLoading === 'cardio' ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Heart className="h-4 w-4 mr-2" />
                        )}
                        + Cardio
                      </Button>
                    )}
                    {!currentPatient.needs_image_exam && (
                      <Button
                        variant="outline"
                        className="flex-1 h-11"
                        onClick={handleAddImageExam}
                        disabled={isLoading === 'image'}
                      >
                        {isLoading === 'image' ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <ImageIcon className="h-4 w-4 mr-2" />
                        )}
                        + Imagem
                      </Button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </Card>

      {/* Surgery Indication Dialog */}
      <SurgeryIndicationDialog
        open={showSurgeryDialog}
        patientName={pendingFinishPatient?.name || ''}
        onConfirm={handleSurgeryIndication}
        isLoading={isLoading === 'finish'}
      />

      {/* Discharge Outcome Dialog */}
      <DischargeOutcomeDialog
        open={showDischargeDialog}
        patientName={pendingFinishPatient?.name || ''}
        onConfirm={handleDischargeOutcome}
        isLoading={isLoading === 'finish'}
      />
    </>
  );
}

function getStepBgClass(step: CircuitStep): string {
  const classes: Record<CircuitStep, string> = {
    triagem_medica: 'bg-step-triagem',
    exames_lab_ecg: 'bg-step-exames',
    agendamento: 'bg-step-agendamento',
    cardiologista: 'bg-step-cardio',
    exame_imagem: 'bg-step-imagem',
    especialista: 'bg-step-especialista',
  };
  return classes[step];
}