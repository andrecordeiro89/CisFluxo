import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Patient, PatientStep, CircuitStep } from '@/types/patient-flow';
import { useEffect } from 'react';

export function usePatients() {
  const queryClient = useQueryClient();

  const { data: patients = [], isLoading } = useQuery({
    queryKey: ['patients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('is_completed', false)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data as Patient[];
    },
  });

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('patients-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'patients' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['patients'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const registerPatient = useMutation({
    mutationFn: async (data: {
      name: string;
      registration_number?: string;
      needs_cardio: boolean;
      needs_image_exam: boolean;
      is_priority: boolean;
    }) => {
      // Create patient
      const { data: patient, error: patientError } = await supabase
        .from('patients')
        .insert({
          name: data.name,
          registration_number: data.registration_number || null,
          needs_cardio: data.needs_cardio,
          needs_image_exam: data.needs_image_exam,
          is_priority: data.is_priority,
        })
        .select()
        .single();

      if (patientError) throw patientError;

      // Create required steps
      const steps: { patient_id: string; step: CircuitStep }[] = [
        { patient_id: patient.id, step: 'triagem_medica' },
        { patient_id: patient.id, step: 'exames_lab_ecg' },
        { patient_id: patient.id, step: 'agendamento' },
      ];

      if (data.needs_cardio) {
        steps.push({ patient_id: patient.id, step: 'cardiologista' });
      }

      if (data.needs_image_exam) {
        steps.push({ patient_id: patient.id, step: 'exame_imagem' });
      }

      const { error: stepsError } = await supabase
        .from('patient_steps')
        .insert(steps);

      if (stepsError) throw stepsError;

      return patient;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      queryClient.invalidateQueries({ queryKey: ['patient-steps'] });
    },
  });

  return {
    patients,
    isLoading,
    registerPatient,
  };
}

export function usePatientSteps(patientId?: string) {
  const queryClient = useQueryClient();

  const { data: steps = [], isLoading } = useQuery({
    queryKey: ['patient-steps', patientId],
    queryFn: async () => {
      let query = supabase.from('patient_steps').select('*');
      
      if (patientId) {
        query = query.eq('patient_id', patientId);
      }

      const { data, error } = await query.order('created_at', { ascending: true });
      
      if (error) throw error;
      return data as PatientStep[];
    },
  });

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('patient-steps-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'patient_steps' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['patient-steps'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const addStep = useMutation({
    mutationFn: async (data: { patient_id: string; step: CircuitStep }) => {
      const { data: existingStep } = await supabase
        .from('patient_steps')
        .select('id')
        .eq('patient_id', data.patient_id)
        .eq('step', data.step)
        .maybeSingle();

      if (existingStep) {
        throw new Error('Etapa já existe para este paciente');
      }

      const { error } = await supabase.from('patient_steps').insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-steps'] });
    },
  });

  return { steps, isLoading, addStep };
}
