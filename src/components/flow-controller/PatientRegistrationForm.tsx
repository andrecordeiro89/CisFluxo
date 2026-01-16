import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { UserPlus, Heart, Image as ImageIcon, AlertTriangle, Stethoscope, Activity, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { usePatients } from '@/hooks/usePatients';
import { toast } from 'sonner';
import { MedicalSpecialty, SPECIALTY_LABELS, FlowType, FLOW_TYPE_LABELS } from '@/types/patient-flow';

const SPECIALTIES: MedicalSpecialty[] = [
  'ORTOPEDIA',
  'OTORRINO',
  'OFTALMO',
  'TRAUMA',
  'GERAL',
  'UROLOGIA',
  'GINECOLOGIA',
  'CARDIOLOGIA',
  'OUTROS',
];

const patientSchema = z.object({
  name: z.string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100)
    .refine((val) => val.trim().split(/\s+/).length >= 2, {
      message: 'Digite nome e sobrenome (mínimo 2 palavras)',
    }),
  registration_number: z.string().optional(),
  specialty: z.enum(['ORTOPEDIA', 'OTORRINO', 'OFTALMO', 'TRAUMA', 'GERAL', 'UROLOGIA', 'GINECOLOGIA', 'OUTROS']),
  flow_type: z.enum(['consulta_especialista', 'consulta_retorno', 'circuito_preop']),
  needs_cardio: z.boolean().default(false),
  needs_image_exam: z.boolean().default(false),
  is_priority: z.boolean().default(false),
});

type PatientFormData = z.infer<typeof patientSchema>;

interface PatientRegistrationFormProps {
  onSuccess?: () => void;
}

export function PatientRegistrationForm({ onSuccess }: PatientRegistrationFormProps) {
  const { registerPatient } = usePatients();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      name: '',
      registration_number: '',
      specialty: 'GERAL',
      flow_type: 'consulta_especialista',
      needs_cardio: false,
      needs_image_exam: false,
      is_priority: false,
    },
  });

  const flowType = form.watch('flow_type');

  const onSubmit = async (data: PatientFormData) => {
    setIsSubmitting(true);
    try {
      await registerPatient.mutateAsync({
        name: data.name.trim(),
        registration_number: data.registration_number,
        specialty: data.specialty,
        flow_type: data.flow_type,
        needs_cardio: data.flow_type === 'circuito_preop' ? (data.needs_cardio ?? false) : false,
        needs_image_exam: data.flow_type === 'circuito_preop' ? (data.needs_image_exam ?? false) : false,
        is_priority: data.is_priority ?? false,
      });
      toast.success(`Paciente ${data.name} cadastrado com sucesso!`);
      form.reset();
      onSuccess?.();
    } catch (error) {
      toast.error('Erro ao cadastrar paciente');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="card-elevated p-6 animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg gradient-primary">
          <UserPlus className="h-5 w-5 text-primary-foreground" />
        </div>
        <h2 className="text-xl font-display font-semibold">Cadastrar Paciente</h2>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome do Paciente *</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Digite nome e sobrenome" 
                    {...field} 
                    className="h-12"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="registration_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Número do Prontuário (opcional)</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Ex: 12345" 
                    {...field} 
                    className="h-12"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="specialty"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Especialidade *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Selecione a especialidade" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {SPECIALTIES.map((specialty) => (
                      <SelectItem key={specialty} value={specialty}>
                        {SPECIALTY_LABELS[specialty]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="flow_type"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>Tipo de Atendimento *</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="space-y-2"
                  >
                    <FormItem className="flex items-start gap-3 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                      <FormControl>
                        <RadioGroupItem value="consulta_especialista" className="mt-0.5" />
                      </FormControl>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Stethoscope className="h-5 w-5 text-step-especialista" />
                          <FormLabel className="cursor-pointer font-medium m-0">
                            {FLOW_TYPE_LABELS.consulta_especialista}
                          </FormLabel>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Paciente será encaminhado primeiro para consulta com especialista
                        </p>
                      </div>
                    </FormItem>
                    <FormItem className="flex items-start gap-3 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                      <FormControl>
                        <RadioGroupItem value="consulta_retorno" className="mt-0.5" />
                      </FormControl>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <RotateCcw className="h-5 w-5 text-blue-500" />
                          <FormLabel className="cursor-pointer font-medium m-0">
                            {FLOW_TYPE_LABELS.consulta_retorno}
                          </FormLabel>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Paciente em retorno para acompanhamento com especialista
                        </p>
                      </div>
                    </FormItem>
                    <FormItem className="flex items-start gap-3 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                      <FormControl>
                        <RadioGroupItem value="circuito_preop" className="mt-0.5" />
                      </FormControl>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Activity className="h-5 w-5 text-primary" />
                          <FormLabel className="cursor-pointer font-medium m-0">
                            {FLOW_TYPE_LABELS.circuito_preop}
                          </FormLabel>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Paciente inicia direto no circuito pré-operatório (Triagem → Exames → Agendamento)
                        </p>
                      </div>
                    </FormItem>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {flowType === 'circuito_preop' && (
            <div className="space-y-4 pt-2">
              <FormField
                control={form.control}
                name="needs_cardio"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-3 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="data-[state=checked]:bg-step-cardio data-[state=checked]:border-step-cardio"
                      />
                    </FormControl>
                    <div className="flex items-center gap-2 flex-1">
                      <Heart className="h-5 w-5 text-step-cardio" />
                      <FormLabel className="cursor-pointer font-medium m-0">
                        Necessita avaliação com Cardiologista
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="needs_image_exam"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-3 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="data-[state=checked]:bg-step-imagem data-[state=checked]:border-step-imagem"
                      />
                    </FormControl>
                    <div className="flex items-center gap-2 flex-1">
                      <ImageIcon className="h-5 w-5 text-step-imagem" />
                      <FormLabel className="cursor-pointer font-medium m-0">
                        Necessita Exame de Imagem
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />
            </div>
          )}

          <FormField
            control={form.control}
            name="is_priority"
            render={({ field }) => (
              <FormItem className="flex items-center gap-3 p-4 rounded-lg border-2 border-amber-500/50 bg-amber-500/10 hover:bg-amber-500/20 transition-colors">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
                  />
                </FormControl>
                <div className="flex items-center gap-2 flex-1">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  <FormLabel className="cursor-pointer font-medium m-0 text-amber-700 dark:text-amber-400">
                    Atendimento Prioritário
                  </FormLabel>
                </div>
              </FormItem>
            )}
          />

          <Button 
            type="submit" 
            className="w-full h-12 text-base font-medium gradient-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Cadastrando...' : 'Cadastrar Paciente'}
          </Button>
        </form>
      </Form>
    </div>
  );
}
