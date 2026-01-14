import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TVCall } from '@/types/patient-flow';
import { useEffect } from 'react';

export function useTVCalls() {
  const queryClient = useQueryClient();

  const { data: calls = [], isLoading } = useQuery({
    queryKey: ['tv-calls'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tv_calls')
        .select('*')
        .eq('is_active', true)
        .order('called_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data as TVCall[];
    },
    refetchInterval: 5000, // Refresh every 5 seconds as backup
  });

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('tv-calls-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tv_calls' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['tv-calls'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return { calls, isLoading };
}
