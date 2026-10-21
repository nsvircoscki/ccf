import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowLeft, Check, CheckCircle2, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { C, Field, MONT, SANS, SearchableSelect, SelectField } from '../components/cadastros/CadastroKit.jsx';
import { AnimatedDropdown } from '../components/AnimatedDropdown';
import { clienteService } from '../services/clienteService.js';
import { imovelService } from '../services/imovelService.js';
import { CAR_ETAPAS, converterHaParaM2, converterM2ParaHa, diagnosticarCar } from './car/carLogic.js';
import { buscarModuloFiscal, buscarMunicipioPorNome, listarMunicipiosPorUf, normalizarUf, UFS_BRASIL } from './car/fmpUtils.js';

const estadoInicial = {
  municipio: 'São Bento do Sul',
  uf: 'SC',
  areaTotalHa: '35',
  areaTotalM2: '350000',
  moduloFiscalHa: '16',
  declarante: 'Proprietário',
  areaVegetacaoNativaHa: '8',
  areaAppHa: '2.5',
  areaConsolidadaAntes2008: 'Sim',
  passivoReservaLegal: 'Sim',
  passivoApp: 'Não',
  passivoUsoRestrito: 'Não',
  aderirPRA: 'Sim',
};

const opcoesDeclarante = [
  { value: 'Proprietário', label: 'Proprietário' },
  { value: 'Posseiro', label: 'Posseiro' },
];

const paraOpcaoCliente = (cliente) => ({
  value: cliente.id,
  label: cliente.nome,
  sub: cliente.documento || '',
});

const paraOpcaoImovel = (imovel) => ({
  value: imovel.id,
  label: imovel.matricula || 'Sem matrícula',
  sub: [
    (imovel.proprietarios || []).map((proprietario) => proprietario.nome).join(', '),
    [imovel.municipio, imovel.estado].filter(Boolean).join(' / '),
  ].filter(Boolean).join(' · '),
});

const converterAreaImovelParaM2 = (area) => {
  if (area == null || area === '') return '';
  const valor = String(area).trim().replace(/\s*m²$/i, '');
  const numero = valor.includes(',')
    ? Number(valor.replace(/\./g, '').replace(',', '.'))
    : Number(valor);
  return Number.isFinite(numero) && numero >= 0 ? String(numero) : '';
};

