import { useState } from 'react';
import { useStations } from '@/hooks/useStations';
import { StationControlCard } from '@/components/station/StationControlCard';
import { CircuitStep, STEP_LABELS } from '@/types/patient-flow';
import { Activity, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const AVAILABLE_STEPS: CircuitStep[] = [
  'especialista',
  'triagem_medica',
  'exames_lab_ecg',
  'agendamento',
  'cardiologista',
  'exame_imagem',
];

const StationPage = () => {
  const [selectedStep, setSelectedStep] = useState<CircuitStep>('especialista');
  const { stations, isLoading } = useStations(selectedStep);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg gradient-primary">
              <Activity className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display font-bold text-xl">Estação de Atendimento</h1>
              <p className="text-sm text-muted-foreground">Circuito Pré-Operatório</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link to="/">Controlador</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/tv">TV</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Step selector */}
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <label className="text-sm text-muted-foreground mb-2 block">Selecione a etapa:</label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full md:w-auto h-12 text-base justify-between min-w-[280px]">
                {STEP_LABELS[selectedStep]}
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[280px]">
              {AVAILABLE_STEPS.map((step) => (
                <DropdownMenuItem
                  key={step}
                  onClick={() => setSelectedStep(step)}
                  className="h-10"
                >
                  {STEP_LABELS[step]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Stations grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2].map((i) => (
              <div key={i} className="h-80 bg-muted rounded-xl animate-pulse" />
            ))}
          </div>
        ) : stations.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Nenhuma estação configurada para esta etapa</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stations.map((station) => (
              <StationControlCard key={station.id} station={station} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StationPage;
