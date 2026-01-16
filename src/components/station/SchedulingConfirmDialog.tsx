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
import { Calendar, CalendarX } from 'lucide-react';

interface SchedulingConfirmDialogProps {
  open: boolean;
  onConfirm: (hasScheduledDate: boolean) => void;
  patientName?: string;
}

export function SchedulingConfirmDialog({ 
  open, 
  onConfirm,
  patientName 
}: SchedulingConfirmDialogProps) {
  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Confirmação de Agendamento
          </AlertDialogTitle>
          <AlertDialogDescription className="text-base">
            {patientName ? (
              <>O paciente <strong>{patientName}</strong> teve a data de cirurgia definida?</>
            ) : (
              'O paciente teve a data de cirurgia definida?'
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel 
            onClick={() => onConfirm(false)}
            className="bg-amber-500 text-white hover:bg-amber-600 border-0 flex items-center gap-2"
          >
            <CalendarX className="h-4 w-4" />
            Não - Pendente de Agenda
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={() => onConfirm(true)}
            className="bg-status-completed hover:bg-status-completed/90 flex items-center gap-2"
          >
            <Calendar className="h-4 w-4" />
            Sim - Data Definida
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