function SimNaoField({ label, value, onChange, span = 1 }) {
  return (
    <fieldset style={{ gridColumn: span === 2 ? '1 / -1' : 'auto', border: 0, padding: 0, margin: 0, minWidth: 0 }}>
      <legend style={{ fontFamily: MONT, fontWeight: 600, fontSize: 10.5, color: C.label, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 8 }}>
        {label}
      </legend>
      <div role="radiogroup" aria-label={label} style={{ display: 'flex', gap: 10 }}>
        {['Sim', 'Não'].map((opcao) => {
          const selecionada = value === opcao;
          return (
            <button
              key={opcao}
              type="button"
              role="radio"
              aria-checked={selecionada}
              onClick={() => onChange(opcao)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 9,
                flex: 1,
                minHeight: 42,
                padding: '9px 12px',
                border: `1.5px solid ${selecionada ? C.accent : C.border}`,
                borderRadius: 10,
                background: selecionada ? `${C.accent}0d` : '#fff',
                color: selecionada ? C.navy : C.label,
                fontFamily: SANS,
                fontSize: 13,
                fontWeight: selecionada ? 700 : 500,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'border-color 0.18s, background 0.18s, color 0.18s',
              }}
            >
              <span style={{
                width: 17,
                height: 17,
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: `1.5px solid ${selecionada ? C.accent : C.border}`,
                borderRadius: 4,
                background: selecionada ? C.accent : '#fff',
                color: '#fff',
              }}>
                {selecionada && <Check size={12} strokeWidth={3} />}
              </span>
              {opcao}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export default function RelatorioCarView({ onBack, kanban }) {
  const { workflows = [], workflowAtivo, setWorkflowAtivo } = kanban || {};
  const [etapaAtual, setEtapaAtual] = useState(0);
  const [dados, setDados] = useState(estadoInicial);
  const [clienteSelecionadoId, setClienteSelecionadoId] = useState(null);
  const [imovelSelecionadoId, setImovelSelecionadoId] = useState(null);
  const [clientes, setClientes] = useState([]);
  const [imoveis, setImoveis] = useState([]);
  const [erroCarregamento, setErroCarregamento] = useState('');
  const processoAtivo = workflows.find((workflow) => workflow.id === workflowAtivo) || workflows[0] || null;
  const clienteSelecionado = clientes.find((cliente) => cliente.id === clienteSelecionadoId) || null;
  const imovelSelecionado = imoveis.find((imovel) => imovel.id === imovelSelecionadoId) || null;
  const opcoesProcessos = [
    { value: '', label: 'Nenhum processo selecionado' },
    ...workflows.map((workflow) => ({
      value: workflow.id,
      label: workflow.name,
      sub: [workflow.servico?.nomeCliente, workflow.matricula].filter(Boolean).join(' · '),
    })),
  ];

  useEffect(() => {
    let ativo = true;
    Promise.all([clienteService.listarTodos(), imovelService.listarTodos()])
      .then(([listaClientes, listaImoveis]) => {
        if (!ativo) return;
        setClientes(Array.isArray(listaClientes) ? listaClientes : []);
        setImoveis(Array.isArray(listaImoveis) ? listaImoveis : []);
      })
      .catch((erro) => {
        console.error('Erro ao carregar clientes e imóveis para o CAR:', erro);
        if (ativo) setErroCarregamento('Não foi possível carregar a lista de clientes e imóveis.');
      });

    return () => { ativo = false; };
  }, []);

  const relatorio = useMemo(() => diagnosticarCar(dados), [dados]);

  const atualizar = (campo, valor) => {
    setDados((prev) => ({ ...prev, [campo]: valor }));
  };

  const selecionarCliente = (id) => {
    setClienteSelecionadoId(id);
    const cliente = clientes.find((item) => item.id === id);
    if (!cliente) return;
    const uf = normalizarUf(cliente.estado);
    const municipio = buscarMunicipioPorNome(uf, cliente.cidade);
    setDados((prev) => ({
      ...prev,
      uf,
      municipio: municipio?.value || cliente.cidade || '',
      moduloFiscalHa: municipio ? String(municipio.moduloFiscalHa) : '',
    }));
  };

  const selecionarImovel = (id) => {
    setImovelSelecionadoId(id);
    const imovel = imoveis.find((item) => item.id === id);
    if (!imovel) return;
    const uf = normalizarUf(imovel.estado);
    const municipio = buscarMunicipioPorNome(uf, imovel.municipio);
    const areaM2 = converterAreaImovelParaM2(imovel.area);
    setDados((prev) => ({
      ...prev,
      uf,
      municipio: municipio?.value || imovel.municipio || '',
      moduloFiscalHa: municipio ? String(municipio.moduloFiscalHa) : '',
      ...(areaM2 ? { areaTotalM2: areaM2, areaTotalHa: converterM2ParaHa(areaM2) } : {}),
    }));
  };

  const atualizarAreaHa = (valor) => {
    setDados((prev) => ({
      ...prev,
      areaTotalHa: valor,
      areaTotalM2: converterHaParaM2(valor),
    }));
  };

  const atualizarAreaM2 = (valor) => {
    setDados((prev) => ({
      ...prev,
      areaTotalM2: valor,
      areaTotalHa: converterM2ParaHa(valor),
    }));
  };

  const etapaAnterior = () => setEtapaAtual((atual) => Math.max(0, atual - 1));
  const proximaEtapa = () => setEtapaAtual((atual) => Math.min(CAR_ETAPAS.length - 1, atual + 1));

  const municipioOptions = listarMunicipiosPorUf(dados.uf);
  const selecoesAtivas = [
    {
      label: 'Processo',
      valor: workflowAtivo ? processoAtivo?.name : 'Nenhum processo selecionado',
      detalhe: workflowAtivo ? processoAtivo?.servico?.nomeCliente : '',
    },
    {
      label: 'Cliente',
      valor: clienteSelecionado?.nome || 'Nenhum cliente selecionado',
      detalhe: clienteSelecionado?.documento || '',
    },
    {
      label: 'Imóvel',
      valor: imovelSelecionado?.matricula || 'Nenhum imóvel selecionado',
      detalhe: imovelSelecionado
        ? [imovelSelecionado.municipio, imovelSelecionado.estado].filter(Boolean).join(' / ')
        : '',
    },
  ];

  const exportarRelatorio = () => {
    const linhas = [
      ...selecoesAtivas.map((selecao) => `${selecao.label}: ${selecao.valor}`),
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
          <AnimatedDropdown
            label="UF"
            value={dados.uf}
            onChange={(uf) => setDados((prev) => ({ ...prev, uf, municipio: '', moduloFiscalHa: '' }))}
            options={UFS_BRASIL}
            width="100%"
            searchable
            searchPlaceholder="Digite o nome ou a sigla da UF"
          />
          <AnimatedDropdown
            label="Município"
            value={dados.municipio}
            disabled={!dados.uf}
            placeholder={dados.uf ? 'Digite ou selecione...' : 'Selecione primeiro a UF'}
            searchPlaceholder="Buscar ou digitar município"
            width="100%"
            searchable
            allowCustom
            options={municipioOptions}
            onChange={(value) => {
              const moduloFiscalHa = buscarModuloFiscal(dados.uf, value);
              setDados((prev) => ({
                ...prev,
                municipio: value,
                moduloFiscalHa: moduloFiscalHa == null ? '' : String(moduloFiscalHa),
              }));
            }}
          />
          <Field label="Área total do imóvel (ha)" value={dados.areaTotalHa} onChange={atualizarAreaHa} placeholder="35" />
          <Field label="Área total do imóvel (m²)" value={dados.areaTotalM2} onChange={atualizarAreaM2} placeholder="350000" />
          <SelectField label="Vínculo do declarante" value={dados.declarante} onChange={(value) => atualizar('declarante', value)} options={opcoesDeclarante} span={2} />
        </div>
      );
    }

    if (etapaAtual === 1) {
      return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 18 }}>
          <Field
            label="Módulo fiscal local (ha)"
            type="number"
            value={dados.moduloFiscalHa}
            onChange={(value) => atualizar('moduloFiscalHa', value)}
            placeholder="Informe o módulo fiscal"
            disabled={buscarModuloFiscal(dados.uf, dados.municipio) != null}
            hint={buscarModuloFiscal(dados.uf, dados.municipio) != null
              ? 'Valor carregado automaticamente da planilha enviada.'
              : 'Sem registro correspondente na planilha; informe o valor manualmente.'}
          />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: MONT, fontWeight: 600, fontSize: 10.5, color: C.label, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 6 }}>
              Quantidade estimada
            </div>
            <div style={{ width: '100%', height: 42, boxSizing: 'border-box', display: 'flex', alignItems: 'center', padding: '0 14px', background: '#eef6ff', borderRadius: 10, border: `1.5px solid ${C.border}`, color: C.navy, fontFamily: MONT, fontWeight: 700, fontSize: 14 }}>
              {`${relatorio.resumoImovel.quantidadeMF.toFixed(2)} MF`}
            </div>
          </div>
          <Field label="Vegetação nativa remanescente (ha)" type="number" value={dados.areaVegetacaoNativaHa} onChange={(value) => atualizar('areaVegetacaoNativaHa', value)} placeholder="8" />
          <Field label="APP / áreas de uso restrito (ha)" type="number" value={dados.areaAppHa} onChange={(value) => atualizar('areaAppHa', value)} placeholder="2.5" />
        </div>
      );
    }

    if (etapaAtual === 2) {
      return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 18 }}>
          <SimNaoField label="Áreas em APP/RL foram consolidadas antes de 22/07/2008?" value={dados.areaConsolidadaAntes2008} onChange={(value) => atualizar('areaConsolidadaAntes2008', value)} span={2} />
          <div style={{ gridColumn: '1 / -1', background: '#f8fafc', border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
            <div style={{ fontFamily: MONT, fontWeight: 700, color: C.text, fontSize: 13, marginBottom: 8 }}>Orientação contextual</div>
            <div style={{ fontFamily: SANS, fontSize: 13, color: C.label, lineHeight: 1.7 }}>
              Se houve ocupação ou uso agrícola antes do marco temporal, o sistema considera a área como consolidada e pode reduzir a exigência de recomposição.
            </div>
          </div>
          <SimNaoField label="Há déficit na reserva legal?" value={dados.passivoReservaLegal} onChange={(value) => atualizar('passivoReservaLegal', value)} />
          <SimNaoField label="Há passivo em APP?" value={dados.passivoApp} onChange={(value) => atualizar('passivoApp', value)} />
          <SimNaoField label="Há passivo em uso restrito?" value={dados.passivoUsoRestrito} onChange={(value) => atualizar('passivoUsoRestrito', value)} />
          <SimNaoField label="Deseja orientações para adesão ao PRA?" value={dados.aderirPRA} onChange={(value) => atualizar('aderirPRA', value)} />
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
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: 'fit-content', maxWidth: '100%', background: '#fff', border: `1px solid ${C.border}`, borderRadius: 12, padding: '8px 12px' }}>
            <span style={{ flexShrink: 0, fontFamily: MONT, fontWeight: 700, color: C.text, fontSize: 11.5 }}>Etapa {etapaAtual + 1} de {CAR_ETAPAS.length}</span>
            <span style={{ fontFamily: SANS, fontSize: 11, color: C.muted, textAlign: 'right' }}>{CAR_ETAPAS[etapaAtual]}</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(220px, 280px)', alignItems: 'start', gap: 14, marginBottom: 20 }}>
          <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 18, padding: '16px 18px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 16 }}>
              <SearchableSelect
                label="Processo"
                icon="doc"
                value={workflowAtivo || null}
                onChange={(value) => setWorkflowAtivo?.(value || null)}
                options={opcoesProcessos}
                placeholder="Buscar processo, cliente ou matrícula…"
                accent={C.accent}
              />
              <SearchableSelect
                label="Cliente"
                icon="user"
                options={clientes.map(paraOpcaoCliente)}
                value={clienteSelecionadoId}
                onChange={selecionarCliente}
                placeholder="Buscar cliente cadastrado…"
                accent={C.accent}
              />
              <SearchableSelect
                label="Imóvel"
                icon="home"
                options={imoveis.map(paraOpcaoImovel)}
                value={imovelSelecionadoId}
                onChange={selecionarImovel}
                placeholder="Buscar imóvel cadastrado…"
                accent={C.accent}
              />
            </div>
            {erroCarregamento && (
              <div role="alert" style={{ fontFamily: SANS, fontSize: 12, color: '#b91c1c', marginTop: 12 }}>
                {erroCarregamento}
              </div>
            )}
          </div>

          <div style={{ background: '#f8fafc', border: `1px solid ${C.border}`, borderRadius: 14, padding: '10px 12px', minWidth: 0 }}>
            {selecoesAtivas.map((selecao, indice) => (
              <div
                key={selecao.label}
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  justifyContent: 'space-between',
                  gap: 10,
                  padding: '5px 0',
                  borderBottom: indice < selecoesAtivas.length - 1 ? `1px solid ${C.border}` : 'none',
                }}
              >
                <span style={{ flexShrink: 0, fontFamily: MONT, fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {selecao.label}
                </span>
                <span title={selecao.detalhe ? `${selecao.valor} · ${selecao.detalhe}` : selecao.valor} style={{ minWidth: 0, fontFamily: SANS, fontSize: 11.5, fontWeight: 600, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'right' }}>
                  {selecao.valor === `Nenhum ${selecao.label.toLowerCase()} selecionado` ? '—' : selecao.valor}
                </span>
              </div>
            ))}
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
