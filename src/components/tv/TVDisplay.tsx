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
  especialista: '👨‍⚕️',
};

export function TVDisplay() {
  const { calls } = useTVCalls();

  const latestCall = calls[0];
  const queueList = calls.slice(0, 8); // Show up to 8 patients in the list

  // Use text-to-speech for announcements
  useTVSpeech(latestCall);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/20 flex flex-col">
      {/* Header */}
      <header className="p-4 border-b bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg gradient-primary">
              <Volume2 className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-display font-bold">Painel de Chamadas</h1>
          </div>
          <div className="text-lg text-muted-foreground">
            {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </header>

      {/* Main content - Split layout */}
      <main className="flex-1 flex">
        {/* Left side - Current call (large display) */}
        <div className="flex-1 flex items-center justify-center p-6 border-r">
          {latestCall ? (
            <div className="w-full max-w-2xl card-elevated p-8 text-center tv-announcement animate-scale-in">
              <div className="text-7xl mb-4">{stepEmojis[latestCall.step]}</div>
              
              <p className="text-xl text-muted-foreground mb-3">
                Chamando paciente
              </p>
              
              <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4">
                {latestCall.patient_name}
              </h2>
              
              <div className="flex items-center justify-center gap-3 text-xl md:text-2xl">
                <span className="text-muted-foreground">Dirigir-se à</span>
                <ArrowRight className="h-6 w-6 text-primary" />
                <span className="font-display font-bold text-primary">
                  {latestCall.station_name}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <div className="text-7xl mb-4">⏳</div>
              <h2 className="text-2xl font-display font-semibold text-muted-foreground">
                Aguardando chamadas...
              </h2>
              <p className="text-lg text-muted-foreground/70 mt-2">
                O próximo paciente será exibido aqui
              </p>
            </div>
          )}
        </div>

        {/* Right side - Queue list */}
        <div className="w-[400px] flex flex-col bg-card/50 p-6">
          <h3 className="text-lg font-display font-semibold mb-4 text-center border-b pb-3">
            📋 Pacientes Chamados
          </h3>
          
          {queueList.length > 0 ? (
            <div className="flex-1 space-y-3 overflow-y-auto">
              {queueList.map((call, index) => (
                <div
                  key={call.id}
                  className={`p-4 rounded-lg border transition-all ${
                    index === 0 
                      ? 'bg-primary/10 border-primary/30 animate-pulse' 
                      : 'bg-card hover:bg-accent/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{stepEmojis[call.step]}</span>
                    <div className="flex-1 min-w-0">
                      <h4 className={`font-semibold truncate ${index === 0 ? 'text-lg' : 'text-base'}`}>
                        {call.patient_name}
                      </h4>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <ArrowRight className="h-3 w-3" />
                        <span className="truncate">{call.station_name}</span>
                      </div>
                    </div>
                    {index === 0 && (
                      <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-muted-foreground text-center">
                Nenhum paciente na fila de chamadas
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="p-3 border-t bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          Circuito Pré-Operatório • Aguarde seu nome ser chamado
        </div>
      </footer>
    </div>
  );
}
