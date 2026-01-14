import { DateProvider } from '@/contexts/DateContext';
import { PatientRegistrationForm } from '@/components/flow-controller/PatientRegistrationForm';
import { QueueOverview } from '@/components/flow-controller/QueueOverview';
import { PatientList } from '@/components/flow-controller/PatientList';
import { DatePicker } from '@/components/flow-controller/DatePicker';
import { ReportsDialog } from '@/components/flow-controller/ReportsDialog';
import { PatientStepsManager } from '@/components/flow-controller/PatientStepsManager';
import { Activity } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useSelectedDate } from '@/contexts/DateContext';

function FlowControllerContent() {
  const { isToday } = useSelectedDate();

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
              <h1 className="font-display font-bold text-xl">Controlador de Fluxo</h1>
              <p className="text-sm text-muted-foreground">Circuito Pré-Operatório</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link to="/estacao">Estações</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/tv">TV</Link>
            </Button>
          </div>
        </div>

        {/* Date picker and actions bar */}
        <div className="container mx-auto px-4 py-3 border-t bg-muted/30 flex items-center justify-between flex-wrap gap-4">
          <DatePicker />
          <div className="flex items-center gap-2">
            <PatientStepsManager />
            <ReportsDialog />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-6">
        {!isToday && (
          <div className="mb-6 p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-800">
            <p className="text-sm">
              📅 Você está visualizando um dia anterior. O cadastro de novos pacientes está desabilitado.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Registration (only for today) */}
          <div className="lg:col-span-1">
            {isToday ? (
              <PatientRegistrationForm />
            ) : (
              <div className="card-elevated p-6 text-center text-muted-foreground">
                <p>Cadastro disponível apenas para o dia atual</p>
              </div>
            )}
          </div>

          {/* Middle column - Queue Overview */}
          <div className="lg:col-span-1">
            <QueueOverview />
          </div>

          {/* Right column - Patient List */}
          <div className="lg:col-span-1">
            <PatientList />
          </div>
        </div>
      </main>
    </div>
  );
}

const FlowController = () => {
  return (
    <DateProvider>
      <FlowControllerContent />
    </DateProvider>
  );
};

export default FlowController;
