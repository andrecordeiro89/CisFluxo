import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar, CalendarX, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SchedulingConfirmDialogProps {
  open: boolean;
  onConfirm: (hasScheduledDate: boolean, reason?: string) => void;
  patientName?: string;
}

export function SchedulingConfirmDialog({ 
  open, 
  onConfirm,
  patientName 
}: SchedulingConfirmDialogProps) {
  const [showReasonInput, setShowReasonInput] = useState(false);
  const [reason, setReason] = useState('');

  const handleNoSchedule = () => {
    setShowReasonInput(true);
  };

  const handleConfirmNoSchedule = () => {
    if (reason.trim()) {
      onConfirm(false, reason.trim());
      setShowReasonInput(false);
      setReason('');
    }
  };

  const handleYesSchedule = () => {
    onConfirm(true);
    setShowReasonInput(false);
    setReason('');
  };

  const handleBack = () => {
    setShowReasonInput(false);
    setReason('');
  };

  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            {showReasonInput ? 'Justificativa' : 'Confirmação de Agendamento'}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-base">
            {showReasonInput ? (
              <>Informe o motivo pelo qual a data de cirurgia não foi definida para <strong>{patientName || 'o paciente'}</strong>:</>
            ) : (
              patientName ? (
                <>O paciente <strong>{patientName}</strong> teve a data de cirurgia definida?</>
              ) : (
                'O paciente teve a data de cirurgia definida?'
              )
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {showReasonInput ? (
          <div className="py-4">
            <Label htmlFor="reason" className="text-sm font-medium mb-2 block">
              Justificativa *
            </Label>
            <Textarea
              id="reason"
              placeholder="Ex: Aguardando resultado de exames, Agenda do centro cirúrgico lotada, Paciente precisa ajustar medicação..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
        ) : null}

        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          {showReasonInput ? (
            <>
              <Button
                variant="outline"
                onClick={handleBack}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
              <AlertDialogAction 
                onClick={handleConfirmNoSchedule}
                disabled={!reason.trim()}
                className="bg-amber-500 hover:bg-amber-600 flex items-center gap-2"
              >
                <CalendarX className="h-4 w-4" />
                Confirmar Pendência
              </AlertDialogAction>
            </>
          ) : (
            <>
              <AlertDialogCancel 
                onClick={handleNoSchedule}
                className="bg-amber-500 text-white hover:bg-amber-600 border-0 flex items-center gap-2"
              >
                <CalendarX className="h-4 w-4" />
                Não - Pendente de Agenda
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleYesSchedule}
                className="bg-status-completed hover:bg-status-completed/90 flex items-center gap-2"
              >
                <Calendar className="h-4 w-4" />
                Sim - Data Definida
              </AlertDialogAction>
            </>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
