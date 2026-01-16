import { MedicalSpecialty, SPECIALTY_LABELS } from '@/types/patient-flow';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Stethoscope } from 'lucide-react';

interface SpecialtySelectorProps {
  currentSpecialty: MedicalSpecialty | null;
  onSpecialtyChange: (specialty: MedicalSpecialty) => void;
  disabled?: boolean;
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

export function SpecialtySelector({
  currentSpecialty,
  onSpecialtyChange,
  disabled = false,
}: SpecialtySelectorProps) {
  return (
    <div className="mb-4 p-3 rounded-lg border bg-accent/30">
      <div className="flex items-center gap-2 mb-2">
        <Stethoscope className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">Especialidade deste consultório:</span>
      </div>
      <Select 
        value={currentSpecialty || undefined} 
        onValueChange={(value) => onSpecialtyChange(value as MedicalSpecialty)}
        disabled={disabled}
      >
        <SelectTrigger className="w-full h-10 bg-background">
          <SelectValue placeholder="Selecione a especialidade" />
        </SelectTrigger>
        <SelectContent className="bg-popover">
          {SPECIALTIES.map((specialty) => (
            <SelectItem key={specialty} value={specialty}>
              {SPECIALTY_LABELS[specialty]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
