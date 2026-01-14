import { PatientRegistrationForm } from '@/components/flow-controller/PatientRegistrationForm';
import { QueueOverview } from '@/components/flow-controller/QueueOverview';
import { PatientList } from '@/components/flow-controller/PatientList';
import { Activity } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const FlowController = () => {
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
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Registration */}
          <div className="lg:col-span-1">
            <PatientRegistrationForm />
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
};

export default FlowController;
