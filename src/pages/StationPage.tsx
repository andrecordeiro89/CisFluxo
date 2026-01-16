import { useState, useMemo, useEffect } from 'react';
import { useStations, useStationActions } from '@/hooks/useStations';
import { StationControlCard } from '@/components/station/StationControlCard';
import { SpecialtySelectionDialog } from '@/components/station/SpecialtySelectionDialog';
import { CircuitStep, STEP_LABELS, Station, MedicalSpecialty } from '@/types/patient-flow';
import { Activity, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';

// Pre-operative circuit steps
const PREOP_STEPS: CircuitStep[] = [
  'triagem_medica',
  'exames_lab_ecg',
  'agendamento',
  'cardiologista',
  'exame_imagem',
];

// Consultation room identifiers (we'll show individual rooms)
const CONSULTATION_ROOMS = Array.from({ length: 10 }, (_, i) => i + 1);

type StationSelection = 
  | { type: 'step'; step: CircuitStep }
  | { type: 'consultation'; roomNumber: number };

const StationPage = () => {
  const [selection, setSelection] = useState<StationSelection>({ type: 'consultation', roomNumber: 1 });
  const [showSpecialtyDialog, setShowSpecialtyDialog] = useState(false);
  const [pendingRoomSelection, setPendingRoomSelection] = useState<number | null>(null);
  
  // Fetch all stations
  const { stations: allStations, isLoading } = useStations();

  // Filter stations based on selection
  const filteredStations = useMemo(() => {
    if (selection.type === 'consultation') {
      return allStations.filter(
        (s) => s.step === 'especialista' && s.station_number === selection.roomNumber
      );
    } else {
      return allStations.filter((s) => s.step === selection.step);
    }
  }, [allStations, selection]);

  // Get the current station for specialty update
  const currentStation = useMemo(() => {
    if (selection.type === 'consultation') {
      return allStations.find(
        (s) => s.step === 'especialista' && s.station_number === selection.roomNumber
      );
    }
    return null;
  }, [allStations, selection]);

  // Get display label for current selection
  const getSelectionLabel = () => {
    if (selection.type === 'consultation') {
      const station = allStations.find(
        (s) => s.step === 'especialista' && s.station_number === selection.roomNumber
      );
      const specialtyInfo = station?.current_specialty ? ` (${station.current_specialty})` : '';
      return `Consultório ${selection.roomNumber}${specialtyInfo}`;
    }
    return STEP_LABELS[selection.step];
  };

  const handleRoomSelect = (roomNumber: number) => {
    const station = allStations.find(
      (s) => s.step === 'especialista' && s.station_number === roomNumber
    );
    
    // If station has no specialty set, show the dialog
    if (station && !station.current_specialty) {
      setPendingRoomSelection(roomNumber);
      setShowSpecialtyDialog(true);
    } else {
      setSelection({ type: 'consultation', roomNumber });
    }
  };

  const handleSpecialtySelect = async (specialty: MedicalSpecialty) => {
    if (pendingRoomSelection === null) return;

    const station = allStations.find(
      (s) => s.step === 'especialista' && s.station_number === pendingRoomSelection
    );

    if (station) {
      try {
        const { error } = await supabase
          .from('stations')
          .update({ current_specialty: specialty })
          .eq('id', station.id);

        if (error) throw error;
        
        toast.success(`Especialidade definida para Consultório ${pendingRoomSelection}`);
        setSelection({ type: 'consultation', roomNumber: pendingRoomSelection });
      } catch (error: any) {
        toast.error(error.message || 'Erro ao definir especialidade');
      }
    }

    setShowSpecialtyDialog(false);
    setPendingRoomSelection(null);
  };

  const handleCancelSpecialtyDialog = () => {
    setShowSpecialtyDialog(false);
    setPendingRoomSelection(null);
  };

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
                {getSelectionLabel()}
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[280px] bg-popover">
              <DropdownMenuLabel className="text-muted-foreground">
                Consultórios de Especialistas
              </DropdownMenuLabel>
              {CONSULTATION_ROOMS.map((roomNum) => {
                const station = allStations.find(
                  (s) => s.step === 'especialista' && s.station_number === roomNum
                );
                const specialtyInfo = station?.current_specialty ? ` - ${station.current_specialty}` : '';
                
                return (
                  <DropdownMenuItem
                    key={`room-${roomNum}`}
                    onClick={() => handleRoomSelect(roomNum)}
                    className={`h-10 ${
                      selection.type === 'consultation' && selection.roomNumber === roomNum
                        ? 'bg-accent'
                        : ''
                    }`}
                  >
                    👨‍⚕️ Consultório {roomNum}{specialtyInfo}
                  </DropdownMenuItem>
                );
              })}
              
              <DropdownMenuSeparator />
              
              <DropdownMenuLabel className="text-muted-foreground">
                Circuito Pré-Operatório
              </DropdownMenuLabel>
              {PREOP_STEPS.map((step) => (
                <DropdownMenuItem
                  key={step}
                  onClick={() => setSelection({ type: 'step', step })}
                  className={`h-10 ${
                    selection.type === 'step' && selection.step === step
                      ? 'bg-accent'
                      : ''
                  }`}
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
        ) : filteredStations.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Nenhuma estação configurada para esta etapa</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStations.map((station) => (
              <StationControlCard key={station.id} station={station} />
            ))}
          </div>
        )}
      </div>

      {/* Specialty Selection Dialog */}
      <SpecialtySelectionDialog
        open={showSpecialtyDialog}
        roomNumber={pendingRoomSelection || 1}
        onSelect={handleSpecialtySelect}
        onCancel={handleCancelSpecialtyDialog}
      />
    </div>
  );
};

export default StationPage;
