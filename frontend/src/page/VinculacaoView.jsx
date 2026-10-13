import React, { useEffect, useState } from 'react';
import { servicoService } from '../services/servicoService';
import { clienteService } from '../services/clienteService';
import { imovelService } from '../services/imovelService';
import {
  Actions, CheckboxList, ChipList, Field, Icon, SearchableSelect, SelectField, Section, Segmented, Shell, Toast, useToast, C,
} from '../components/cadastros/CadastroKit.jsx';
import CadastroClienteView from './CadastroClienteView.jsx';
import CadastroImovelView from './CadastroImovelView.jsx';
import { useEstadoNavegavel } from '../hooks/useNavegacao';
import { formatarArea, desformatarArea } from '../utils/mascaras';

const vinculacaoVazia = {
  proprietarioIds: [],
  imovelId: '',
  situacaoProprietario: '',
  procuradorId: '',
  confrontanteIds: [],
  descricaoAtualImovel: '',
  memorialDescritivoRetificacao: '',
  superiorOuInferior: 'superior',
  totalLotes: '',
  averbacoes: '',
  areasDesmembramento: '',
  listaProtocoloEntrega: '',
};

// Áreas do desmembramento: guardadas como JSON { areas: [m², ...], remanescente: m² }
// no mesmo campo de texto (o gerador de documentos monta a frase). Texto
// antigo, digitado à mão, fica visível até ser refeito com os campos.
const MAX_AREAS = 50;
const numeroParaArea = (n) => (n == null || n === '' ? '' : formatarArea(Number(n).toFixed(2).replace('.', ',')));
const areaParaNumero = (texto) => {
  const n = parseFloat(desformatarArea(texto));
  return Number.isFinite(n) ? n : null;
};
const desmembramentoVazio = { areas: [], remanescente: '', textoAntigo: null };
function lerDesmembramento(texto) {
  if (!texto) return desmembramentoVazio;
  try {
    const dados = JSON.parse(texto);
    if (dados && Array.isArray(dados.areas)) {
      return { areas: dados.areas.map(numeroParaArea), remanescente: numeroParaArea(dados.remanescente), textoAntigo: null };
    }
  } catch { /* texto livre de antes */ }
  return { ...desmembramentoVazio, textoAntigo: texto };
}
function gravarDesmembramento(desm) {
  if (!desm.areas.length && !desm.remanescente) return desm.textoAntigo || '';
  return JSON.stringify({ areas: desm.areas.map(areaParaNumero), remanescente: areaParaNumero(desm.remanescente) });
}
const doisDigitos = (n) => String(n).padStart(2, '0');

const paraOpcaoPessoa = (cliente) => ({ value: cliente.id, label: cliente.nome, sub: cliente.documento });
const nomesProprietarios = (imovel) => (imovel.proprietarios || []).map((p) => p.nome).join(', ') || 'Sem proprietário';
const paraOpcaoImovel = (imovel) => ({
  value: imovel.id,
  label: imovel.matricula || 'Sem matrícula',
  sub: nomesProprietarios(imovel),
});
const paraOpcaoServico = (servico) => ({ value: servico.id, label: servico.numeroServico, sub: servico.nomeCliente });

const TABS = [
  { id: 'vinc', label: 'Vínculos', icon: 'link', desc: 'Proprietários, imóvel e confrontantes' },
  { id: 'retif', label: 'Descrição', icon: 'ruler', desc: 'Descrição atual e memorial descritivo' },
  { id: 'docs', label: 'Documentos', icon: 'doc', desc: 'Lotes, averbações e protocolos' },
];

