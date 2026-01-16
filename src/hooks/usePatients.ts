import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Patient, PatientStep, CircuitStep, MedicalSpecialty, FlowType } from '@/types/patient-flow';
import { useEffect } from 'react';
import { useSelectedDate } from '@/contexts/DateContext';

export function usePatients() {
  const queryClient = useQueryClient();
  const { startOfSelectedDay, endOfSelectedDay, isToday } = useSelectedDate();

  const { data: patients = [], isLoading } = useQuery({
    queryKey: ['patients', startOfSelectedDay.toISOString()],
    queryFn: async () => {
      let query = supabase
        .from('patients')
        .select('*')
        .gte('created_at', startOfSelectedDay.toISOString())
        .lte('created_at', endOfSelectedDay.toISOString())
        .order('created_at', { ascending: true });
      
      // Only filter incomplete for today
      if (isToday) {
        query = query.eq('is_completed', false);
      }
      
      const { data, error } = await query;
      
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
      specialty: MedicalSpecialty;
      flow_type: FlowType;
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
          specialty: data.specialty,
          flow_type: data.flow_type,
          needs_cardio: data.needs_cardio,
          needs_image_exam: data.needs_image_exam,
          is_priority: data.is_priority,
        })
        .select()
        .single();

      if (patientError) throw patientError;

      // Create steps based on flow type
      const steps: { patient_id: string; step: CircuitStep }[] = [];

      if (data.flow_type === 'consulta_especialista') {
        // Patient goes to specialist first
        steps.push({ patient_id: patient.id, step: 'especialista' });
      } else {
        // Patient goes directly to pre-operative circuit
        steps.push({ patient_id: patient.id, step: 'triagem_medica' });
        steps.push({ patient_id: patient.id, step: 'exames_lab_ecg' });
        steps.push({ patient_id: patient.id, step: 'agendamento' });

        if (data.needs_cardio) {
          steps.push({ patient_id: patient.id, step: 'cardiologista' });
        }

        if (data.needs_image_exam) {
          steps.push({ patient_id: patient.id, step: 'exame_imagem' });
        }
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

  // Add patient to pre-operative circuit (called when specialist finishes with surgery indication)
  const addToPreopCircuit = useMutation({
    mutationFn: async ({ patientId, needsCardio }: { patientId: string; needsCardio: boolean }) => {
      // Mark patient as having surgery indication and reset completed status
      const { error: updateError } = await supabase
        .from('patients')
        .update({ 
          has_surgery_indication: true,
          is_completed: false,
          completed_at: null,
          needs_cardio: needsCardio,
        })
        .eq('id', patientId);

      if (updateError) throw updateError;

      // Add pre-operative circuit steps
      const steps: { patient_id: string; step: CircuitStep }[] = [
        { patient_id: patientId, step: 'triagem_medica' },
        { patient_id: patientId, step: 'exames_lab_ecg' },
        { patient_id: patientId, step: 'agendamento' },
      ];

      // Add cardio step if needed
      if (needsCardio) {
        steps.push({ patient_id: patientId, step: 'cardiologista' });
      }

      const { error: stepsError } = await supabase
        .from('patient_steps')
        .insert(steps);

      if (stepsError) throw stepsError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      queryClient.invalidateQueries({ queryKey: ['patient-steps'] });
    },
  });

  // Mark patient as pending surgery scheduling
  const markPendingScheduling = useMutation({
    mutationFn: async ({ patientId, reason }: { patientId: string; reason: string }) => {
      const { error } = await supabase
        .from('patients')
        .update({ 
          pending_surgery_scheduling: true,
          scheduling_pending_at: new Date().toISOString(),
          scheduling_pending_reason: reason,
        })
        .eq('id', patientId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
    },
  });

  return {
    patients,
    isLoading,
    registerPatient,
    addToPreopCircuit,
    markPendingScheduling,
    isToday,
  };
}

export function usePatientSteps(patientId?: string) {
  const queryClient = useQueryClient();
  const { startOfSelectedDay, endOfSelectedDay } = useSelectedDate();

  const { data: steps = [], isLoading } = useQuery({
    queryKey: ['patient-steps', patientId, startOfSelectedDay.toISOString()],
    queryFn: async () => {
      let query = supabase.from('patient_steps').select('*');
      
      if (patientId) {
        query = query.eq('patient_id', patientId);
      } else {
        // Filter by date when getting all steps
        query = query
          .gte('created_at', startOfSelectedDay.toISOString())
          .lte('created_at', endOfSelectedDay.toISOString());
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