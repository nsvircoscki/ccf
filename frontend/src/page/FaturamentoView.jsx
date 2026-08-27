import React, { useEffect, useMemo, useState } from 'react';
import { faturamentoService } from '../services/faturamentoService';
import { clienteService } from '../services/clienteService';
import { servicoService } from '../services/servicoService';
import { formatarCEP, formatarTelefone } from '../utils/mascaras';
import {
  Actions, Field, Icon, SearchableSelect, SelectField, Section, Switch, Shell, Toast, useToast, C,
} from '../components/cadastros/CadastroKit.jsx';

const cobrancaVazia = {
  clienteId: null,
  servicoId: null,
  nomeCliente: '',
  documentoCliente: '',
  logradouro: '',
  numero: '',
  bairro: '',
  cidade: '',
  estado: '',
  cep: '',
  telefone: '',
  email: '',
  descricao: '',
  instrucoes: '',
  valorTotal: '',
  numeroParcelas: '1',
  primeiroVencimento: '',
  intervaloDias: '30',
};

const notaVazia = {
  clienteId: null,
  servicoId: null,
  empresa: '',
  nomeCliente: '',
  documentoCliente: '',
  logradouro: '',
  cep: '',
  cidade: '',
  valor: '',
  descricao: '',
};

const CORES_STATUS = { PENDENTE: '#b45309', EMITIDO: '#2e8b2e', ERRO: '#be123c' };

const moeda = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const parseDecimal = (valor) => {
  const normalizado = String(valor ?? '').replace(',', '.').replace(/[^0-9.]/g, '');
  const numero = parseFloat(normalizado);
  return Number.isFinite(numero) ? numero : 0;
};

const somarDias = (dataBase, dias) => {
  if (!dataBase) return '';
  const [ano, mes, dia] = dataBase.split('-').map(Number);
  const data = new Date(ano, mes - 1, dia);
  data.setDate(data.getDate() + dias);
  return data.toISOString().slice(0, 10);
};

// Divide o valor total em N parcelas iguais (a última absorve o resto do
// arredondamento) espaçadas por "intervaloDias", a partir do primeiro
// vencimento — mas respeita qualquer edição manual feita na parcela.
function gerarParcelas({ valorTotal, numeroParcelas, primeiroVencimento, intervaloDias, edicoes }) {
  const total = parseDecimal(valorTotal);
  const quantidade = Math.max(1, Math.floor(parseDecimal(numeroParcelas)) || 1);
  const intervalo = Math.max(0, Math.floor(parseDecimal(intervaloDias)) || 0);

  if (total <= 0 || !primeiroVencimento) return [];

  const valorPadrao = Math.round((total / quantidade) * 100) / 100;

  return Array.from({ length: quantidade }, (_, index) => {
    const numero = index + 1;
    const valorGerado = numero === quantidade
      ? Math.round((total - valorPadrao * (quantidade - 1)) * 100) / 100
      : valorPadrao;
    const vencimentoGerado = somarDias(primeiroVencimento, index * intervalo);

    const edicao = edicoes[numero];
    return {
      numero,
      valor: edicao?.valor !== undefined ? parseDecimal(edicao.valor) : valorGerado,
      vencimento: edicao?.vencimento || vencimentoGerado,
      manual: Boolean(edicao),
    };
  });
}

function BadgeStatus({ status }) {
  const cor = CORES_STATUS[status] || C.muted;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 999,
      background: `${cor}15`, color: cor, fontFamily: '"Montserrat", sans-serif', fontWeight: 700, fontSize: 11,
      letterSpacing: '0.04em', textTransform: 'uppercase',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: cor }} />
      {status}
    </span>
  );
}

// Painel flutuante simples (mesmo espírito do Shell modal) só pra listar o
// histórico — fica escondido atrás de um botão em vez de ocupar a tela toda
// o tempo inteiro, já que o usuário passa a maior parte do tempo lançando
// novos boletos/notas, não revendo os antigos.
function ModalHistorico({ titulo, onClose, children }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(14,37,73,0.45)', zIndex: 300,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div style={{
        background: C.bg, borderRadius: 18, width: 920, maxWidth: '100%', maxHeight: '86vh',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(14,37,73,0.25)', animation: 'fadeUp 0.25s ease both',
      }}>
        <div style={{
          background: '#fff', borderBottom: `1px solid ${C.border}`, height: 60, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 22px',
        }}>
          <h2 style={{ fontFamily: '"Montserrat", sans-serif', fontWeight: 700, fontSize: 16, color: C.text, margin: 0 }}>{titulo}</h2>
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: 9, border: `1px solid ${C.border}`, background: '#fff',
            cursor: 'pointer', color: C.label,
          }}>×</button>
        </div>
        <div className="scroll" style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: 20 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

