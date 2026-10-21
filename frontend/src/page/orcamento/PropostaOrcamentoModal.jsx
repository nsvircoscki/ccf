import { useMemo, useState } from 'react';
import { Field, Icon, SelectField, Section, Shell, C, MONT, SANS } from '../../components/cadastros/CadastroKit.jsx';
import { formatarMoeda, desformatarMoeda, numeroParaMoeda } from '../../utils/mascaras.js';
import { municipiosSugeridos } from '../emissaoDocumentos/documentosData.js';
import { nomeCompletoServico } from '../emissaoDocumentos/documentosUtils.js';
import { abrirPropostaPdf } from './propostaPdf.js';

// Segunda janela do Orçamento (igual aos cadastros que abrem por cima da tela):
// confere e ajusta os dados da proposta de valores antes de gerar o PDF — os
// mesmos campos que existiam na antiga tela OS/Contrato. Nada aqui altera o
// orçamento salvo; é só o que vai impresso na proposta.
//
// inicial: { numero, cliente, matricula, area, municipio, itens: [{ nome, valor }] }
// disponiveis: serviços do orçamento que podem ser acrescentados [{ nome, valor }]
// totalSugerido: total do orçamento (respeita as condições de pagamento)
const RESPONSAVEIS = ['Eng. Charles Costi'];
const numeroParaCampo = (n) => numeroParaMoeda(Number(n || 0));

