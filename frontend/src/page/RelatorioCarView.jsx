import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowLeft, Check, CheckCircle2, Download } from 'lucide-react';
import { C, Field, MONT, SANS, SearchableSelect, Section, SelectField } from '../components/cadastros/CadastroKit.jsx';
import { AnimatedDropdown } from '../components/AnimatedDropdown';
import { clienteService } from '../services/clienteService.js';
import { imovelService } from '../services/imovelService.js';
import { servicoService } from '../services/servicoService.js';
import { formatarCPF, formatarTelefone } from '../utils/mascaras.js';
import { converterHaParaM2, converterM2ParaHa, diagnosticarCar } from './car/carLogic.js';
import { buscarModuloFiscal, listarMunicipiosPorUf, UFS_BRASIL } from './car/fmpUtils.js';

const URL_CAR_CADASTRO = 'https://app.car.sc.gov.br/credenciado/cadastrar';
const URL_CAR_SISTEMA = 'https://app.car.sc.gov.br/';
const DATA_MAXIMA = (() => {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, '0');
  const dia = String(hoje.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
})();

const estadoInicial = {
  municipio: '',
  uf: '',
  areaTotalHa: '',
  areaTotalM2: '',
  moduloFiscalHa: '',
  declarante: '',
  areaVegetacaoNativaHa: '',
  areaAppHa: '',
  areaConsolidadaAntes2008: '',
  passivoReservaLegal: '',
  passivoApp: '',
  passivoUsoRestrito: '',
  aderirPRA: '',
};

const cadastroCarVazio = {
  cpf: '',
  nome: '',
  email: '',
  telefone: '',
  nomeMae: '',
  dataNascimento: '',
  profissao: '',
  conselho: '',
  numeroRegistro: '',
  senha: '',
  confirmarSenha: '',
};

const credenciaisCarVazias = { cpf: '', senha: '' };

function cpfValido(valor) {
  const cpf = String(valor || '').replace(/\D/g, '');
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;

  const calcularDigito = (base, pesoInicial) => {
    const soma = [...base].reduce((total, digito, indice) => total + Number(digito) * (pesoInicial - indice), 0);
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };

  const primeiro = calcularDigito(cpf.slice(0, 9), 10);
  const segundo = calcularDigito(cpf.slice(0, 10), 11);
  return Number(cpf[9]) === primeiro && Number(cpf[10]) === segundo;
}

const opcoesDeclarante = [
  { value: 'Proprietário', label: 'Proprietário' },
  { value: 'Posseiro', label: 'Posseiro' },
];

const SERVICO_TESTE_ID = 'servico-teste-car-provisorio';
const servicoTeste = {
  id: SERVICO_TESTE_ID,
  numeroServico: 'TESTE-CAR',
  nomeCliente: 'Serviço provisório para testes',
  municipio: 'São Bento do Sul',
};

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

const paraOpcaoServico = (servico) => ({
  value: servico.id,
  label: servico.numeroServico,
  sub: [servico.nomeCliente, servico.municipio].filter(Boolean).join(' · '),
});

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

function PerguntaOpcoes({ ariaLabel, opcoes, value, onChange }) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16 }}>
      {opcoes.map((opcao) => {
        const selecionada = value === opcao.value;
        return (
          <button
            key={opcao.value}
            type="button"
            role="radio"
            aria-checked={selecionada}
            onClick={() => onChange(opcao.value)}
            style={{
              background: selecionada ? `${C.accent}0d` : '#fff',
              border: `1.5px solid ${selecionada ? C.accent : C.borderSoft}`,
              borderRadius: 18,
              padding: '24px 22px',
              cursor: 'pointer',
              textAlign: 'left',
              boxShadow: selecionada ? `0 8px 24px ${C.accent}18` : '0 3px 14px rgba(14,37,73,0.05)',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <span style={{ fontFamily: MONT, fontWeight: 700, fontSize: 15, color: C.text }}>{opcao.label}</span>
              <span style={{
                width: 22,
                height: 22,
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: `1.5px solid ${selecionada ? C.accent : C.border}`,
                borderRadius: 6,
                background: selecionada ? C.accent : '#fff',
                color: '#fff',
              }}>
                {selecionada && <Check size={14} strokeWidth={3} />}
              </span>
            </span>
            <span style={{ display: 'block', fontFamily: SANS, fontSize: 13, color: C.muted, marginTop: 8 }}>{opcao.detail}</span>
          </button>
        );
      })}
    </div>
  );
}

