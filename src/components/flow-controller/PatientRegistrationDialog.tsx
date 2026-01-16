import { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { PatientRegistrationForm } from './PatientRegistrationForm';

interface PatientRegistrationDialogProps {
  disabled?: boolean;
}

export function PatientRegistrationDialog({ disabled }: PatientRegistrationDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          className="gradient-primary gap-2" 
          disabled={disabled}
        >
          <UserPlus className="h-4 w-4" />
          Novo Cadastro
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">Cadastrar Paciente</DialogTitle>
        </DialogHeader>
        <PatientRegistrationForm onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
