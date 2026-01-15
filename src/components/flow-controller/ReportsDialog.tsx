import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { BarChart3, Clock, Users, CheckCircle, AlertTriangle } from 'lucide-react';
import { useSelectedDate } from '@/contexts/DateContext';
import { useReports, StepReport } from '@/hooks/useReports';
import { STEP_LABELS, CircuitStep } from '@/types/patient-flow';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Progress } from '@/components/ui/progress';

const stepIcons: Record<CircuitStep, string> = {
  triagem_medica: '🩺',
  exames_lab_ecg: '🧪',
  agendamento: '📅',
  cardiologista: '❤️',
  exame_imagem: '📷',
  especialista: '👨‍⚕️',
};

function StepReportCard({ report }: { report: StepReport }) {
  const maxTime = 60; // Assume 60 min as max for progress display
  const percentOfMax = Math.min((report.avgTimeMinutes / maxTime) * 100, 100);
  const isBottleneck = report.avgTimeMinutes > 30 && report.total > 0;

  return (
    <div className={`p-4 rounded-lg border ${isBottleneck ? 'border-amber-500 bg-amber-50/50' : 'bg-card'}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{stepIcons[report.step]}</span>
          <span className="font-medium">{STEP_LABELS[report.step]}</span>
        </div>
        {isBottleneck && (
          <div className="flex items-center gap-1 text-amber-600 text-sm">
            <AlertTriangle className="h-4 w-4" />
            <span>Gargalo</span>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-4 gap-3 text-sm">
        <div>
          <p className="text-muted-foreground">Atendimentos</p>
          <p className="font-semibold text-lg">{report.total}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Tempo Médio</p>
          <p className="font-semibold text-lg">{report.avgTimeMinutes} min</p>
        </div>
        <div>
          <p className="text-muted-foreground">Mínimo</p>
          <p className="font-semibold">{report.minTimeMinutes} min</p>
        </div>
        <div>
          <p className="text-muted-foreground">Máximo</p>
          <p className="font-semibold">{report.maxTimeMinutes} min</p>
        </div>
      </div>

      {report.total > 0 && (
        <div className="mt-3">
          <Progress value={percentOfMax} className="h-2" />
        </div>
      )}
    </div>
  );
}

export function ReportsDialog() {
  const { selectedDate, startOfSelectedDay, endOfSelectedDay } = useSelectedDate();
  const { data: report, isLoading } = useReports(startOfSelectedDay, endOfSelectedDay);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
          <BarChart3 className="h-4 w-4 mr-2" />
          Relatórios
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Relatório do Dia - {format(selectedDate, "dd 'de' MMMM, yyyy", { locale: ptBR })}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-muted rounded animate-pulse" />
            ))}
          </div>
        ) : report ? (
          <div className="space-y-6">
            {/* Summary */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="h-5 w-5 text-primary" />
                  <span className="text-muted-foreground">Total de Pacientes</span>
                </div>
                <p className="text-3xl font-bold text-primary">{report.totalPatients}</p>
              </div>
              
              <div className="p-4 rounded-lg bg-status-completed-bg border border-status-completed/20">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="h-5 w-5 text-status-completed" />
                  <span className="text-muted-foreground">Circuitos Completos</span>
                </div>
                <p className="text-3xl font-bold text-status-completed">{report.completedPatients}</p>
              </div>
            </div>

            {/* Step reports */}
            <div>
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Tempo por Estação
              </h3>
              <div className="space-y-3">
                {report.stepReports.map((stepReport) => (
                  <StepReportCard key={stepReport.step} report={stepReport} />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-8">Nenhum dado disponível</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
