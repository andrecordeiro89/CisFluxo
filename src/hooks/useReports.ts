import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CircuitStep } from '@/types/patient-flow';
import { differenceInMinutes } from 'date-fns';

export interface StepReport {
  step: CircuitStep;
  total: number;
  avgTimeMinutes: number;
  minTimeMinutes: number;
  maxTimeMinutes: number;
}

export interface DayReport {
  totalPatients: number;
  completedPatients: number;
  stepReports: StepReport[];
}

export function useReports(startDate: Date, endDate: Date) {
  return useQuery({
    queryKey: ['reports', startDate.toISOString(), endDate.toISOString()],
    queryFn: async (): Promise<DayReport> => {
      // Get patients for the day
      const { data: patients, error: patientsError } = await supabase
        .from('patients')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (patientsError) throw patientsError;

      // Get all completed steps for the day
      const { data: steps, error: stepsError } = await supabase
        .from('patient_steps')
        .select('*')
        .eq('status', 'completed')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (stepsError) throw stepsError;

      const allSteps: CircuitStep[] = [
        'triagem_medica',
        'exames_lab_ecg',
        'agendamento',
        'cardiologista',
        'exame_imagem',
      ];

      const stepReports: StepReport[] = allSteps.map((step) => {
        const stepData = steps?.filter((s) => s.step === step && s.started_at && s.completed_at) || [];
        
        const times = stepData.map((s) => 
          differenceInMinutes(new Date(s.completed_at!), new Date(s.started_at!))
        ).filter(t => t > 0);

        return {
          step,
          total: stepData.length,
          avgTimeMinutes: times.length > 0 ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0,
          minTimeMinutes: times.length > 0 ? Math.min(...times) : 0,
          maxTimeMinutes: times.length > 0 ? Math.max(...times) : 0,
        };
      });

      return {
        totalPatients: patients?.length || 0,
        completedPatients: patients?.filter((p) => p.is_completed).length || 0,
        stepReports,
      };
    },
  });
}
