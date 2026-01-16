import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { ClipboardList, FileSearch, MapPin, Loader2 } from 'lucide-react';
import { DischargeOutcome } from '@/types/patient-flow';

interface DischargeOutcomeDialogProps {
  open: boolean;
  patientName: string;
  onConfirm: (outcome: DischargeOutcome) => void;
  isLoading?: boolean;
}

export function DischargeOutcomeDialog({
  open,
  patientName,
  onConfirm,
  isLoading = false,
}: DischargeOutcomeDialogProps) {
  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            Desfecho do Atendimento
          </AlertDialogTitle>
          <AlertDialogDescription className="text-base">
            Qual o desfecho para o paciente <strong className="text-foreground">{patientName}</strong>?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            onClick={() => onConfirm('ALTA')}
            disabled={isLoading}
            className="w-full justify-start gap-2 h-12"
            variant="default"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ClipboardList className="h-4 w-4" />
            )}
            Alta
          </Button>
          <Button
            onClick={() => onConfirm('EXAMES_COMPLEMENTARES')}
            disabled={isLoading}
            className="w-full justify-start gap-2 h-12"
            variant="outline"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileSearch className="h-4 w-4" />
            )}
            Solicitação de Exames Complementares
          </Button>
          <Button
            onClick={() => onConfirm('ACOMPANHAMENTO_AMBULATORIAL')}
            disabled={isLoading}
            className="w-full justify-start gap-2 h-12"
            variant="outline"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MapPin className="h-4 w-4" />
            )}
            Acompanhamento Ambulatorial na Origem
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
