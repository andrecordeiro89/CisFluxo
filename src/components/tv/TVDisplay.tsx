import { useTVCalls } from '@/hooks/useTVCalls';
import { useTVSpeech } from '@/hooks/useTVSpeech';
import { STEP_LABELS, CircuitStep } from '@/types/patient-flow';
import { Volume2, ArrowRight } from 'lucide-react';

const stepEmojis: Record<CircuitStep, string> = {
  triagem_medica: '🩺',
  exames_lab_ecg: '🧪',
  agendamento: '📅',
  cardiologista: '❤️',
  exame_imagem: '📷',
};

export function TVDisplay() {
  const { calls } = useTVCalls();

  const latestCall = calls[0];
  const previousCalls = calls.slice(1, 4);

  // Use text-to-speech for announcements
  useTVSpeech(latestCall);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/20 flex flex-col">
      {/* Header */}
      <header className="p-6 border-b bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg gradient-primary">
              <Volume2 className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-display font-bold">Painel de Chamadas</h1>
          </div>
          <div className="text-lg text-muted-foreground">
            {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 container mx-auto p-6 flex flex-col gap-6">
        {latestCall ? (
          <>
            {/* Current call - Large display */}
            <div className="flex-1 flex items-center justify-center">
              <div className="w-full max-w-4xl card-elevated p-10 text-center tv-announcement animate-scale-in">
                <div className="text-8xl mb-6">{stepEmojis[latestCall.step]}</div>
                
                <p className="text-2xl text-muted-foreground mb-4">
                  Chamando paciente
                </p>
                
                <h2 className="text-5xl md:text-6xl font-display font-bold text-foreground mb-6">
                  {latestCall.patient_name}
                </h2>
                
                <div className="flex items-center justify-center gap-4 text-2xl md:text-3xl">
                  <span className="text-muted-foreground">Dirigir-se à</span>
                  <ArrowRight className="h-8 w-8 text-primary" />
                  <span className="font-display font-bold text-primary">
                    {latestCall.station_name}
                  </span>
                </div>
              </div>
            </div>

            {/* Previous calls */}
            {previousCalls.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {previousCalls.map((call) => (
                  <div
                    key={call.id}
                    className="card-elevated p-5 opacity-75 hover:opacity-100 transition-opacity"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{stepEmojis[call.step]}</span>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg truncate">{call.patient_name}</h3>
                        <p className="text-sm text-muted-foreground">{call.station_name}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-8xl mb-6">⏳</div>
              <h2 className="text-3xl font-display font-semibold text-muted-foreground">
                Aguardando chamadas...
              </h2>
              <p className="text-xl text-muted-foreground/70 mt-2">
                O próximo paciente será exibido aqui
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="p-4 border-t bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto text-center text-muted-foreground">
          Circuito Pré-Operatório • Aguarde seu nome ser chamado
        </div>
      </footer>
    </div>
  );
}
