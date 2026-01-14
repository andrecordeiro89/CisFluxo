import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { UserPlus, Heart, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { usePatients } from '@/hooks/usePatients';
import { toast } from 'sonner';

const patientSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100),
  registration_number: z.string().optional(),
  needs_cardio: z.boolean().default(false),
  needs_image_exam: z.boolean().default(false),
});

type PatientFormData = z.infer<typeof patientSchema>;

export function PatientRegistrationForm() {
  const { registerPatient } = usePatients();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      name: '',
      registration_number: '',
      needs_cardio: false,
      needs_image_exam: false,
    },
  });

  const onSubmit = async (data: PatientFormData) => {
    setIsSubmitting(true);
    try {
      await registerPatient.mutateAsync({
        name: data.name,
        registration_number: data.registration_number,
        needs_cardio: data.needs_cardio ?? false,
        needs_image_exam: data.needs_image_exam ?? false,
      });
      toast.success(`Paciente ${data.name} cadastrado com sucesso!`);
      form.reset();
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
                <FormLabel>Nome do Paciente</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Digite o nome completo" 
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
