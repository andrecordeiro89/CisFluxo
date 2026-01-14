import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CircuitStep } from '@/types/patient-flow';
import { useEffect } from 'react';

interface QueueStats {
  step: CircuitStep;
  pending: number;
  in_progress: number;
  completed: number;
}

export function useQueueStats() {
  const queryClient = useQueryClient();

  const { data: stats = [], isLoading } = useQuery({
    queryKey: ['queue-stats'],
    queryFn: async () => {
      const steps: CircuitStep[] = [
        'triagem_medica',
        'exames_lab_ecg',
        'agendamento',
        'cardiologista',
        'exame_imagem',
      ];

      const statsPromises = steps.map(async (step) => {
        const { data: pending } = await supabase
          .from('patient_steps')
          .select('id', { count: 'exact' })
          .eq('step', step)
          .eq('status', 'pending');

        const { data: inProgress } = await supabase
          .from('patient_steps')
          .select('id', { count: 'exact' })
          .eq('step', step)
          .in('status', ['called', 'in_progress']);

        const { data: completed } = await supabase
          .from('patient_steps')
          .select('id', { count: 'exact' })
          .eq('step', step)
          .eq('status', 'completed');

        return {
          step,
          pending: pending?.length || 0,
          in_progress: inProgress?.length || 0,
          completed: completed?.length || 0,
        };
      });

      return Promise.all(statsPromises);
    },
  });

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('queue-stats-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'patient_steps' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['queue-stats'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return { stats, isLoading };
}