export default function RelatorioCarView({ onBack }) {
  const [dados, setDados] = useState(estadoInicial);
  const [servicoSelecionadoId, setServicoSelecionadoId] = useState(null);
  const [clienteSelecionadoId, setClienteSelecionadoId] = useState(null);
  const [imovelSelecionadoId, setImovelSelecionadoId] = useState(null);
  const [primeiroAcesso, setPrimeiroAcesso] = useState(null);
  const [possuiLogin, setPossuiLogin] = useState(null);
  const [acessoCarLiberado, setAcessoCarLiberado] = useState(false);
  const [cadastroCar, setCadastroCar] = useState(cadastroCarVazio);
  const [credenciaisCar, setCredenciaisCar] = useState(credenciaisCarVazias);
  const [servicos, setServicos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [imoveis, setImoveis] = useState([]);
  const [erroCarregamento, setErroCarregamento] = useState('');
  const servicoSelecionado = servicos.find((servico) => servico.id === servicoSelecionadoId)
    || (servicoSelecionadoId === SERVICO_TESTE_ID ? servicoTeste : null);
  const clienteSelecionado = clientes.find((cliente) => cliente.id === clienteSelecionadoId) || null;
  const imovelSelecionado = imoveis.find((imovel) => imovel.id === imovelSelecionadoId) || null;
  const algumItemSelecionado = Boolean(servicoSelecionadoId || imovelSelecionadoId || clienteSelecionadoId);

  useEffect(() => {
    let ativo = true;
    Promise.all([
      servicoService.listarTodos(),
      clienteService.listarTodos(),
      imovelService.listarTodos(),
    ])
      .then(([listaServicos, listaClientes, listaImoveis]) => {
        if (!ativo) return;
        setServicos(Array.isArray(listaServicos) ? listaServicos : []);
        setClientes(Array.isArray(listaClientes) ? listaClientes : []);
        setImoveis(Array.isArray(listaImoveis) ? listaImoveis : []);
      })
      .catch((erro) => {
        console.error('Erro ao carregar serviços, clientes e imóveis para o CAR:', erro);
        if (ativo) setErroCarregamento('Não foi possível carregar os serviços, clientes e imóveis.');
      });

    return () => { ativo = false; };
  }, []);

  const relatorio = useMemo(() => diagnosticarCar(dados), [dados]);

  const atualizar = (campo, valor) => {
    setDados((prev) => ({ ...prev, [campo]: valor }));
  };

  const alterarPrimeiroAcesso = (valor) => {
    setPrimeiroAcesso(valor);
    setAcessoCarLiberado(false);
  };

  const cadastroCarValido = Boolean(
    cpfValido(cadastroCar.cpf)
    && cadastroCar.nome.trim()
    && /^[^\s@]+@outlook\.com$/i.test(cadastroCar.email.trim())
    && [10, 11].includes(cadastroCar.telefone.replace(/\D/g, '').length)
    && cadastroCar.nomeMae.trim()
    && cadastroCar.dataNascimento
    && !Number.isNaN(Date.parse(`${cadastroCar.dataNascimento}T00:00:00`))
    && cadastroCar.dataNascimento <= DATA_MAXIMA
    && cadastroCar.senha.length >= 6
    && cadastroCar.senha === cadastroCar.confirmarSenha,
  );

  const credenciaisCarValidas = Boolean(
    cpfValido(credenciaisCar.cpf)
    && credenciaisCar.senha,
  );

  const abrirCadastroCar = () => {
    window.open(URL_CAR_CADASTRO, '_blank', 'noopener,noreferrer');
  };

  const seguirParaFormularioCar = () => {
    setAcessoCarLiberado(true);
  };

  const abrirSistemaCar = () => {
    window.open(URL_CAR_SISTEMA, '_blank', 'noopener,noreferrer');
  };

  const selecionarCliente = (id) => {
    alterarPrimeiroAcesso(null);
    setClienteSelecionadoId(id);
  };

  const selecionarImovel = (id) => {
    alterarPrimeiroAcesso(null);
    setImovelSelecionadoId(id);
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

  const municipioOptions = listarMunicipiosPorUf(dados.uf);
  const selecoesAtivas = [
    {
      label: 'Serviço',
      valor: servicoSelecionado?.numeroServico || 'Nenhum serviço selecionado',
      detalhe: servicoSelecionado?.nomeCliente || '',
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

  const renderFormulario = () => (
    <>
      <Section icon="map" title="Dados do imóvel" desc="Localização, área e vínculo do declarante" accent={C.accent}>
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
      </Section>

      <Section icon="scale" title="Porte e vegetação" desc="Módulo fiscal e áreas ambientais" accent={C.accent}>
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
          <div style={{ fontFamily: MONT, fontWeight: 600, fontSize: 10.5, color: C.label, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 6 }}>
            Quantidade estimada
          </div>
          <div style={{ width: '100%', height: 42, boxSizing: 'border-box', display: 'flex', alignItems: 'center', padding: '0 14px', background: '#eef6ff', borderRadius: 10, border: `1.5px solid ${C.border}`, color: C.navy, fontFamily: MONT, fontWeight: 700, fontSize: 14 }}>
            {`${relatorio.resumoImovel.quantidadeMF.toFixed(2)} MF`}
          </div>
        </div>
        <Field label="Vegetação nativa remanescente (ha)" type="number" value={dados.areaVegetacaoNativaHa} onChange={(value) => atualizar('areaVegetacaoNativaHa', value)} placeholder="8" />
        <Field label="APP / áreas de uso restrito (ha)" type="number" value={dados.areaAppHa} onChange={(value) => atualizar('areaAppHa', value)} placeholder="2.5" />
      </Section>

      <Section icon="doc" title="Histórico ambiental e PRA" desc="Informações para o diagnóstico orientativo" accent={C.accent}>
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
      </Section>
    </>
  );

  const renderRelatorio = () => (
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

      <main className="scroll" style={{ flex: 1, minHeight: 0, overflowY: 'auto', maxWidth: 1120, width: '100%', margin: '0 auto', padding: '26px 32px 60px', boxSizing: 'border-box' }}>
        <Section icon="doc" title="Identificação" desc="Selecione o serviço, o imóvel e o cliente para iniciar" accent={C.accent}>
          <SearchableSelect
            label="Serviço"
            icon="doc"
            options={[...servicos.map(paraOpcaoServico), {
              value: SERVICO_TESTE_ID,
              label: 'TESTE-CAR — serviço provisório',
              sub: 'Somente para testar o formulário; não está salvo no cadastro.',
            }]}
            value={servicoSelecionadoId}
            onChange={(value) => {
              setServicoSelecionadoId(value);
              alterarPrimeiroAcesso(null);
              setDados(estadoInicial);
            }}
            placeholder="Buscar serviço cadastrado…"
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
          <SearchableSelect
            label="Cliente"
            icon="user"
            options={clientes.map(paraOpcaoCliente)}
            value={clienteSelecionadoId}
            onChange={selecionarCliente}
            placeholder="Buscar cliente cadastrado…"
            accent={C.accent}
          />
          {erroCarregamento && (
            <div role="alert" style={{ gridColumn: '1 / -1', fontFamily: SANS, fontSize: 12, color: '#b91c1c' }}>
              {erroCarregamento}
            </div>
          )}
        </Section>

        {algumItemSelecionado && (
          <Section icon="user" title="Acesso ao CAR" desc="Este cliente já acessou o CAR/SICAR alguma vez?" accent={C.accent}>
            <PerguntaOpcoes
              ariaLabel="Primeiro acesso ao CAR"
              value={primeiroAcesso}
              onChange={alterarPrimeiroAcesso}
              opcoes={[
                { value: 'sim', label: 'Sim, é o primeiro acesso', detail: 'Preencher os dados para iniciar o cadastro no CAR.' },
                { value: 'nao', label: 'Não, já acessou antes', detail: 'Verificar se já possui login no sistema.' },
              ]}
            />
          </Section>
        )}

        {primeiroAcesso === 'sim' && (
          <>
            <Section icon="user" title="Novo acesso ao CAR" desc="Preencha os dados para iniciar o cadastro de credenciado" accent={C.accent}>
              <Field label="CPF" icon="id" value={cadastroCar.cpf} required inputMode="numeric" maxLength={14}
                onChange={(valor) => setCadastroCar((atual) => ({ ...atual, cpf: formatarCPF(valor) }))}
                placeholder="000.000.000-00"
                hint={cadastroCar.cpf && !cpfValido(cadastroCar.cpf) ? 'Informe um CPF válido.' : undefined}
                hintColor={C.danger} />
              <Field label="Nome completo" icon="user" value={cadastroCar.nome} required
                onChange={(valor) => setCadastroCar((atual) => ({ ...atual, nome: valor }))}
                placeholder="Nome completo" />
              <Field label="E-mail Outlook" icon="mail" type="email" value={cadastroCar.email} required
                onChange={(valor) => setCadastroCar((atual) => ({ ...atual, email: valor }))}
                placeholder="nome@outlook.com"
                hint={cadastroCar.email && !/^[^\s@]+@outlook\.com$/i.test(cadastroCar.email.trim())
                  ? 'Informe um endereço válido com domínio @outlook.com.'
                  : 'É obrigatório usar um endereço @outlook.com.'} />
              <Field label="Telefone" icon="phone" type="tel" value={cadastroCar.telefone} required inputMode="tel" maxLength={15}
                onChange={(valor) => setCadastroCar((atual) => ({ ...atual, telefone: formatarTelefone(valor) }))}
                placeholder="(00) 00000-0000"
                hint={cadastroCar.telefone && cadastroCar.telefone.replace(/\D/g, '').length < 10
                  ? 'Informe um telefone com DDD e pelo menos 10 dígitos.'
                  : undefined} />
              <Field label="Nome completo da mãe" icon="user" value={cadastroCar.nomeMae} required
                onChange={(valor) => setCadastroCar((atual) => ({ ...atual, nomeMae: valor }))}
                placeholder="Nome completo da mãe" />
              <Field label="Data de nascimento" icon="calendar" type="date" value={cadastroCar.dataNascimento} required max={DATA_MAXIMA}
                onChange={(valor) => setCadastroCar((atual) => ({ ...atual, dataNascimento: valor }))}
                hint={cadastroCar.dataNascimento && cadastroCar.dataNascimento > DATA_MAXIMA
                  ? 'A data de nascimento não pode ser futura.'
                  : undefined}
                hintColor={C.danger} />
              <Field label="Profissão" icon="brief" value={cadastroCar.profissao}
                onChange={(valor) => setCadastroCar((atual) => ({ ...atual, profissao: valor }))}
                placeholder="Profissão" />
              <Field label="Conselho profissional" value={cadastroCar.conselho}
                onChange={(valor) => setCadastroCar((atual) => ({ ...atual, conselho: valor }))}
                placeholder="Ex.: CREA" />
              <Field label="Número de registro" value={cadastroCar.numeroRegistro}
                onChange={(valor) => setCadastroCar((atual) => ({ ...atual, numeroRegistro: valor }))}
                placeholder="Número no conselho" />
              <Field label="Senha" type="password" value={cadastroCar.senha} required minLength={6}
                onChange={(valor) => setCadastroCar((atual) => ({ ...atual, senha: valor }))}
                hint={cadastroCar.senha && cadastroCar.senha.length < 6 ? 'A senha deve ter no mínimo 6 caracteres.' : undefined}
                hintColor={C.danger} />
              <Field label="Confirmar senha" type="password" value={cadastroCar.confirmarSenha} required minLength={6}
                onChange={(valor) => setCadastroCar((atual) => ({ ...atual, confirmarSenha: valor }))}
                hint={cadastroCar.confirmarSenha && cadastroCar.senha !== cadastroCar.confirmarSenha
                  ? 'As senhas informadas não são iguais.'
                  : undefined}
                hintColor={C.danger} />
            </Section>
            <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 14, padding: 16, marginBottom: 14, fontFamily: SANS, fontSize: 12.5, color: C.label, lineHeight: 1.6 }}>
              O botão verde abre o portal oficial em outra aba. Os dados preenchidos aqui não são salvos nem enviados automaticamente ao portal.
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 18 }}>
              <button type="button" onClick={abrirCadastroCar} style={{ border: 0, borderRadius: 10, background: C.green, color: '#fff', fontFamily: MONT, fontWeight: 700, padding: '12px 18px', cursor: 'pointer' }}>
                Abrir site do CAR
              </button>
              <button type="button" onClick={seguirParaFormularioCar} disabled={!cadastroCarValido} style={{ border: 0, borderRadius: 10, background: C.accent, color: '#fff', fontFamily: MONT, fontWeight: 700, padding: '12px 18px', cursor: cadastroCarValido ? 'pointer' : 'not-allowed', opacity: cadastroCarValido ? 1 : 0.55 }}>
                Seguir
              </button>
            </div>
          </>
        )}

        {primeiroAcesso === 'nao' && (
          <Section icon="user" title="Acesso existente" desc="Este cliente já possui login no CAR/SICAR?" accent={C.accent}>
            <PerguntaOpcoes
              ariaLabel="Já possui login no CAR"
              value={possuiLogin}
              onChange={(valor) => {
                setPossuiLogin(valor);
                setAcessoCarLiberado(false);
              }}
              opcoes={[
                { value: 'sim', label: 'Sim, já possui login', detail: 'Informe o CPF e a senha para continuar.' },
                { value: 'nao', label: 'Não possui login', detail: 'Este fluxo será definido depois.' },
              ]}
            />
          </Section>
        )}

        {primeiroAcesso === 'nao' && possuiLogin === 'sim' && (
          <>
            <Section icon="id" title="Entrar no CAR" desc="Informe os dados de acesso do cliente" accent={C.accent}>
              <Field label="CPF" icon="id" value={credenciaisCar.cpf} required inputMode="numeric" maxLength={14}
                onChange={(valor) => setCredenciaisCar((atual) => ({ ...atual, cpf: formatarCPF(valor) }))}
                placeholder="000.000.000-00"
                hint={credenciaisCar.cpf && !cpfValido(credenciaisCar.cpf) ? 'Informe um CPF válido.' : undefined} />
              <Field label="Senha" type="password" value={credenciaisCar.senha} required
                onChange={(valor) => setCredenciaisCar((atual) => ({ ...atual, senha: valor }))} />
            </Section>
            <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 14, padding: 16, marginBottom: 14, fontFamily: SANS, fontSize: 12.5, color: C.label, lineHeight: 1.6 }}>
              O botão verde abre o portal oficial em outra aba. O CCF não envia CPF ou senha ao portal; conclua o login diretamente no site.
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 18 }}>
              <button type="button" onClick={abrirSistemaCar} style={{ border: 0, borderRadius: 10, background: C.green, color: '#fff', fontFamily: MONT, fontWeight: 700, padding: '12px 18px', cursor: 'pointer' }}>
                Abrir site do CAR
              </button>
              <button type="button" onClick={seguirParaFormularioCar} disabled={!credenciaisCarValidas} style={{ border: 0, borderRadius: 10, background: C.accent, color: '#fff', fontFamily: MONT, fontWeight: 700, padding: '12px 18px', cursor: credenciaisCarValidas ? 'pointer' : 'not-allowed', opacity: credenciaisCarValidas ? 1 : 0.55 }}>
                Seguir
              </button>
            </div>
          </>
        )}

        {primeiroAcesso === 'nao' && possuiLogin === 'nao' && (
          <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 18, padding: 22, marginBottom: 18 }}>
            <div style={{ fontFamily: MONT, fontWeight: 700, fontSize: 15, color: C.text, marginBottom: 6 }}>Fluxo ainda não disponível</div>
            <div style={{ fontFamily: SANS, fontSize: 13, color: C.label, lineHeight: 1.7 }}>
              O cadastro de acesso para quem ainda não possui login será definido depois.
            </div>
          </div>
        )}

        {acessoCarLiberado && (
          <>
            {renderFormulario()}
            {renderRelatorio()}
          </>
        )}

      </main>
    </div>
  );
}
