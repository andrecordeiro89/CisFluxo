import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Station, CircuitStep, Patient, PatientStep, MedicalSpecialty } from '@/types/patient-flow';
import { useEffect, useRef } from 'react';

// Track the last call type (priority or not) for weighted selection
let lastCallWasPriority = false;
let priorityCallCount = 0;

export function useStations(step?: CircuitStep) {
  const queryClient = useQueryClient();

  const { data: stations = [], isLoading } = useQuery({
    queryKey: ['stations', step],
    queryFn: async () => {
      let query = supabase.from('stations').select('*').eq('is_active', true);
      
      if (step) {
        query = query.eq('step', step);
      }

      const { data, error } = await query.order('step').order('station_number', { ascending: true });
      
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

  // ECG and Agendamento allow 2 simultaneous patients, other stations only 1
  const maxSimultaneousPatients = (station.step === 'exames_lab_ecg' || station.step === 'agendamento') ? 2 : 1;

  const callNextPatient = useMutation({
    mutationFn: async () => {
      // Check how many patients are currently being served at this station
      const { data: currentlyServing, error: servingError } = await supabase
        .from('patient_steps')
        .select('id')
        .eq('step', station.step)
        .in('status', ['called', 'in_progress'])
        .eq('station_number', station.station_number);

      if (servingError) throw servingError;

      const currentCount = currentlyServing?.length || 0;
      if (currentCount >= maxSimultaneousPatients) {
        throw new Error(`Esta estação já está com ${currentCount} paciente(s) em atendimento`);
      }

      // For specialist stations, filter by specialty
      let query = supabase
        .from('patient_steps')
        .select('*, patients!inner(*)')
        .eq('step', station.step)
        .eq('status', 'pending')
        .eq('patients.is_completed', false)
        .eq('patients.is_being_served', false);

      // If this is a specialist station with a specialty set, filter by it
      if (station.step === 'especialista' && station.current_specialty) {
        query = query.eq('patients.specialty', station.current_specialty);
      }

      const { data: nextStep, error: stepError } = await query
        .order('created_at', { ascending: true })
        .limit(20);

      if (stepError) throw stepError;
      if (!nextStep || nextStep.length === 0) {
        if (station.step === 'especialista' && station.current_specialty) {
          throw new Error(`Não há pacientes aguardando para ${station.current_specialty}`);
        }
        throw new Error('Não há pacientes aguardando para esta etapa');
      }

      let candidates = nextStep as any[];

      if (station.step === 'cardiologista') {
        const candidateIds = candidates.map((s: any) => s.patients.id);
        const { data: ecgCompleted } = await supabase
          .from('patient_steps')
          .select('patient_id')
          .in('patient_id', candidateIds)
          .eq('step', 'exames_lab_ecg')
          .eq('status', 'completed');
        const allowed = new Set((ecgCompleted || []).map((r: any) => r.patient_id));
        candidates = candidates.filter((s: any) => allowed.has(s.patients.id));
        if (!candidates || candidates.length === 0) {
          throw new Error('Nenhum paciente com ECG concluído para cardiologista');
        }
      }

      if (station.step === 'especialista') {
        const firstConsultation = candidates.filter((s: any) => s.patients.flow_type === 'consulta_especialista');
        if (firstConsultation.length > 0) {
          candidates = firstConsultation;
        }
      }

      // Separate priority and non-priority patients
      const priorityPatients = candidates.filter((s: any) => s.patients.is_priority);
      const normalPatients = candidates.filter((s: any) => !s.patients.is_priority);

      let selectedStep;

      if (station.step === 'exames_lab_ecg') {
        const cardiologyPatients = candidates.filter((s: any) => s.patients.specialty === 'CARDIOLOGIA');
        if (cardiologyPatients.length > 0) {
          selectedStep = cardiologyPatients[0];
        }
      }

      // Weighted priority selection: 75% priority, 25% normal
      // After 3 priority patients, call 1 normal patient (if available)
      if (!selectedStep && priorityPatients.length > 0 && normalPatients.length > 0) {
        // Use weighted selection
        if (priorityCallCount >= 3 && normalPatients.length > 0) {
          // Call a normal patient after 3 priority calls
          selectedStep = normalPatients[0];
          priorityCallCount = 0;
          lastCallWasPriority = false;
        } else if (priorityPatients.length > 0) {
          // Call priority patient
          selectedStep = priorityPatients[0];
          priorityCallCount++;
          lastCallWasPriority = true;
        } else {
          selectedStep = normalPatients[0];
          lastCallWasPriority = false;
        }
      } else if (!selectedStep && priorityPatients.length > 0) {
        selectedStep = priorityPatients[0];
        lastCallWasPriority = true;
      } else if (!selectedStep) {
        selectedStep = normalPatients[0];
        priorityCallCount = 0;
        lastCallWasPriority = false;
      }

      const patient = (selectedStep as any).patients as Patient;

      // Mark patient as being served
      const { error: markServingError } = await supabase
        .from('patients')
        .update({ is_being_served: true })
        .eq('id', patient.id);

      if (markServingError) throw markServingError;

      // Update step status to called
      const { error: updateError } = await supabase
        .from('patient_steps')
        .update({
          status: 'called',
          called_at: new Date().toISOString(),
          station_number: station.station_number,
        })
        .eq('id', selectedStep.id);

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

      return { patient, step: selectedStep };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stations'] });
      queryClient.invalidateQueries({ queryKey: ['patient-steps'] });
      queryClient.invalidateQueries({ queryKey: ['tv-calls'] });
      queryClient.invalidateQueries({ queryKey: ['queue-stats'] });
      queryClient.invalidateQueries({ queryKey: ['patients'] });
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

      // Mark patient as no longer being served
      const { error: servingError } = await supabase
        .from('patients')
        .update({ is_being_served: false })
        .eq('id', station.current_patient_id);

      if (servingError) throw servingError;

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

  // Cancel call and return patient to queue
  const cancelCall = useMutation({
    mutationFn: async () => {
      if (!station.current_patient_id) throw new Error('Nenhum paciente para cancelar');

      // Reset step status to pending
      const { error: stepError } = await supabase
        .from('patient_steps')
        .update({
          status: 'pending',
          called_at: null,
          started_at: null,
          station_number: null,
        })
        .eq('patient_id', station.current_patient_id)
        .eq('step', station.step);

      if (stepError) throw stepError;

      // Mark patient as no longer being served
      const { error: servingError } = await supabase
        .from('patients')
        .update({ is_being_served: false })
        .eq('id', station.current_patient_id);

      if (servingError) throw servingError;

      // Deactivate TV call
      await supabase
        .from('tv_calls')
        .update({ is_active: false })
        .eq('patient_id', station.current_patient_id)
        .eq('step', station.step);

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
      queryClient.invalidateQueries({ queryKey: ['tv-calls'] });
      queryClient.invalidateQueries({ queryKey: ['queue-stats'] });
      queryClient.invalidateQueries({ queryKey: ['patients'] });
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

  const addCardioStep = useMutation({
    mutationFn: async (patientId: string) => {
      // Check if step already exists
      const { data: existing } = await supabase
        .from('patient_steps')
        .select('id')
        .eq('patient_id', patientId)
        .eq('step', 'cardiologista')
        .maybeSingle();

      if (existing) {
        throw new Error('Etapa de cardiologista já adicionada');
      }

      const { error } = await supabase.from('patient_steps').insert({
        patient_id: patientId,
        step: 'cardiologista',
      });

      if (error) throw error;

      // Update patient flag
      await supabase
        .from('patients')
        .update({ needs_cardio: true })
        .eq('id', patientId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-steps'] });
      queryClient.invalidateQueries({ queryKey: ['patients'] });
    },
  });

  const updateStationSpecialty = useMutation({
    mutationFn: async (specialty: MedicalSpecialty) => {
      const { error } = await supabase
        .from('stations')
        .update({ current_specialty: specialty })
        .eq('id', station.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stations'] });
    },
  });

  // Clear specialty and release consultation room
  const releaseRoom = useMutation({
    mutationFn: async () => {
      if (station.current_patient_id) {
        throw new Error('Finalize o atendimento antes de liberar o consultório');
      }

      const { error } = await supabase
        .from('stations')
        .update({ current_specialty: null })
        .eq('id', station.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stations'] });
    },
  });

  return {
    callNextPatient,
    startService,
    finishService,
    cancelCall,
    addImageExam,
    addCardioStep,
    updateStationSpecialty,
    releaseRoom,
  };
}
