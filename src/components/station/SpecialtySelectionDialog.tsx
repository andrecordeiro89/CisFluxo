import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Stethoscope } from 'lucide-react';
import { MedicalSpecialty, SPECIALTY_LABELS } from '@/types/patient-flow';

interface SpecialtySelectionDialogProps {
  open: boolean;
  roomNumber: number;
  onSelect: (specialty: MedicalSpecialty) => void;
  onCancel: () => void;
}

const SPECIALTIES: MedicalSpecialty[] = [
  'ORTOPEDIA',
  'OTORRINO',
  'OFTALMO',
  'TRAUMA',
  'GERAL',
  'UROLOGIA',
  'GINECOLOGIA',
  'CARDIOLOGIA',
  'OUTROS',
];

export function SpecialtySelectionDialog({
  open,
  roomNumber,
  onSelect,
  onCancel,
}: SpecialtySelectionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-primary" />
            Selecione a Especialidade
          </DialogTitle>
          <DialogDescription className="text-base">
            Qual especialidade você vai atender no <strong className="text-foreground">Consultório {roomNumber}</strong>?
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-2 mt-4">
          {SPECIALTIES.map((specialty) => (
            <Button
              key={specialty}
              variant="outline"
              className="h-12 justify-start"
              onClick={() => onSelect(specialty)}
            >
              {SPECIALTY_LABELS[specialty]}
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
