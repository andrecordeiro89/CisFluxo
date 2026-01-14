import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Station, CircuitStep, Patient, PatientStep } from '@/types/patient-flow';
import { useEffect } from 'react';

export function useStations(step?: CircuitStep) {
  const queryClient = useQueryClient();

  const { data: stations = [], isLoading } = useQuery({
    queryKey: ['stations', step],
    queryFn: async () => {
      let query = supabase.from('stations').select('*').eq('is_active', true);
      
      if (step) {
        query = query.eq('step', step);
      }

      const { data, error } = await query.order('station_number', { ascending: true });
      
      if (error) throw error;
      return data as Station[];
    },
  });

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('stations-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'stations' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['stations'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return { stations, isLoading };
}

export function useStationActions(station: Station) {
  const queryClient = useQueryClient();

  const callNextPatient = useMutation({
    mutationFn: async () => {
      // Get next pending patient for this step
      const { data: nextStep, error: stepError } = await supabase
        .from('patient_steps')
        .select('*, patients!inner(*)')
        .eq('step', station.step)
        .eq('status', 'pending')
        .eq('patients.is_completed', false)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (stepError) throw stepError;
      if (!nextStep) throw new Error('Não há pacientes aguardando para esta etapa');

      const patient = (nextStep as any).patients as Patient;

      // Update step status to called
      const { error: updateError } = await supabase
        .from('patient_steps')
        .update({
          status: 'called',
          called_at: new Date().toISOString(),
          station_number: station.station_number,
        })
        .eq('id', nextStep.id);

      if (updateError) throw updateError;

      // Update station with current patient
      const { error: stationError } = await supabase
        .from('stations')
        .update({ current_patient_id: patient.id })
        .eq('id', station.id);

      if (stationError) throw stationError;

      // Create TV call
      const { error: tvError } = await supabase.from('tv_calls').insert({
        patient_id: patient.id,
        patient_name: patient.name,
        step: station.step,
        station_number: station.station_number,
        station_name: station.name,
      });

      if (tvError) throw tvError;

      return { patient, step: nextStep };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stations'] });
      queryClient.invalidateQueries({ queryKey: ['patient-steps'] });
      queryClient.invalidateQueries({ queryKey: ['tv-calls'] });
      queryClient.invalidateQueries({ queryKey: ['queue-stats'] });
    },
  });

  const startService = useMutation({
    mutationFn: async () => {
      if (!station.current_patient_id) throw new Error('Nenhum paciente chamado');

      // Update step status to in_progress
      const { error } = await supabase
        .from('patient_steps')
        .update({
          status: 'in_progress',
          started_at: new Date().toISOString(),
        })
        .eq('patient_id', station.current_patient_id)
        .eq('step', station.step);

      if (error) throw error;

      // Deactivate TV call
      await supabase
        .from('tv_calls')
        .update({ is_active: false })
        .eq('patient_id', station.current_patient_id)
        .eq('step', station.step);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stations'] });
      queryClient.invalidateQueries({ queryKey: ['patient-steps'] });
      queryClient.invalidateQueries({ queryKey: ['tv-calls'] });
    },
  });

  const finishService = useMutation({
    mutationFn: async () => {
      if (!station.current_patient_id) throw new Error('Nenhum paciente em atendimento');

      // Update step status to completed
      const { error: stepError } = await supabase
        .from('patient_steps')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('patient_id', station.current_patient_id)
        .eq('step', station.step);

      if (stepError) throw stepError;

      // Check if all steps are completed
      const { data: pendingSteps } = await supabase
        .from('patient_steps')
        .select('id')
        .eq('patient_id', station.current_patient_id)
        .neq('status', 'completed');

      if (!pendingSteps || pendingSteps.length === 0) {
        // Mark patient as completed
        await supabase
          .from('patients')
          .update({
            is_completed: true,
            completed_at: new Date().toISOString(),
          })
          .eq('id', station.current_patient_id);
      }

      // Clear station current patient
      const { error: stationError } = await supabase
        .from('stations')
        .update({ current_patient_id: null })
        .eq('id', station.id);

      if (stationError) throw stationError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stations'] });
      queryClient.invalidateQueries({ queryKey: ['patient-steps'] });
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      queryClient.invalidateQueries({ queryKey: ['queue-stats'] });
    },
  });

  const addImageExam = useMutation({
    mutationFn: async (patientId: string) => {
      // Check if step already exists
      const { data: existing } = await supabase
        .from('patient_steps')
        .select('id')
        .eq('patient_id', patientId)
        .eq('step', 'exame_imagem')
        .maybeSingle();

      if (existing) {
        throw new Error('Exame de imagem já adicionado');
      }

      const { error } = await supabase.from('patient_steps').insert({
        patient_id: patientId,
        step: 'exame_imagem',
      });

      if (error) throw error;

      // Update patient flag
      await supabase
        .from('patients')
        .update({ needs_image_exam: true })
        .eq('id', patientId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-steps'] });
      queryClient.invalidateQueries({ queryKey: ['patients'] });
    },
  });

  return {
    callNextPatient,
    startService,
    finishService,
    addImageExam,
  };
}
