import { CircuitStep, STEP_LABELS } from '@/types/patient-flow';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, ListFilter } from 'lucide-react';

export type QueueFilterOption = 'all' | CircuitStep;

interface QueueFilterProps {
  selectedFilter: QueueFilterOption;
  onFilterChange: (filter: QueueFilterOption) => void;
}

const STEPS: CircuitStep[] = [
  'triagem_medica',
  'exames_lab_ecg',
  'agendamento',
  'cardiologista',
  'exame_imagem',
  'especialista',
];

export function QueueFilter({ selectedFilter, onFilterChange }: QueueFilterProps) {
  const getLabel = () => {
    if (selectedFilter === 'all') {
      return 'Todas as Filas';
    }
    return STEP_LABELS[selectedFilter];
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="h-10 gap-2">
          <ListFilter className="h-4 w-4" />
          {getLabel()}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[220px] bg-popover">
        <DropdownMenuLabel className="text-muted-foreground">
          Filtrar por Fila
        </DropdownMenuLabel>
        <DropdownMenuItem
          onClick={() => onFilterChange('all')}
          className={`h-10 ${selectedFilter === 'all' ? 'bg-accent' : ''}`}
        >
          📋 Todas as Filas (Resumo)
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {STEPS.map((step) => (
          <DropdownMenuItem
            key={step}
            onClick={() => onFilterChange(step)}
            className={`h-10 ${selectedFilter === step ? 'bg-accent' : ''}`}
          >
            {STEP_LABELS[step]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
