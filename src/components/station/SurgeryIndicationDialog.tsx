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
import { Scissors, XCircle } from 'lucide-react';

interface SurgeryIndicationDialogProps {
  open: boolean;
  patientName: string;
  onConfirm: (hasSurgeryIndication: boolean) => void;
  isLoading?: boolean;
}

export function SurgeryIndicationDialog({
  open,
  patientName,
  onConfirm,
  isLoading = false,
}: SurgeryIndicationDialogProps) {
  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Scissors className="h-5 w-5 text-primary" />
            Indicação de Cirurgia
          </AlertDialogTitle>
          <AlertDialogDescription className="text-base">
            O paciente <strong className="text-foreground">{patientName}</strong> teve indicação de cirurgia?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:gap-0">
          <AlertDialogCancel 
            onClick={() => onConfirm(false)} 
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <XCircle className="h-4 w-4" />
            Não
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => onConfirm(true)}
            disabled={isLoading}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90"
          >
            <Scissors className="h-4 w-4" />
            {isLoading ? 'Processando...' : 'Sim, tem indicação'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}