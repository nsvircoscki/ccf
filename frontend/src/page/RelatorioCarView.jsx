import { useMemo, useState } from 'react';
import { AlertTriangle, ArrowLeft, CheckCircle2, ChevronLeft, ChevronRight, Download, FileBarChart2 } from 'lucide-react';
import { C, Field, MONT, SANS, SelectField } from '../components/cadastros/CadastroKit.jsx';
import { AnimatedDropdown } from '../components/AnimatedDropdown';
import { CAR_ETAPAS, diagnosticarCar } from './car/carLogic.js';

const estadoInicial = {
  municipio: 'São Bento do Sul',
  uf: 'SC',
  areaTotalHa: '35',
  moduloFiscalHa: '14',
  declarante: 'Proprietário',
  areaVegetacaoNativaHa: '8',
  areaAppHa: '2.5',
  areaConsolidadaAntes2008: 'Sim',
  passivoReservaLegal: 'Sim',
  passivoApp: 'Não',
  passivoUsoRestrito: 'Não',
  aderirPRA: 'Sim',
};

const opcoesSimNao = [
  { value: 'Sim', label: 'Sim' },
  { value: 'Não', label: 'Não' },
];

const opcoesDeclarante = [
  { value: 'Proprietário', label: 'Proprietário' },
  { value: 'Posseiro', label: 'Posseiro' },
];

