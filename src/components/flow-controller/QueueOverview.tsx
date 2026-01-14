import { useQueueStats } from '@/hooks/useQueueStats';
import { STEP_LABELS, CircuitStep } from '@/types/patient-flow';
import { Users, Clock, CheckCircle } from 'lucide-react';

const stepIcons: Record<CircuitStep, string> = {
  triagem_medica: '🩺',
  exames_lab_ecg: '🧪',
  agendamento: '📅',
  cardiologista: '❤️',
  exame_imagem: '📷',
};

export function QueueOverview() {
  const { stats, isLoading } = useQueueStats();

  if (isLoading) {
    return (
      <div className="card-elevated p-6 animate-pulse">
        <div className="h-6 bg-muted rounded w-1/3 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-muted rounded" />
          ))}
        </div>
      </div>
    );
  }

  const totalPending = stats.reduce((acc, s) => acc + s.pending, 0);
  const totalInProgress = stats.reduce((acc, s) => acc + s.in_progress, 0);
  const totalCompleted = stats.reduce((acc, s) => acc + s.completed, 0);

  return (
    <div className="card-elevated p-6 animate-fade-in">
      <h2 className="text-xl font-display font-semibold mb-6">Visão Geral do Fluxo</h2>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-4 rounded-lg bg-status-pending-bg border border-status-pending/20">
          <div className="flex items-center gap-2 mb-1">
            <Users className="h-4 w-4 text-status-pending" />
            <span className="text-sm text-muted-foreground">Aguardando</span>
          </div>
          <p className="text-2xl font-display font-bold text-status-pending">{totalPending}</p>
        </div>

        <div className="p-4 rounded-lg bg-status-in-progress-bg border border-status-in-progress/20">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="h-4 w-4 text-status-in-progress" />
            <span className="text-sm text-muted-foreground">Em Atend.</span>
          </div>
          <p className="text-2xl font-display font-bold text-status-in-progress">{totalInProgress}</p>
        </div>

        <div className="p-4 rounded-lg bg-status-completed-bg border border-status-completed/20">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="h-4 w-4 text-status-completed" />
            <span className="text-sm text-muted-foreground">Concluídos</span>
          </div>
          <p className="text-2xl font-display font-bold text-status-completed">{totalCompleted}</p>
        </div>
      </div>

      {/* Per-step breakdown */}
      <div className="space-y-3">
        {stats.map((stat) => (
          <div
            key={stat.step}
            className="flex items-center gap-4 p-3 rounded-lg border bg-card hover:bg-accent/30 transition-colors"
          >
            <span className="text-2xl">{stepIcons[stat.step]}</span>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{STEP_LABELS[stat.step]}</p>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="status-pending min-w-[3rem] text-center">{stat.pending}</span>
              <span className="status-in-progress min-w-[3rem] text-center">{stat.in_progress}</span>
              <span className="status-completed min-w-[3rem] text-center">{stat.completed}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