export default function PropostaOrcamentoModal({ inicial, disponiveis = [], totalSugerido, onClose }) {
  const accent = C.accent;
  const [dados, setDados] = useState({
    cliente: inicial.cliente || '',
    matricula: inicial.matricula || '',
    area: inicial.area || '',
    municipio: inicial.municipio || '',
    responsavel: RESPONSAVEIS[0],
    observacoes: '',
    pagamento: 'A combinar',
    validade: '10 dias',
  });
  const [itens, setItens] = useState(() => inicial.itens.map((item) => ({ nome: item.nome, valor: numeroParaCampo(item.valor) })));
  // Valor global acompanha a soma dos serviços até alguém digitar outro. Se
  // o orçamento tem condições de pagamento (total diferente da soma), já
  // começa com o total delas.
  const [valorGlobal, setValorGlobal] = useState(() => {
    const somaInicial = inicial.itens.reduce((total, item) => total + Number(item.valor || 0), 0);
    return totalSugerido != null && Math.abs(totalSugerido - somaInicial) > 0.005 ? numeroParaCampo(totalSugerido) : null;
  });
  const [adicionar, setAdicionar] = useState('');

  const set = (campo) => (valor) => setDados((atual) => ({ ...atual, [campo]: valor }));
  const soma = itens.reduce((total, item) => total + desformatarMoeda(item.valor), 0);
  const totalExibido = valorGlobal ?? numeroParaCampo(soma);

  const naoUsados = useMemo(
    () => disponiveis.filter((d) => !itens.some((i) => i.nome === d.nome)),
    [disponiveis, itens],
  );

  const alterarValor = (indice, valor) => setItens((atual) => atual.map((item, i) => (i === indice ? { ...item, valor: formatarMoeda(valor) } : item)));
  const remover = (indice) => setItens((atual) => atual.filter((_, i) => i !== indice));
  const incluir = (nome) => {
    const servico = disponiveis.find((d) => d.nome === nome);
    if (!servico) return;
    setItens((atual) => [...atual, { nome: servico.nome, valor: numeroParaCampo(servico.valor) }]);
    setAdicionar('');
  };

  const gerar = () => {
    abrirPropostaPdf({
      numero: inicial.numero || '',
      cliente: dados.cliente,
      matricula: dados.matricula,
      area: dados.area,
      municipio: dados.municipio,
      itens: itens.map((item) => ({ nome: item.nome, valor: desformatarMoeda(item.valor) })),
      total: desformatarMoeda(totalExibido),
      responsavel: dados.responsavel,
      observacoes: dados.observacoes,
      pagamento: dados.pagamento,
      validade: dados.validade,
    });
  };

  return (
    <Shell modal title="Proposta de serviços" subtitle={inicial.numero ? `Orçamento ${inicial.numero}` : 'Proposta de valores'} onBack={onClose} accent={accent}>
      <Section icon="user" title="Dados do cliente" desc="O que sai no cabeçalho e nas especificações da proposta" accent={accent}>
        <Field label="Nome do cliente" icon="user" span={2} value={dados.cliente} onChange={set('cliente')} />
        <Field label="Matrícula" icon="doc" value={dados.matricula} onChange={set('matricula')} />
        <Field label="Área informada" icon="ruler" value={dados.area} onChange={set('area')} placeholder="0,00 m²" />
        <Field label="Município/UF" icon="pin" span={2} value={dados.municipio} onChange={set('municipio')} list="municipios-proposta" />
        <datalist id="municipios-proposta">{municipiosSugeridos.map((m) => <option key={m} value={m} />)}</datalist>
      </Section>

      <Section icon="brief" title="Serviços" desc="Ajuste os valores, tire ou acrescente serviços" accent={accent}>
        <div style={{ gridColumn: '1 / -1', display: 'grid', gap: 8 }}>
          {itens.length === 0 && <span style={{ fontFamily: SANS, fontSize: 13, color: C.muted }}>Nenhum serviço na proposta.</span>}
          {itens.map((item, indice) => (
            <div key={item.nome} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ flex: 1, fontFamily: SANS, fontSize: 13.5, color: C.text, fontWeight: 600 }}>{indice + 1}. {nomeCompletoServico(item.nome)}</span>
              <input value={item.valor} onChange={(e) => alterarValor(indice, e.target.value)} inputMode="decimal" aria-label={`Valor de ${item.nome}`}
                style={{ width: 140, padding: '9px 12px', borderRadius: 10, border: `1.5px solid ${C.border}`, fontFamily: SANS, fontSize: 13.5, textAlign: 'right' }} />
              <button type="button" onClick={() => remover(indice)} aria-label={`Tirar ${item.nome}`} title="Tirar da proposta"
                style={{ width: 34, height: 34, borderRadius: 9, border: `1px solid ${C.border}`, background: '#fff', color: C.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="trash" size={14} />
              </button>
            </div>
          ))}
          {naoUsados.length > 0 && (
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 4 }}>
              <select value={adicionar} onChange={(e) => incluir(e.target.value)}
                style={{ flex: 1, padding: '9px 12px', borderRadius: 10, border: `1.5px dashed ${C.border}`, fontFamily: SANS, fontSize: 13, color: C.label, background: '#fff' }}>
                <option value="">+ Acrescentar serviço…</option>
                {naoUsados.map((d) => <option key={d.nome} value={d.nome}>{nomeCompletoServico(d.nome)}</option>)}
              </select>
            </div>
          )}
        </div>
      </Section>

      <Section icon="doc" title="Condições" accent={accent}>
        <SelectField label="Responsável técnico" icon="user" value={dados.responsavel} onChange={set('responsavel')} options={RESPONSAVEIS} />
        <Field label="Valor global (R$)" icon="hash" value={totalExibido} onChange={(v) => setValorGlobal(formatarMoeda(v))}
          hint={valorGlobal !== null ? 'Valor digitado à mão.' : 'Soma dos serviços (pode digitar outro).'} />
        <Field label="Pagamento" icon="doc" value={dados.pagamento} onChange={set('pagamento')} placeholder="A combinar" />
        <Field label="Validade da proposta" icon="doc" value={dados.validade} onChange={set('validade')} placeholder="10 dias" />
        <Field label="Observações adicionais" icon="doc" span={2} textarea rows={3} value={dados.observacoes} onChange={set('observacoes')} placeholder="Restrições de campo, condições específicas…" />
      </Section>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 18 }}>
        <button type="button" onClick={onClose} style={{ padding: '12px 22px', borderRadius: 11, border: `1.5px solid ${C.border}`, background: '#fff', color: C.label, fontFamily: MONT, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Fechar</button>
        <button type="button" onClick={gerar} disabled={!itens.length} style={{
          padding: '12px 26px', borderRadius: 11, border: 'none', color: '#fff', fontFamily: MONT, fontWeight: 700, fontSize: 13,
          background: itens.length ? `linear-gradient(135deg, ${accent} 0%, ${C.green} 100%)` : C.border, cursor: itens.length ? 'pointer' : 'not-allowed',
          display: 'inline-flex', alignItems: 'center', gap: 8,
        }}>
          <Icon name="download" size={16} /> Gerar proposta (PDF)
        </button>
      </div>
    </Shell>
  );
}
