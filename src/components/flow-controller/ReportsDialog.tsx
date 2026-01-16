import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { BarChart3, Clock, Users, CheckCircle, AlertTriangle, Stethoscope, TrendingUp, Download, FileCode, CalendarX, RotateCcw, Activity } from 'lucide-react';
import { useSelectedDate } from '@/contexts/DateContext';
import { useReports, StepReport, SpecialtyReport, DayReport, PendingSchedulingPatient, FlowTypeReport } from '@/hooks/useReports';
import { STEP_LABELS, SPECIALTY_LABELS, CircuitStep, MedicalSpecialty, FlowType, FLOW_TYPE_LABELS } from '@/types/patient-flow';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

const stepIcons: Record<CircuitStep, string> = {
  triagem_medica: '🩺',
  exames_lab_ecg: '🧪',
  agendamento: '📅',
  cardiologista: '❤️',
  exame_imagem: '📷',
  especialista: '👨‍⚕️',
};

function StepReportCard({ report }: { report: StepReport }) {
  const maxTime = 60; // Assume 60 min as max for progress display
  const percentOfMax = Math.min((report.avgTimeMinutes / maxTime) * 100, 100);
  const isBottleneck = report.avgTimeMinutes > 30 && report.total > 0;

  return (
    <div className={`p-4 rounded-lg border ${isBottleneck ? 'border-amber-500 bg-amber-50/50' : 'bg-card'}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{stepIcons[report.step]}</span>
          <span className="font-medium">{STEP_LABELS[report.step]}</span>
        </div>
        {isBottleneck && (
          <div className="flex items-center gap-1 text-amber-600 text-sm">
            <AlertTriangle className="h-4 w-4" />
            <span>Gargalo</span>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-4 gap-3 text-sm">
        <div>
          <p className="text-muted-foreground">Atendimentos</p>
          <p className="font-semibold text-lg">{report.total}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Tempo Médio</p>
          <p className="font-semibold text-lg">{report.avgTimeMinutes} min</p>
        </div>
        <div>
          <p className="text-muted-foreground">Mínimo</p>
          <p className="font-semibold">{report.minTimeMinutes} min</p>
        </div>
        <div>
          <p className="text-muted-foreground">Máximo</p>
          <p className="font-semibold">{report.maxTimeMinutes} min</p>
        </div>
      </div>

      {report.total > 0 && (
        <div className="mt-3">
          <Progress value={percentOfMax} className="h-2" />
        </div>
      )}
    </div>
  );
}

function SpecialtyReportCard({ report }: { report: SpecialtyReport }) {
  return (
    <div className="p-4 rounded-lg border bg-card">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Stethoscope className="h-5 w-5 text-primary" />
          <span className="font-medium">{SPECIALTY_LABELS[report.specialty]}</span>
        </div>
        <div className="flex items-center gap-1 text-primary text-sm font-semibold">
          <TrendingUp className="h-4 w-4" />
          <span>{report.conversionRate}%</span>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-3 text-sm">
        <div>
          <p className="text-muted-foreground">Consultas</p>
          <p className="font-semibold text-lg">{report.totalConsultations}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Indicações Cirúrgicas</p>
          <p className="font-semibold text-lg text-status-completed">{report.surgicalIndications}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Taxa de Conversão</p>
          <p className="font-semibold text-lg">{report.conversionRate}%</p>
        </div>
      </div>

      {report.totalConsultations > 0 && (
        <div className="mt-3">
          <Progress value={report.conversionRate} className="h-2" />
        </div>
      )}
    </div>
  );
}

const flowTypeIcons: Record<FlowType, React.ReactNode> = {
  consulta_especialista: <Stethoscope className="h-5 w-5 text-step-especialista" />,
  consulta_retorno: <RotateCcw className="h-5 w-5 text-blue-500" />,
  circuito_preop: <Activity className="h-5 w-5 text-primary" />,
};

function FlowTypeReportCard({ report }: { report: FlowTypeReport }) {
  const completionRate = report.total > 0 ? Math.round((report.completed / report.total) * 100) : 0;

  return (
    <div className="p-4 rounded-lg border bg-card">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {flowTypeIcons[report.flowType]}
          <span className="font-medium">{report.label}</span>
        </div>
        <div className="flex items-center gap-1 text-primary text-sm font-semibold">
          <TrendingUp className="h-4 w-4" />
          <span>{completionRate}%</span>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-3 text-sm">
        <div>
          <p className="text-muted-foreground">Total</p>
          <p className="font-semibold text-lg">{report.total}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Finalizados</p>
          <p className="font-semibold text-lg text-status-completed">{report.completed}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Taxa de Conclusão</p>
          <p className="font-semibold text-lg">{completionRate}%</p>
        </div>
      </div>

      {report.total > 0 && (
        <div className="mt-3">
          <Progress value={completionRate} className="h-2" />
        </div>
      )}
    </div>
  );
}

function generateXMLReport(report: DayReport, selectedDate: Date): string {
  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const dateDisplay = format(selectedDate, "dd 'de' MMMM, yyyy", { locale: ptBR });
  
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<relatorio data="${dateStr}" dataFormatada="${dateDisplay}">
  <resumo>
    <totalPacientes>${report.totalPatients}</totalPacientes>
    <circuitosCompletos>${report.completedPatients}</circuitosCompletos>
    <totalIndicacoesCirurgicas>${report.totalSurgicalIndications}</totalIndicacoesCirurgicas>
    <taxaConversaoGeral>${report.overallConversionRate}%</taxaConversaoGeral>
    <pacientesPendentesAgendamento>${report.pendingSchedulingPatients.length}</pacientesPendentesAgendamento>
  </resumo>
  
  <temposPorEstacao>`;

  report.stepReports.forEach(step => {
    xml += `
    <estacao nome="${STEP_LABELS[step.step]}">
      <atendimentos>${step.total}</atendimentos>
      <tempoMedioMinutos>${step.avgTimeMinutes}</tempoMedioMinutos>
      <tempoMinimoMinutos>${step.minTimeMinutes}</tempoMinimoMinutos>
      <tempoMaximoMinutos>${step.maxTimeMinutes}</tempoMaximoMinutos>
    </estacao>`;
  });

  xml += `
  </temposPorEstacao>
  
  <consultasPorEspecialidade>`;

  report.specialtyReports.forEach(specialty => {
    xml += `
    <especialidade nome="${SPECIALTY_LABELS[specialty.specialty]}">
      <totalConsultas>${specialty.totalConsultations}</totalConsultas>
      <indicacoesCirurgicas>${specialty.surgicalIndications}</indicacoesCirurgicas>
      <taxaConversao>${specialty.conversionRate}%</taxaConversao>
    </especialidade>`;
  });

  xml += `
  </consultasPorEspecialidade>
  
  <atendimentosPorTipo>`;

  report.flowTypeReports.forEach(flowType => {
    const completionRate = flowType.total > 0 ? Math.round((flowType.completed / flowType.total) * 100) : 0;
    xml += `
    <tipoAtendimento nome="${flowType.label}">
      <total>${flowType.total}</total>
      <finalizados>${flowType.completed}</finalizados>
      <taxaConclusao>${completionRate}%</taxaConclusao>
    </tipoAtendimento>`;
  });

  xml += `
  </atendimentosPorTipo>
  
  <pacientesPendentesAgendamento>`;

  report.pendingSchedulingPatients.forEach(patient => {
    xml += `
    <paciente>
      <nome>${patient.name}</nome>
      <matricula>${patient.registration_number || 'N/A'}</matricula>
      <especialidade>${SPECIALTY_LABELS[patient.specialty]}</especialidade>
      <dataMarcacao>${patient.scheduling_pending_at ? format(new Date(patient.scheduling_pending_at), 'dd/MM/yyyy HH:mm') : 'N/A'}</dataMarcacao>
      <justificativa>${patient.scheduling_pending_reason || 'N/A'}</justificativa>
    </paciente>`;
  });

  xml += `
  </pacientesPendentesAgendamento>
</relatorio>`;

  return xml;
}

function downloadXML(content: string, filename: string) {
  const blob = new Blob([content], { type: 'application/xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function ReportsDialog() {
  const { selectedDate, startOfSelectedDay, endOfSelectedDay } = useSelectedDate();
  const { data: report, isLoading } = useReports(startOfSelectedDay, endOfSelectedDay);

  const handleExportXML = () => {
    if (!report) {
      toast.error('Nenhum dado disponível para exportar');
      return;
    }

    const xml = generateXMLReport(report, selectedDate);
    const filename = `relatorio_${format(selectedDate, 'yyyy-MM-dd')}.xml`;
    downloadXML(xml, filename);
    toast.success('Relatório exportado com sucesso!');
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
          <BarChart3 className="h-4 w-4 mr-2" />
          Relatórios
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Relatório do Dia - {format(selectedDate, "dd 'de' MMMM, yyyy", { locale: ptBR })}
            </DialogTitle>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleExportXML}
              disabled={!report || isLoading}
            >
              <FileCode className="h-4 w-4 mr-2" />
              Exportar XML
            </Button>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-muted rounded animate-pulse" />
            ))}
          </div>
        ) : report ? (
          <div className="space-y-6">
            {/* Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="h-5 w-5 text-primary" />
                  <span className="text-muted-foreground text-sm">Total de Pacientes</span>
                </div>
                <p className="text-3xl font-bold text-primary">{report.totalPatients}</p>
              </div>
              
              <div className="p-4 rounded-lg bg-status-completed-bg border border-status-completed/20">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="h-5 w-5 text-status-completed" />
                  <span className="text-muted-foreground text-sm">Circuitos Completos</span>
                </div>
                <p className="text-3xl font-bold text-status-completed">{report.completedPatients}</p>
              </div>

              <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <div className="flex items-center gap-2 mb-1">
                  <Stethoscope className="h-5 w-5 text-amber-600" />
                  <span className="text-muted-foreground text-sm">Indicações Cirúrgicas</span>
                </div>
                <p className="text-3xl font-bold text-amber-600">{report.totalSurgicalIndications}</p>
              </div>

              <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  <span className="text-muted-foreground text-sm">Taxa de Conversão</span>
                </div>
                <p className="text-3xl font-bold text-blue-600">{report.overallConversionRate}%</p>
              </div>
            </div>

            {/* Specialty reports */}
            {report.specialtyReports.length > 0 && (
              <div>
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Stethoscope className="h-4 w-4" />
                  Consultas por Especialidade
                </h3>
                <div className="space-y-3">
                  {report.specialtyReports.map((specialtyReport) => (
                    <SpecialtyReportCard key={specialtyReport.specialty} report={specialtyReport} />
                  ))}
                </div>
              </div>
            )}

            {/* Flow Type reports */}
            {report.flowTypeReports && report.flowTypeReports.length > 0 && (
              <div>
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Atendimentos por Tipo
                </h3>
                <div className="space-y-3">
                  {report.flowTypeReports.map((flowTypeReport) => (
                    <FlowTypeReportCard key={flowTypeReport.flowType} report={flowTypeReport} />
                  ))}
                </div>
              </div>
            )}

            {/* Step reports */}
            <div>
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Tempo por Estação
              </h3>
              <div className="space-y-3">
                {report.stepReports.map((stepReport) => (
                  <StepReportCard key={stepReport.step} report={stepReport} />
                ))}
              </div>
            </div>

            {/* Pending Scheduling Patients */}
            {report.pendingSchedulingPatients && report.pendingSchedulingPatients.length > 0 && (
              <div>
                <h3 className="font-semibold mb-4 flex items-center gap-2 text-amber-600">
                  <CalendarX className="h-4 w-4" />
                  Pacientes Pendentes de Agendamento Cirúrgico ({report.pendingSchedulingPatients.length})
                </h3>
                <div className="space-y-2">
                  {report.pendingSchedulingPatients.map((patient) => (
                    <div 
                      key={patient.id} 
                      className="p-3 rounded-lg border border-amber-300 bg-amber-50/50"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-medium">{patient.name}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            {patient.registration_number && (
                              <span>#{patient.registration_number}</span>
                            )}
                            <Badge variant="outline" className="text-xs">
                              {SPECIALTY_LABELS[patient.specialty]}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right text-sm text-muted-foreground">
                          {patient.scheduling_pending_at && (
                            <span>
                              {format(new Date(patient.scheduling_pending_at), 'HH:mm')}
                            </span>
                          )}
                        </div>
                      </div>
                      {patient.scheduling_pending_reason && (
                        <div className="mt-2 p-2 bg-amber-100 rounded text-sm">
                          <span className="font-medium text-amber-700">Justificativa: </span>
                          <span className="text-amber-900">{patient.scheduling_pending_reason}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-8">Nenhum dado disponível</p>
        )}
      </DialogContent>
    </Dialog>
  );
}