export default function RelatorioCarView({ onBack, kanban }) {
  const { workflows = [], workflowAtivo, setWorkflowAtivo } = kanban || {};
  const [etapaAtual, setEtapaAtual] = useState(0);
  const [dados, setDados] = useState(estadoInicial);
  const processoAtivo = workflows.find((workflow) => workflow.id === workflowAtivo) || workflows[0] || null;
  const opcoesProcessos = [
    { value: '', label: 'Nenhum processo selecionado' },
    ...workflows.map((workflow) => ({
      value: workflow.id,
      label: workflow.name,
      sub: workflow.servico?.nomeCliente || '',
      keywords: `${workflow.name || ''} ${workflow.servico?.nomeCliente || ''} ${workflow.matricula || ''}`,
    })),
  ];

  const relatorio = useMemo(() => diagnosticarCar(dados), [dados]);

  const atualizar = (campo, valor) => {
    setDados((prev) => ({ ...prev, [campo]: valor }));
  };

  const etapaAnterior = () => setEtapaAtual((atual) => Math.max(0, atual - 1));
  const proximaEtapa = () => setEtapaAtual((atual) => Math.min(CAR_ETAPAS.length - 1, atual + 1));

  const progresso = ((etapaAtual + 1) / CAR_ETAPAS.length) * 100;

  const exportarRelatorio = () => {
    const linhas = [
      `Processo: ${processoAtivo?.name || 'Nenhum processo selecionado'}`,
      `Protocolo: ${relatorio.protocoloConsulta}`,
      `Data: ${relatorio.dataEmissao}`,
      `Resumo do imóvel: ${relatorio.resumoImovel.enquadramento}`,
      `Quantidade de MF: ${relatorio.resumoImovel.quantidadeMF}`,
      `Reserva legal: ${relatorio.diagnosticoEInstrucoes.reservaLegal.percentualExigido}`,
      `Regra aplicada: ${relatorio.diagnosticoEInstrucoes.reservaLegal.regraAplicada}`,
      `PRA: ${relatorio.diagnosticoEInstrucoes.regularizacaoPRA.status}`,
    ];

    const blob = new Blob([linhas.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'relatorio-car.txt';
    link.click();
    URL.revokeObjectURL(url);
  };

  const renderEtapa = () => {
    if (etapaAtual === 0) {
      return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 18 }}>
          <Field label="Município" value={dados.municipio} onChange={(value) => atualizar('municipio', value)} placeholder="Ex.: São Bento do Sul" span={2} />
          <Field label="UF" value={dados.uf} onChange={(value) => atualizar('uf', value)} placeholder="SC" />
          <Field label="Área total do imóvel (ha)" type="number" value={dados.areaTotalHa} onChange={(value) => atualizar('areaTotalHa', value)} placeholder="35" />
          <SelectField label="Vínculo do declarante" value={dados.declarante} onChange={(value) => atualizar('declarante', value)} options={opcoesDeclarante} span={2} />
        </div>
      );
    }

    if (etapaAtual === 1) {
      return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 18 }}>
          <Field label="Módulo fiscal local (ha)" type="number" value={dados.moduloFiscalHa} onChange={(value) => atualizar('moduloFiscalHa', value)} placeholder="14" />
          <Field label="Vegetação nativa remanescente (ha)" type="number" value={dados.areaVegetacaoNativaHa} onChange={(value) => atualizar('areaVegetacaoNativaHa', value)} placeholder="8" />
          <Field label="APP / áreas de uso restrito (ha)" type="number" value={dados.areaAppHa} onChange={(value) => atualizar('areaAppHa', value)} placeholder="2.5" />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#eef6ff', borderRadius: 12, border: `1px solid ${C.border}`, minHeight: 74, color: C.navy, fontFamily: MONT, fontWeight: 700 }}>
            {`Quantidade estimada: ${Number((Number(dados.areaTotalHa || 0) / (Number(dados.moduloFiscalHa || 14) || 14))).toFixed(2)} MF`}
          </div>
        </div>
      );
    }

    if (etapaAtual === 2) {
      return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 18 }}>
          <SelectField label="Áreas em APP/RL foram consolidadas antes de 22/07/2008?" value={dados.areaConsolidadaAntes2008} onChange={(value) => atualizar('areaConsolidadaAntes2008', value)} options={opcoesSimNao} span={2} />
          <div style={{ gridColumn: '1 / -1', background: '#f8fafc', border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
            <div style={{ fontFamily: MONT, fontWeight: 700, color: C.text, fontSize: 13, marginBottom: 8 }}>Orientação contextual</div>
            <div style={{ fontFamily: SANS, fontSize: 13, color: C.label, lineHeight: 1.7 }}>
              Se houve ocupação ou uso agrícola antes do marco temporal, o sistema considera a área como consolidada e pode reduzir a exigência de recomposição.
            </div>
          </div>
        </div>
      );
    }

    if (etapaAtual === 3) {
      return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 18 }}>
          <SelectField label="Há déficit na reserva legal?" value={dados.passivoReservaLegal} onChange={(value) => atualizar('passivoReservaLegal', value)} options={opcoesSimNao} />
          <SelectField label="Há passivo em APP?" value={dados.passivoApp} onChange={(value) => atualizar('passivoApp', value)} options={opcoesSimNao} />
          <SelectField label="Há passivo em uso restrito?" value={dados.passivoUsoRestrito} onChange={(value) => atualizar('passivoUsoRestrito', value)} options={opcoesSimNao} />
          <SelectField label="Deseja orientações para adesão ao PRA?" value={dados.aderirPRA} onChange={(value) => atualizar('aderirPRA', value)} options={opcoesSimNao} />
        </div>
      );
    }

    return (
      <div style={{ display: 'grid', gap: 18 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 16 }}>
          {[
            { label: 'Enquadramento', valor: relatorio.resumoImovel.enquadramento, cor: '#2563eb' },
            { label: 'MF', valor: `${relatorio.resumoImovel.quantidadeMF} MF`, cor: '#7c3aed' },
            { label: 'PRA', valor: relatorio.diagnosticoEInstrucoes.regularizacaoPRA.status, cor: relatorio.passivoDetectado ? '#d97706' : '#16a34a' },
          ].map((item) => (
            <div key={item.label} style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 14, padding: 18 }}>
              <div style={{ fontFamily: SANS, fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{item.label}</div>
              <div style={{ fontFamily: MONT, fontWeight: 700, color: item.cor, fontSize: 15 }}>{item.valor}</div>
            </div>
          ))}
        </div>

        <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 14, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            {relatorio.passivoDetectado ? <AlertTriangle size={18} color="#d97706" /> : <CheckCircle2 size={18} color="#16a34a" />}
            <span style={{ fontFamily: MONT, fontWeight: 700, fontSize: 15, color: C.text }}>{relatorio.passivoDetectado ? 'Passivo detectado' : 'Sem passivo detectado'}</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 18 }}>
            <div>
              <div style={{ fontFamily: MONT, fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>Reserva legal</div>
              <div style={{ fontFamily: SANS, fontSize: 13, color: C.text, lineHeight: 1.7 }}>
                {relatorio.diagnosticoEInstrucoes.reservaLegal.percentualExigido} · {relatorio.diagnosticoEInstrucoes.reservaLegal.regraAplicada}
              </div>
            </div>
            <div>
              <div style={{ fontFamily: MONT, fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>Preenchimento no SICAR</div>
              <div style={{ fontFamily: SANS, fontSize: 13, color: C.text, lineHeight: 1.7 }}>
                {relatorio.diagnosticoEInstrucoes.reservaLegal.comoPreencherNoCAR}
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <button type="button" onClick={exportarRelatorio} style={{ display: 'flex', alignItems: 'center', gap: 8, border: 0, borderRadius: 10, background: C.accent, color: '#fff', fontFamily: MONT, fontWeight: 700, padding: '12px 18px', cursor: 'pointer' }}>
            <Download size={16} /> Exportar relatório
          </button>
          <button type="button" onClick={() => window.print()} style={{ border: `1px solid ${C.border}`, borderRadius: 10, background: '#fff', color: C.text, fontFamily: MONT, fontWeight: 700, padding: '12px 18px', cursor: 'pointer' }}>
            Imprimir / PDF
          </button>
        </div>
      </div>
    );
  };

  return (
    <div style={{ position: 'relative', flex: 1, minHeight: 0, background: C.bg, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <header style={{ background: '#fff', borderBottom: `1px solid ${C.border}`, height: 64, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 16, padding: '0 28px' }}>
        <button type="button" onClick={onBack} aria-label="Voltar" style={{ width: 38, height: 38, borderRadius: 10, border: `1px solid ${C.border}`, background: '#fff', cursor: 'pointer', color: C.label, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <ArrowLeft size={16} />
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontFamily: MONT, fontWeight: 700, fontSize: 17, color: C.text, margin: 0, letterSpacing: '-0.01em' }}>Relatório CAR</h1>
          <p style={{ fontFamily: SANS, fontSize: 12.5, color: '#2563eb', margin: 0, fontWeight: 600 }}>Consulta e diagnóstico para preenchimento do CAR</p>
        </div>
      </header>

      <main className="scroll" style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '26px 28px 60px', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, padding: '18px 20px', background: '#fff', border: `1px solid ${C.border}`, borderRadius: 18 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: '#dbeafe', color: '#1d4ed8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileBarChart2 size={22} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: MONT, fontWeight: 700, fontSize: 14, color: C.text }}>Wizard de diagnóstico do CAR</div>
            <div style={{ fontFamily: SANS, fontSize: 12.5, color: C.muted, marginTop: 2 }}>Fluxo passo a passo para orientar o preenchimento no SICAR.</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.5fr) minmax(220px, 0.8fr)', gap: 18, marginBottom: 20 }}>
          <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 18, padding: '16px 18px' }}>
            <AnimatedDropdown
              label="Processo ativo"
              value={workflowAtivo || ''}
              onChange={(value) => setWorkflowAtivo?.(value)}
              options={opcoesProcessos}
              width="100%"
              searchable
              searchPlaceholder="Buscar processo, cliente ou matrícula"
            />
          </div>

          <div style={{ background: '#f8fafc', border: `1px solid ${C.border}`, borderRadius: 18, padding: '16px 18px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ fontFamily: MONT, fontSize: 10.5, color: C.muted, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>Processo em análise</div>
            <div style={{ fontFamily: MONT, fontWeight: 700, fontSize: 14, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {processoAtivo?.name || 'Nenhum processo selecionado'}
            </div>
            {processoAtivo?.servico?.nomeCliente && (
              <div style={{ fontFamily: SANS, fontSize: 12.5, color: C.label, marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {processoAtivo.servico.nomeCliente}
              </div>
            )}
          </div>
        </div>

        <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 18, padding: 22, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontFamily: MONT, fontWeight: 700, color: C.text, fontSize: 13 }}>Etapa {etapaAtual + 1} de {CAR_ETAPAS.length}</span>
            <span style={{ fontFamily: SANS, fontSize: 12, color: C.muted }}>{CAR_ETAPAS[etapaAtual]}</span>
          </div>
          <div style={{ height: 8, background: '#edf2ff', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{ width: `${progresso}%`, height: '100%', background: 'linear-gradient(90deg, #2D7AFD, #7c3aed)', borderRadius: 999 }} />
          </div>
        </div>

        <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 18, padding: 22 }}>
          {renderEtapa()}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 26, gap: 12, flexWrap: 'wrap' }}>
            <button type="button" onClick={etapaAnterior} disabled={etapaAtual === 0} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', border: `1px solid ${C.border}`, borderRadius: 10, background: '#fff', color: C.label, fontFamily: MONT, fontWeight: 700, cursor: etapaAtual === 0 ? 'not-allowed' : 'pointer', opacity: etapaAtual === 0 ? 0.5 : 1 }}>
              <ChevronLeft size={16} /> Voltar
            </button>

            <button type="button" onClick={proximaEtapa} disabled={etapaAtual === CAR_ETAPAS.length - 1} style={{ display: 'flex', alignItems: 'center', gap: 8, border: 0, borderRadius: 10, background: C.accent, color: '#fff', fontFamily: MONT, fontWeight: 700, padding: '10px 18px', cursor: etapaAtual === CAR_ETAPAS.length - 1 ? 'not-allowed' : 'pointer', opacity: etapaAtual === CAR_ETAPAS.length - 1 ? 0.5 : 1 }}>
              Próxima <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