export default function FaturamentoView({ onBack, usuarioLogado }) {
  const accent = C.accent;
  const { toast, show } = useToast();

  const [tipo, setTipo] = useState(null); // null | 'boleto' | 'nota'
  const [historicoAberto, setHistoricoAberto] = useState(false);

  const [clientes, setClientes] = useState([]);
  const [servicos, setServicos] = useState([]);

  const [avulso, setAvulso] = useState(false);
  const [formCobranca, setFormCobranca] = useState(cobrancaVazia);
  const [formNota, setFormNota] = useState(notaVazia);
  const [edicoesParcelas, setEdicoesParcelas] = useState({});
  const [salvando, setSalvando] = useState(false);
  const [emitindo, setEmitindo] = useState(null);

  const [cobrancas, setCobrancas] = useState([]);
  const [notasFiscais, setNotasFiscais] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const [listaClientes, listaServicos] = await Promise.all([
          clienteService.listarTodos(),
          servicoService.listarTodos(),
        ]);
        if (Array.isArray(listaClientes)) setClientes(listaClientes);
        if (Array.isArray(listaServicos)) setServicos(listaServicos);
      } catch (erro) {
        console.error('Erro ao carregar clientes/serviços:', erro);
      }
    })();
    carregarHistorico();
  }, []);

  const carregarHistorico = async () => {
    try {
      const [listaCobrancas, listaNotas] = await Promise.all([
        faturamentoService.listarCobrancas(),
        faturamentoService.listarNotasFiscais(),
      ]);
      if (Array.isArray(listaCobrancas)) setCobrancas(listaCobrancas);
      if (Array.isArray(listaNotas)) setNotasFiscais(listaNotas);
    } catch (erro) {
      console.error('Erro ao carregar histórico de faturamento:', erro);
    }
  };

  const opcoesClientes = clientes.map((c) => ({ value: c.id, label: c.nome, sub: c.documento }));
  const opcoesServicos = servicos.map((s) => ({ value: s.id, label: s.numeroServico, sub: s.nomeCliente }));

  const setCobranca = (campo) => (valor) => setFormCobranca((atual) => ({ ...atual, [campo]: valor }));
  const setNota = (campo) => (valor) => setFormNota((atual) => ({ ...atual, [campo]: valor }));

  const escolherCliente = (setForm) => (clienteId) => {
    if (!clienteId) {
      setForm((atual) => ({
        ...atual, clienteId: null, nomeCliente: '', documentoCliente: '',
        logradouro: '', numero: '', bairro: '', cidade: '', estado: '', cep: '', telefone: '', email: '',
      }));
      return;
    }
    const cliente = clientes.find((c) => c.id === clienteId);
    if (!cliente) return;
    setForm((atual) => ({
      ...atual,
      clienteId: cliente.id,
      nomeCliente: cliente.nome || '',
      documentoCliente: cliente.documento || '',
      logradouro: cliente.logradouro || '',
      numero: cliente.numero || '',
      bairro: cliente.bairro || '',
      cidade: cliente.cidade || '',
      estado: cliente.estado || '',
      cep: cliente.cep || '',
      telefone: cliente.telefone || '',
      email: cliente.email || '',
    }));
  };

  const parcelas = useMemo(() => gerarParcelas({
    valorTotal: formCobranca.valorTotal,
    numeroParcelas: formCobranca.numeroParcelas,
    primeiroVencimento: formCobranca.primeiroVencimento,
    intervaloDias: formCobranca.intervaloDias,
    edicoes: edicoesParcelas,
  }), [formCobranca.valorTotal, formCobranca.numeroParcelas, formCobranca.primeiroVencimento, formCobranca.intervaloDias, edicoesParcelas]);

  const totalParcelas = parcelas.reduce((soma, p) => soma + p.valor, 0);

  const editarParcela = (numero, campo, valor) => {
    setEdicoesParcelas((atual) => ({ ...atual, [numero]: { ...atual[numero], [campo]: valor } }));
  };

  const limparFormularioBoleto = () => {
    setFormCobranca(cobrancaVazia);
    setEdicoesParcelas({});
    setAvulso(false);
  };

  const salvarCobranca = async () => {
    if (parcelas.length === 0) {
      show('Informe o valor total, o primeiro vencimento e o número de parcelas.', 'err');
      return;
    }
    setSalvando(true);
    try {
      const { data, ok } = await faturamentoService.criarCobranca({
        ...formCobranca,
        documentoCliente: (formCobranca.documentoCliente || '').replace(/\D/g, ''),
        cep: (formCobranca.cep || '').replace(/\D/g, ''),
        parcelas: parcelas.map((p) => ({ numero: p.numero, valor: p.valor, vencimento: p.vencimento })),
      });
      if (!ok) { show(data?.error || 'Erro ao salvar cobrança.', 'err'); return; }
      show('Boleto(s) lançado(s). Abra o histórico pra emitir cada parcela.', 'ok');
      limparFormularioBoleto();
      carregarHistorico();
    } catch (erro) {
      console.error(erro);
      show('Erro ao conectar com o servidor.', 'err');
    } finally {
      setSalvando(false);
    }
  };

  const salvarNota = async () => {
    setSalvando(true);
    try {
      const { data, ok } = await faturamentoService.criarNotaFiscal({
        ...formNota,
        documentoCliente: (formNota.documentoCliente || '').replace(/\D/g, ''),
        cep: (formNota.cep || '').replace(/\D/g, ''),
      });
      if (!ok) { show(data?.error || 'Erro ao salvar nota fiscal.', 'err'); return; }
      show('Nota fiscal lançada. Abra o histórico pra emitir.', 'ok');
      setFormNota(notaVazia);
      setAvulso(false);
      carregarHistorico();
    } catch (erro) {
      console.error(erro);
      show('Erro ao conectar com o servidor.', 'err');
    } finally {
      setSalvando(false);
    }
  };

  const emitirParcela = async (cobrancaId, numeroParcela) => {
    const chave = `${cobrancaId}-${numeroParcela}`;
    setEmitindo(chave);
    try {
      const { data, ok } = await faturamentoService.emitirParcelaCobranca(cobrancaId, numeroParcela);
      show(ok ? 'Boleto emitido com sucesso!' : (data?.error || 'Erro ao emitir.'), ok ? 'ok' : 'err');
      carregarHistorico();
    } catch (erro) {
      console.error(erro);
      show('Erro ao conectar com o servidor.', 'err');
    } finally {
      setEmitindo(null);
    }
  };

  // Só pra parcela que já está EMITIDO no banco mas ainda sem o PDF salvo —
  // nunca chama a emissão de novo (evitaria duplicar o boleto no Inter).
  const tentarBaixarPdfParcela = async (cobrancaId, numeroParcela) => {
    const chave = `${cobrancaId}-${numeroParcela}`;
    setEmitindo(chave);
    try {
      const { data, ok } = await faturamentoService.tentarBaixarPdfParcela(cobrancaId, numeroParcela);
      show(ok && data?.caminhoPdf ? 'PDF baixado com sucesso!' : (data?.error || 'O PDF ainda não ficou pronto no banco. Tente de novo em instantes.'), ok && data?.caminhoPdf ? 'ok' : 'err');
      carregarHistorico();
    } catch (erro) {
      console.error(erro);
      show('Erro ao conectar com o servidor.', 'err');
    } finally {
      setEmitindo(null);
    }
  };

  const emitirNota = async (id) => {
    setEmitindo(id);
    try {
      const { data, ok } = await faturamentoService.emitirNotaFiscal(id);
      show(ok ? 'Nota fiscal emitida com sucesso!' : (data?.error || 'Erro ao emitir.'), ok ? 'ok' : 'err');
      carregarHistorico();
    } catch (erro) {
      console.error(erro);
      show('Erro ao conectar com o servidor.', 'err');
    } finally {
      setEmitindo(null);
    }
  };

  // Só pra nota que já está EMITIDO na prefeitura mas ainda sem o PDF salvo —
  // nunca chama a emissão de novo (evitaria duplicar a NFS-e).
  const tentarBaixarPdfNota = async (id) => {
    setEmitindo(id);
    try {
      const { data, ok } = await faturamentoService.tentarBaixarPdfNotaFiscal(id);
      show(ok && data?.caminhoPdf ? 'PDF baixado com sucesso!' : (data?.error || 'O PDF ainda não ficou pronto na prefeitura. Tente de novo em instantes.'), ok && data?.caminhoPdf ? 'ok' : 'err');
      carregarHistorico();
    } catch (erro) {
      console.error(erro);
      show('Erro ao conectar com o servidor.', 'err');
    } finally {
      setEmitindo(null);
    }
  };

  const camposClienteComuns = (form, setForm, setter) => (
    <>
      <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
        <Switch value={avulso} onChange={setAvulso} />
        <span style={{ fontFamily: '"Open Sans", sans-serif', fontSize: 13, color: C.label }}>
          Lançamento avulso (sem cliente cadastrado)
        </span>
      </div>

      {!avulso && (
        <SearchableSelect
          label="Cliente" icon="user" span={2} accent={accent}
          options={opcoesClientes} value={form.clienteId}
          onChange={escolherCliente(setForm)} placeholder="Buscar cliente cadastrado…"
        />
      )}

      <SearchableSelect
        label="Serviço vinculado (opcional)" icon="folder" span={2} accent={accent}
        options={opcoesServicos} value={form.servicoId}
        onChange={(id) => setter('servicoId')(id)} placeholder="Buscar serviço…"
      />

      <Field label="Nome do cliente" icon="user" value={form.nomeCliente} onChange={setter('nomeCliente')} disabled={!avulso} />
      <Field label="CPF/CNPJ" icon="id" value={form.documentoCliente} onChange={setter('documentoCliente')} disabled={!avulso} />
    </>
  );

  return (
    <Shell user={usuarioLogado} title="Faturamento" subtitle={tipo ? (tipo === 'boleto' ? 'Boletos' : 'Notas Fiscais') : 'Boletos e notas fiscais'} onBack={onBack} accent={accent} wide>
      {toast && <Toast msg={toast.msg} kind={toast.kind} />}

      {!tipo && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, animation: 'fadeUp 0.3s ease both' }}>
          {[['boleto', 'scale', 'Boleto', 'Emitir boletos bancários, com uma ou mais parcelas'], ['nota', 'doc', 'Nota Fiscal', 'Emitir NFS-e pra TOPOGRAFIA ou CONSULTORES']].map(([t, ic, tt, ds]) => (
            <button key={t} type="button" onClick={() => setTipo(t)} style={{
              background: '#fff', border: `1.5px solid ${C.borderSoft}`, borderRadius: 18, padding: '28px 22px',
              cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s ease', boxShadow: '0 3px 14px rgba(14,37,73,0.05)',
            }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = accent; e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 12px 30px ${accent}22`; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.borderSoft; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 3px 14px rgba(14,37,73,0.05)'; }}>
              <div style={{
                width: 52, height: 52, borderRadius: 14, color: '#fff', marginBottom: 16,
                background: `linear-gradient(150deg, ${accent}, ${accent}cc)`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 8px 18px ${accent}3a`,
              }}>
                <Icon name={ic} size={26} />
              </div>
              <div style={{ fontFamily: '"Montserrat", sans-serif', fontWeight: 700, fontSize: 17, color: C.text }}>{tt}</div>
              <div style={{ fontFamily: '"Open Sans", sans-serif', fontSize: 13, color: C.muted, marginTop: 4 }}>{ds}</div>
            </button>
          ))}
        </div>
      )}

      {tipo && (
        <div style={{ animation: 'fadeUp 0.3s ease both' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 7, padding: '6px 12px', borderRadius: 20,
                background: `${accent}14`, color: accent, fontFamily: '"Montserrat", sans-serif', fontWeight: 700, fontSize: 11.5,
              }}>
                <Icon name={tipo === 'boleto' ? 'scale' : 'doc'} size={14} />
                {tipo === 'boleto' ? 'Boleto' : 'Nota Fiscal'}
              </span>
              <button type="button" onClick={() => setTipo(null)} style={{
                background: 'none', border: 'none', cursor: 'pointer', fontFamily: '"Montserrat", sans-serif', fontWeight: 600,
                fontSize: 12, color: C.muted, textDecoration: 'underline',
              }}>trocar tipo</button>
            </div>
            <button type="button" onClick={() => setHistoricoAberto(true)} style={{
              display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 16px', borderRadius: 10,
              border: `1.5px solid ${C.border}`, background: '#fff', color: C.label, cursor: 'pointer',
              fontFamily: '"Montserrat", sans-serif', fontWeight: 700, fontSize: 12.5,
            }}>
              <Icon name="doc" size={14} /> Ver histórico
            </button>
          </div>

          {tipo === 'boleto' && (
            <>
              <Section icon="scale" title="Novo boleto" desc="Ligue a um cliente cadastrado ou lance avulso" accent={accent}>
                {camposClienteComuns(formCobranca, setFormCobranca, setCobranca)}
                <Field label="Logradouro" icon="map" value={formCobranca.logradouro} onChange={setCobranca('logradouro')} disabled={!avulso} />
                <Field label="Número" value={formCobranca.numero} onChange={setCobranca('numero')} disabled={!avulso} />
                <Field label="Bairro" value={formCobranca.bairro} onChange={setCobranca('bairro')} disabled={!avulso} />
                <Field label="Cidade" value={formCobranca.cidade} onChange={setCobranca('cidade')} disabled={!avulso} />
                <Field label="UF" value={formCobranca.estado} onChange={setCobranca('estado')} disabled={!avulso} />
                <Field label="CEP" value={formatarCEP(formCobranca.cep)} onChange={setCobranca('cep')} disabled={!avulso} />
                <Field label="Telefone" value={formatarTelefone(formCobranca.telefone)} onChange={setCobranca('telefone')} disabled={!avulso} />
                <Field label="E-mail" value={formCobranca.email} onChange={setCobranca('email')} disabled={!avulso} />
                <Field label="Descrição" span={2} value={formCobranca.descricao} onChange={setCobranca('descricao')} placeholder="Ex: Serviço de Topografia - Ref. XXXX" />
                <Field label="Instruções" span={2} value={formCobranca.instrucoes} onChange={setCobranca('instrucoes')} placeholder="Ex: Multa 2% / Juros 1% a.m." />
              </Section>

              <Section icon="calendar" title="Parcelamento" desc="O valor é dividido automaticamente, mas cada parcela pode ser ajustada depois" accent={accent}>
                <Field label="Valor total (R$)" icon="scale" type="number" value={formCobranca.valorTotal} onChange={setCobranca('valorTotal')} />
                <Field label="Número de parcelas" type="number" value={formCobranca.numeroParcelas} onChange={setCobranca('numeroParcelas')} />
                <Field label="Vencimento da 1ª parcela" icon="calendar" type="date" value={formCobranca.primeiroVencimento} onChange={setCobranca('primeiroVencimento')} />
                <Field label="Intervalo entre parcelas (dias)" type="number" value={formCobranca.intervaloDias} onChange={setCobranca('intervaloDias')} />

                {parcelas.length > 0 && (
                  <div style={{ gridColumn: '1 / -1', overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: '"Open Sans", sans-serif', fontSize: 13 }}>
                      <thead>
                        <tr style={{ textAlign: 'left', color: C.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          <th style={{ padding: '8px 10px' }}>Parcela</th>
                          <th style={{ padding: '8px 10px' }}>Valor</th>
                          <th style={{ padding: '8px 10px' }}>Vencimento</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parcelas.map((p) => (
                          <tr key={p.numero} style={{ borderTop: `1px solid ${C.borderSoft}`, background: p.manual ? '#fff8e8' : 'transparent' }}>
                            <td style={{ padding: '8px 10px', fontWeight: 700 }}>{p.numero}/{parcelas.length}</td>
                            <td style={{ padding: '8px 10px' }}>
                              <input
                                value={p.valor.toFixed(2).replace('.', ',')}
                                onChange={(e) => editarParcela(p.numero, 'valor', e.target.value)}
                                style={{ width: 120, padding: '7px 10px', borderRadius: 8, border: `1.5px solid ${C.border}`, fontFamily: 'inherit', fontSize: 13 }}
                              />
                            </td>
                            <td style={{ padding: '8px 10px' }}>
                              <input
                                type="date"
                                value={p.vencimento}
                                onChange={(e) => editarParcela(p.numero, 'vencimento', e.target.value)}
                                style={{ padding: '7px 10px', borderRadius: 8, border: `1.5px solid ${C.border}`, fontFamily: 'inherit', fontSize: 13 }}
                              />
                            </td>
                          </tr>
                        ))}
                        <tr style={{ borderTop: `2px solid ${C.border}`, fontWeight: 700 }}>
                          <td style={{ padding: '8px 10px' }}>Total</td>
                          <td style={{ padding: '8px 10px' }}>{moeda(totalParcelas)}</td>
                          <td />
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </Section>

              <Actions accent={accent} saving={salvando} onSave={salvarCobranca} saveLabel={salvando ? 'Salvando…' : 'Lançar boleto(s)'} />
            </>
          )}

          {tipo === 'nota' && (
            <>
              <Section icon="doc" title="Nova nota fiscal" desc="Ligue a um cliente cadastrado ou lance avulso" accent={accent}>
                <SelectField label="Empresa emissora" icon="brief" span={2} value={formNota.empresa}
                  onChange={setNota('empresa')} options={['TOPOGRAFIA', 'CONSULTORES']} />
                {camposClienteComuns(formNota, setFormNota, setNota)}
                <Field label="Logradouro" icon="map" value={formNota.logradouro} onChange={setNota('logradouro')} disabled={!avulso} />
                <Field label="CEP" value={formatarCEP(formNota.cep)} onChange={setNota('cep')} disabled={!avulso} />
                <Field label="Valor (R$)" icon="scale" type="number" value={formNota.valor} onChange={setNota('valor')} />
                <Field label="Descrição do serviço" span={2} textarea value={formNota.descricao} onChange={setNota('descricao')} />
              </Section>

              <Actions accent={accent} saving={salvando} onSave={salvarNota} saveLabel={salvando ? 'Salvando…' : 'Lançar nota fiscal'} />
            </>
          )}
        </div>
      )}

      {historicoAberto && tipo === 'boleto' && (
        <ModalHistorico titulo="Histórico de boletos" onClose={() => setHistoricoAberto(false)}>
          {cobrancas.length === 0 && (
            <p style={{ textAlign: 'center', color: C.muted, fontFamily: '"Open Sans", sans-serif' }}>Nenhum boleto lançado ainda.</p>
          )}
          {cobrancas.map((c) => (
            <div key={c.id} style={{ background: '#fff', borderRadius: 14, border: `1px solid ${C.borderSoft}`, padding: 16, marginBottom: 14 }}>
              <div style={{ fontFamily: '"Montserrat", sans-serif', fontWeight: 700, color: C.text, marginBottom: 2 }}>{c.nomeCliente}</div>
              {c.descricao && <div style={{ fontFamily: '"Open Sans", sans-serif', fontSize: 12.5, color: C.muted, marginBottom: 10 }}>{c.descricao}</div>}
              <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: '"Open Sans", sans-serif', fontSize: 13 }}>
                <thead>
                  <tr style={{ textAlign: 'left', color: C.muted, fontSize: 11, textTransform: 'uppercase' }}>
                    <th style={{ padding: '6px 8px' }}>Parcela</th>
                    <th style={{ padding: '6px 8px' }}>Valor</th>
                    <th style={{ padding: '6px 8px' }}>Vencimento</th>
                    <th style={{ padding: '6px 8px' }}>Status</th>
                    <th style={{ padding: '6px 8px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {c.parcelas.map((p) => {
                    const chave = `${c.id}-${p.numero}`;
                    return (
                      <tr key={p.id} style={{ borderTop: `1px solid ${C.borderSoft}` }}>
                        <td style={{ padding: '8px' }}>{p.numero}/{c.parcelas.length}</td>
                        <td style={{ padding: '8px' }}>{moeda(p.valor)}</td>
                        <td style={{ padding: '8px' }}>{new Date(p.vencimento).toLocaleDateString('pt-BR')}</td>
                        <td style={{ padding: '8px' }}>
                          <BadgeStatus status={p.status} />
                          {p.erroMensagem && (
                            <div style={{ color: p.status === 'ERRO' ? C.danger : '#b45309', fontSize: 11, marginTop: 4, maxWidth: 260 }}>{p.erroMensagem}</div>
                          )}
                        </td>
                        <td style={{ padding: '8px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                          {p.status === 'EMITIDO' && p.caminhoPdf && (
                            <a href={faturamentoService.urlPdfParcelaCobranca(c.id, p.numero)} target="_blank" rel="noreferrer"
                              style={{ color: accent, fontWeight: 700, fontSize: 12, textDecoration: 'none' }}>
                              Baixar PDF
                            </a>
                          )}
                          {p.status === 'EMITIDO' && !p.caminhoPdf && (
                            // Boleto já existe no banco (não reemite) — só o PDF que não veio ainda.
                            <button onClick={() => tentarBaixarPdfParcela(c.id, p.numero)} disabled={emitindo === chave} style={{
                              padding: '6px 12px', borderRadius: 8, border: `1.5px solid ${accent}`, cursor: 'pointer',
                              background: '#fff', color: accent, fontFamily: '"Montserrat", sans-serif',
                              fontWeight: 700, fontSize: 11.5, opacity: emitindo === chave ? 0.6 : 1,
                            }}>
                              {emitindo === chave ? 'Buscando…' : 'Tentar baixar PDF'}
                            </button>
                          )}
                          {p.status !== 'EMITIDO' && (
                            <button onClick={() => emitirParcela(c.id, p.numero)} disabled={emitindo === chave} style={{
                              padding: '6px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                              background: accent, color: '#fff', fontFamily: '"Montserrat", sans-serif',
                              fontWeight: 700, fontSize: 11.5, opacity: emitindo === chave ? 0.6 : 1,
                            }}>
                              {emitindo === chave ? 'Emitindo…' : 'Emitir'}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ))}
        </ModalHistorico>
      )}

      {historicoAberto && tipo === 'nota' && (
        <ModalHistorico titulo="Histórico de notas fiscais" onClose={() => setHistoricoAberto(false)}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: '"Open Sans", sans-serif', fontSize: 13 }}>
            <thead>
              <tr style={{ textAlign: 'left', color: C.muted, fontSize: 11, textTransform: 'uppercase' }}>
                <th style={{ padding: '8px 10px' }}>Empresa</th>
                <th style={{ padding: '8px 10px' }}>Cliente</th>
                <th style={{ padding: '8px 10px' }}>Valor</th>
                <th style={{ padding: '8px 10px' }}>Status</th>
                <th style={{ padding: '8px 10px' }}></th>
              </tr>
            </thead>
            <tbody>
              {notasFiscais.map((n) => (
                <tr key={n.id} style={{ borderTop: `1px solid ${C.borderSoft}` }}>
                  <td style={{ padding: '10px' }}>{n.empresa}</td>
                  <td style={{ padding: '10px' }}>{n.nomeCliente}</td>
                  <td style={{ padding: '10px' }}>{moeda(n.valor)}</td>
                  <td style={{ padding: '10px' }}>
                    <BadgeStatus status={n.status} />
                    {n.erroMensagem && (
                      <div style={{ color: n.status === 'ERRO' ? C.danger : '#b45309', fontSize: 11, marginTop: 4, maxWidth: 260 }}>{n.erroMensagem}</div>
                    )}
                  </td>
                  <td style={{ padding: '10px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                    {n.status === 'EMITIDO' && n.caminhoPdf && (
                      <a href={faturamentoService.urlPdfNotaFiscal(n.id)} target="_blank" rel="noreferrer"
                        style={{ color: accent, fontWeight: 700, fontSize: 12.5, textDecoration: 'none' }}>
                        Baixar PDF
                      </a>
                    )}
                    {n.status === 'EMITIDO' && !n.caminhoPdf && (
                      <button onClick={() => tentarBaixarPdfNota(n.id)} disabled={emitindo === n.id} style={{
                        padding: '7px 14px', borderRadius: 9, border: `1.5px solid ${accent}`, cursor: 'pointer',
                        background: '#fff', color: accent, fontFamily: '"Montserrat", sans-serif',
                        fontWeight: 700, fontSize: 12, opacity: emitindo === n.id ? 0.6 : 1,
                      }}>
                        {emitindo === n.id ? 'Buscando…' : 'Tentar baixar PDF'}
                      </button>
                    )}
                    {n.status !== 'EMITIDO' && (
                      <button onClick={() => emitirNota(n.id)} disabled={emitindo === n.id} style={{
                        padding: '7px 14px', borderRadius: 9, border: 'none', cursor: 'pointer',
                        background: accent, color: '#fff', fontFamily: '"Montserrat", sans-serif',
                        fontWeight: 700, fontSize: 12, opacity: emitindo === n.id ? 0.6 : 1,
                      }}>
                        {emitindo === n.id ? 'Emitindo…' : 'Emitir'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {notasFiscais.length === 0 && (
                <tr><td colSpan={5} style={{ padding: '18px 10px', textAlign: 'center', color: C.muted }}>Nenhuma nota fiscal lançada ainda.</td></tr>
              )}
            </tbody>
          </table>
        </ModalHistorico>
      )}
    </Shell>
  );
}