export default function VinculacaoView({ onBack }) {
  const accent = C.accent;
  const { toast, show } = useToast();
  const [servicoId, setServicoId] = useState(null);
  const [servicos, setServicos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [imoveis, setImoveis] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [form, setForm] = useState(vinculacaoVazia);
  const [tab, setTab, definirTabSemHistorico] = useEstadoNavegavel('vinc');
  const [salvando, setSalvando] = useState(false);
  const [desmembramento, setDesmembramento] = useState(desmembramentoVazio);
  const [areaMedida, setAreaMedida] = useState(null);
  // null | 'proprietario' | 'procurador' — qual seletor de pessoa disparou o
  // cadastro rápido, pra saber em qual campo entrar a pessoa criada.
  const [alvoModalPessoa, setAlvoModalPessoa] = useState(null);
  const [modalImovelAberto, setModalImovelAberto] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [listaServicos, listaClientes, listaImoveis, listaTemplates] = await Promise.all([
          servicoService.listarTodos(),
          clienteService.listarTodos(),
          imovelService.listarTodos(),
          servicoService.listarTemplatesDocumento(),
        ]);
        if (Array.isArray(listaServicos)) setServicos(listaServicos);
        if (Array.isArray(listaClientes)) setClientes(listaClientes);
        if (Array.isArray(listaImoveis)) setImoveis(listaImoveis);
        if (Array.isArray(listaTemplates)) setTemplates(listaTemplates);
      } catch (erro) {
        console.error('Erro ao carregar dados da vinculação:', erro);
      }
    })();
  }, []);

  const set = (campo) => (valor) => setForm((atual) => ({ ...atual, [campo]: valor }));

  const carregarServico = async (id) => {
    if (!id) {
      setServicoId(null);
      setForm(vinculacaoVazia);
      setDesmembramento(desmembramentoVazio);
      setAreaMedida(null);
      return;
    }

    try {
      const servico = await servicoService.buscarPorId(id);
      setServicoId(servico.id);
      definirTabSemHistorico('vinc');
      setDesmembramento(lerDesmembramento(servico.areasDesmembramento));
      setAreaMedida(servico.area ?? null);
      setForm({
        proprietarioIds: (servico.proprietarios || []).map((p) => p.id),
        imovelId: servico.imovelId || '',
        situacaoProprietario: servico.situacaoProprietario || '',
        procuradorId: servico.procuradorId || '',
        confrontanteIds: (servico.confrontantes || []).map((c) => c.id),
        descricaoAtualImovel: servico.descricaoAtualImovel || '',
        memorialDescritivoRetificacao: servico.memorialDescritivoRetificacao || '',
        superiorOuInferior: servico.superiorOuInferior || 'superior',
        totalLotes: servico.totalLotes != null ? String(servico.totalLotes) : '',
        averbacoes: servico.averbacoes || '',
        areasDesmembramento: servico.areasDesmembramento || '',
        listaProtocoloEntrega: servico.listaProtocoloEntrega || '',
      });
    } catch (erro) {
      console.error(erro);
      show('Erro ao carregar o serviço.', 'err');
    }
  };

  const handleSalvar = async () => {
    if (!servicoId) {
      show('Selecione um serviço para vincular.', 'err');
      return;
    }

    setSalvando(true);
    try {
      const res = await servicoService.salvarVinculacao(servicoId, { ...form, areasDesmembramento: gravarDesmembramento(desmembramento) });
      if (!res.ok) {
        show(res.data?.error || 'Erro ao salvar vinculação.', 'err');
        return;
      }
      show('Vinculação salva com sucesso.');
    } catch (erro) {
      console.error(erro);
      show('Erro ao conectar com o servidor.', 'err');
    } finally {
      setSalvando(false);
    }
  };

  // O protocolo de entrega é guardado como texto (um nome de documento por
  // linha) — aqui a gente só traduz isso pra um checklist nos dois sentidos.
  const protocoloSelecionado = templates
    .filter((t) => (form.listaProtocoloEntrega || '').split('\n').includes(t.nome))
    .map((t) => t.chave);
  const handleProtocoloChange = (chaves) => {
    const nomes = templates.filter((t) => chaves.includes(t.chave)).map((t) => t.nome);
    set('listaProtocoloEntrega')(nomes.join('\n'));
  };

  const alterarQuantidadeAreas = (valor) => {
    const quantidade = Math.min(MAX_AREAS, Number(String(valor).replace(/\D/g, '')) || 0);
    setDesmembramento((d) => ({
      ...d,
      areas: Array.from({ length: quantidade }, (_, i) => d.areas[i] || ''),
    }));
  };
  // Sugestão da remanescente: área medida do serviço menos as áreas desmembradas.
  const somaAreas = desmembramento.areas.reduce((total, a) => total + (areaParaNumero(a) || 0), 0);
  const sobraCalculada = areaMedida && desmembramento.areas.length
    ? `Área medida ${numeroParaArea(areaMedida)} − áreas ${numeroParaArea(somaAreas)} = ${numeroParaArea(areaMedida - somaAreas)}`
    : undefined;

  const svcSelecionado = servicos.find((s) => s.id === servicoId);

  return (
    <Shell
      title="SIS DOC"
      wide
      accent={accent}
      subtitle={svcSelecionado ? `${svcSelecionado.numeroServico} — ${svcSelecionado.nomeCliente}` : 'Selecione um serviço para começar'}
      onBack={onBack}
    >
      {toast && <Toast msg={toast.msg} kind={toast.kind} />}

      <div style={{ marginBottom: 20 }}>
        <SearchableSelect label="Serviço" icon="brief" accent={accent}
          options={servicos.map(paraOpcaoServico)} value={servicoId}
          onChange={carregarServico} placeholder="Buscar serviço (número — cliente)…" />
      </div>

      {!servicoId ? (
        <div style={{
          background: '#fff', border: `1.5px dashed ${C.border}`, borderRadius: 18, padding: '48px 24px',
          textAlign: 'center', color: C.muted,
        }}>
          <div style={{ color: accent, display: 'inline-flex', marginBottom: 12 }}><Icon name="link" size={34} /></div>
          <p style={{ fontFamily: '"Montserrat", sans-serif', fontWeight: 700, fontSize: 15, color: C.text, margin: '0 0 4px' }}>Escolha um serviço</p>
          <p style={{ fontFamily: '"Open Sans", sans-serif', fontSize: 13.5, margin: 0 }}>
            Ao selecionar, você poderá vincular proprietários, imóvel, confrontantes e preencher só os documentos que o serviço exige.
          </p>
        </div>
      ) : (
        <div style={{ animation: 'fadeUp 0.3s ease both' }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
            {TABS.map((t) => {
              const on = tab === t.id;
              return (
                <button key={t.id} type="button" onClick={() => setTab(t.id)} style={{
                  flex: '1 1 200px', textAlign: 'left', cursor: 'pointer',
                  background: on ? '#fff' : 'transparent',
                  border: `1.5px solid ${on ? accent : C.border}`, borderRadius: 14, padding: '13px 16px',
                  boxShadow: on ? `0 6px 18px ${accent}22` : 'none', transition: 'all 0.2s ease',
                  display: 'flex', alignItems: 'center', gap: 11,
                }}>
                  <span style={{
                    width: 34, height: 34, borderRadius: 9, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: on ? `linear-gradient(150deg, ${accent}, ${accent}cc)` : C.bg,
                    color: on ? '#fff' : C.muted,
                  }}><Icon name={t.icon} size={17} /></span>
                  <span>
                    <span style={{ display: 'block', fontFamily: '"Montserrat", sans-serif', fontWeight: 700, fontSize: 13, color: on ? C.text : C.label }}>{t.label}</span>
                    <span style={{ display: 'block', fontFamily: '"Open Sans", sans-serif', fontSize: 11, color: C.muted }}>{t.desc}</span>
                  </span>
                </button>
              );
            })}
          </div>

          {tab === 'vinc' && (
            <div style={{ animation: 'fadeUp 0.25s ease both' }}>
              <Section icon="link" title="Vínculos do serviço" accent={accent}>
                <ChipList label="Proprietários" icon="user" accent={accent} span={2}
                  options={clientes.map(paraOpcaoPessoa)} values={form.proprietarioIds}
                  onChange={(v) => set('proprietarioIds')(v)} placeholder="Buscar cliente para adicionar…"
                  emptyHint="Nenhum proprietário vinculado a este serviço ainda."
                  onCriarNovo={() => setAlvoModalPessoa('proprietario')} criarNovoLabel="Cadastrar nova pessoa" />
                <SelectField label="Situação neste serviço" icon="scale" value={form.situacaoProprietario} onChange={set('situacaoProprietario')}
                  options={[
                    { value: 'proprietário', label: 'Proprietário' },
                    { value: 'herdeiro', label: 'Herdeiro' },
                    { value: 'inventariante', label: 'Inventariante' },
                    { value: 'representante', label: 'Representante' },
                  ]} />
                <SearchableSelect label="Imóvel" icon="home" accent={accent} span={2}
                  options={imoveis.map(paraOpcaoImovel)} value={form.imovelId || null}
                  onChange={(v) => set('imovelId')(v || '')} placeholder="Buscar imóvel (matrícula — proprietário)…" />

                <SearchableSelect label="Procurador (opcional)" icon="user" accent={accent} span={2}
                  options={clientes.filter((c) => !form.proprietarioIds.includes(c.id)).map(paraOpcaoPessoa)}
                  value={form.procuradorId || null} onChange={(v) => set('procuradorId')(v || '')}
                  placeholder="Buscar pessoa com procuração neste serviço…"
                  onCriarNovo={() => setAlvoModalPessoa('procurador')} criarNovoLabel="Cadastrar nova pessoa" />

                <ChipList label="Adicionar confrontante" icon="plus" accent={accent} span={2}
                  options={imoveis.filter((i) => i.id !== form.imovelId).map(paraOpcaoImovel)}
                  values={form.confrontanteIds} onChange={(v) => set('confrontanteIds')(v)}
                  placeholder="Buscar imóvel confrontante para adicionar…"
                  emptyHint="Nenhum confrontante vinculado a este serviço ainda."
                  onCriarNovo={() => setModalImovelAberto(true)} criarNovoLabel="Cadastrar novo imóvel" />
              </Section>
            </div>
          )}

          {tab === 'retif' && (
            <div style={{ animation: 'fadeUp 0.25s ease both' }}>
              <Section icon="ruler" title="Descrição do imóvel" desc="Descrição atual e memorial descritivo" accent={accent}>
                <Field label="Descrição atual do imóvel (conforme registro)" icon="doc" span={2} textarea rows={4}
                  value={form.descricaoAtualImovel} onChange={set('descricaoAtualImovel')} placeholder="Descrição do imóvel constante na matrícula atual…" />
                <Field label="Memorial descritivo da retificação" icon="doc" span={2} textarea rows={8}
                  value={form.memorialDescritivoRetificacao} onChange={set('memorialDescritivoRetificacao')} placeholder="Descrição do levantamento topográfico com as novas medidas…" />

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontFamily: '"Montserrat", sans-serif', fontWeight: 600, fontSize: 10.5, color: C.label, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 8 }}>
                    A área medida é superior ou inferior à registrada?
                  </label>
                  <Segmented accent={accent} value={form.superiorOuInferior} onChange={set('superiorOuInferior')}
                    options={[{ value: 'superior', label: 'Superior' }, { value: 'inferior', label: 'Inferior' }]} />
                </div>
              </Section>
            </div>
          )}

          {tab === 'docs' && (
            <div style={{ animation: 'fadeUp 0.25s ease both' }}>
              <Section icon="doc" title="Dados para outros documentos" desc="Campos usados conforme o documento a gerar" accent={accent}>
                <Field label="Número de lotes" icon="hash" value={form.totalLotes} onChange={(v) => set('totalLotes')(v.replace(/\D/g, ''))} placeholder="Para Consulta Prévia (PMSBS)" />
                <div />
                <Field label="Averbações" icon="doc" span={2} textarea rows={3} value={form.averbacoes} onChange={set('averbacoes')} placeholder="Averbações a registrar…" />
                <Field label="Quantidade de áreas do desmembramento" icon="hash"
                  value={desmembramento.areas.length ? String(desmembramento.areas.length) : ''}
                  onChange={alterarQuantidadeAreas} placeholder="Ex.: 2 (sem contar a remanescente)" />
                <Field label="Área remanescente" icon="ruler" value={desmembramento.remanescente}
                  onChange={(v) => setDesmembramento((d) => ({ ...d, remanescente: formatarArea(v) }))}
                  placeholder="0,00 m²" hint={sobraCalculada} />
                {desmembramento.areas.map((area, i) => (
                  <Field key={i} label={`Área ${doisDigitos(i + 1)}`} icon="ruler" value={area}
                    onChange={(v) => setDesmembramento((d) => ({ ...d, areas: d.areas.map((a, j) => (j === i ? formatarArea(v) : a)) }))}
                    placeholder="0,00 m²" />
                ))}
                {desmembramento.areas.length % 2 === 1 && <div />}
                {desmembramento.textoAntigo && (
                  <p style={{ gridColumn: '1 / -1', margin: 0, fontFamily: '"Open Sans", sans-serif', fontSize: 12, color: C.muted }}>
                    Texto digitado antes (vai para o documento até você preencher as áreas acima): <em>{desmembramento.textoAntigo}</em>
                  </p>
                )}

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontFamily: '"Montserrat", sans-serif', fontWeight: 600, fontSize: 10.5, color: C.label, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 8 }}>
                    Lista do protocolo de entrega — marque os documentos que compõem o protocolo
                  </label>
                  <CheckboxList accent={accent} span={2}
                    options={templates.map((t) => ({ value: t.chave, label: t.nome }))}
                    values={protocoloSelecionado} onChange={handleProtocoloChange} />
                </div>
              </Section>
            </div>
          )}

          <Actions editing accent={accent} saving={salvando} onSave={handleSalvar} saveLabel={salvando ? 'Salvando…' : 'Salvar vinculação'} />

          <p style={{ margin: '14px 0 0', fontFamily: '"Open Sans", sans-serif', fontSize: 12.5, color: C.muted }}>
            Para gerar os documentos deste serviço, salve a vinculação e use SIS DOC › Gerar documentos.
          </p>

        </div>
      )}

      {alvoModalPessoa && (
        <CadastroClienteView
          modal
          onBack={() => setAlvoModalPessoa(null)}
          onSaved={(novaPessoa) => {
            setClientes((atuais) => [novaPessoa, ...atuais]);
            if (alvoModalPessoa === 'proprietario') {
              set('proprietarioIds')([...form.proprietarioIds, novaPessoa.id]);
            } else {
              set('procuradorId')(novaPessoa.id);
            }
            setAlvoModalPessoa(null);
          }}
        />
      )}

      {modalImovelAberto && (
        <CadastroImovelView
          modal
          onBack={() => setModalImovelAberto(false)}
          onSaved={(novoImovel) => {
            setImoveis((atuais) => [novoImovel, ...atuais]);
            set('confrontanteIds')([...form.confrontanteIds, novoImovel.id]);
            setModalImovelAberto(false);
          }}
        />
      )}
    </Shell>
  );
}
