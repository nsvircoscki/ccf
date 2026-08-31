import React, { useEffect, useState } from 'react';
import { tarefaService } from '../services/tarefaService';
import { servicoService } from '../services/servicoService';
import {
  Actions, ConfirmModal, Field, Icon, SearchableSelect, SelectField, Section, Shell, Toast, useToast, C,
} from '../components/cadastros/CadastroKit.jsx';

// Converte um caminho de pasta (rede \\SERVIDOR\Pasta ou local C:\Pasta) num
// link file:// — nem todo navegador deixa clicar e abrir direto (é uma
// restrição de segurança do próprio navegador, não bug daqui), por isso
// sempre copiamos o caminho também, como garantia de sempre funcionar.
function caminhoParaFileUrl(caminho) {
  const limpo = String(caminho || '').trim();
  if (!limpo) return '';
  if (/^https?:\/\//i.test(limpo)) return limpo;
  if (limpo.startsWith('\\\\')) return `file://${limpo.slice(2).replace(/\\/g, '/')}`;
  return `file:///${limpo.replace(/\\/g, '/')}`;
}

const SETORES = [
  { value: 'DES_1', label: 'Desenho - Usuário 1' },
  { value: 'DES_2', label: 'Desenho - Usuário 2' },
];

const PRIORIDADES = ['BAIXA', 'MEDIA', 'ALTA'];

const PESO_PRIORIDADE = { ALTA: 1, MEDIA: 2, BAIXA: 3 };
const CORES_PRIORIDADE = { BAIXA: '#16a34a', MEDIA: '#ea580c', ALTA: '#dc2626' };
const LABEL_PRIORIDADE = { BAIXA: 'Baixa', MEDIA: 'Média', ALTA: 'Alta' };

const LARGURAS_INICIAIS = {
  pasta: 44,
  tarefa: 220,
  descricao: 280,
  prioridade: 115,
  servico: 160,
  prazo: 120,
  observacoes: 180,
  acoes: 100,
};

const tarefaVazia = {
  titulo: '',
  descricao: '',
  setor: '',
  prioridade: '',
  servicoId: null,
  prazo: '',
  observacoes: '',
  linkPasta: '',
};

function BadgePrioridade({ prioridade }) {
  const cor = CORES_PRIORIDADE[prioridade] || C.muted;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 999,
      background: `${cor}15`, color: cor, fontFamily: '"Montserrat", sans-serif', fontWeight: 700,
      fontSize: 11, letterSpacing: '0.04em', textTransform: 'uppercase', whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: cor, flexShrink: 0 }} />
      {LABEL_PRIORIDADE[prioridade] || prioridade}
    </span>
  );
}

function CampoObservacao({ tarefaId, observacaoInicial, onSalvarObservacao }) {
  const [texto, setTexto] = useState(observacaoInicial || '');
  const [salvando, setSalvando] = useState(false);
  const [expandido, setExpandido] = useState(false);
  const [focado, setFocado] = useState(false);

  useEffect(() => {
    setTexto(observacaoInicial || '');
  }, [observacaoInicial]);

  const handleBlur = async () => {
    setFocado(false);
    if (texto === (observacaoInicial || '')) return;
    setSalvando(true);
    await onSalvarObservacao(tarefaId, texto);
    setSalvando(false);
  };

  const limite = 50;
  const precisaExpandir = texto.length > limite;

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {focado || expandido ? (
        <textarea
          rows={3}
          value={texto}
          autoFocus={focado}
          onChange={(e) => setTexto(e.target.value)}
          onFocus={() => setFocado(true)}
          onBlur={handleBlur}
          placeholder="Observação…"
          style={{
            width: '100%',
            padding: '8px 10px',
            borderRadius: 8,
            border: `1.5px solid ${focado ? '#2D7AFD' : 'rgba(15, 23, 42, 0.2)'}`,
            fontSize: 12,
            outline: 'none',
            color: '#1E293B',
            background: salvando ? '#F1F5F9' : '#fff',
            resize: 'vertical',
            fontFamily: 'inherit',
            boxSizing: 'border-box',
            boxShadow: focado ? '0 0 0 3px rgba(45,122,253,0.12)' : 'none',
            transition: 'all 0.15s ease',
          }}
        />
      ) : (
        <input
          type="text"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onFocus={() => setFocado(true)}
          onBlur={handleBlur}
          placeholder="Observação…"
          style={{
            width: '100%',
            padding: '6px 10px',
            borderRadius: 8,
            border: '1px solid rgba(15, 23, 42, 0.15)',
            fontSize: 12,
            outline: 'none',
            color: '#1E293B',
            background: salvando ? '#F1F5F9' : '#F8FAFC',
            boxSizing: 'border-box',
            transition: 'all 0.15s ease',
          }}
        />
      )}
      {precisaExpandir && !focado && (
        <button
          type="button"
          onClick={() => setExpandido((e) => !e)}
          style={{
            background: 'none',
            border: 'none',
            color: '#2D7AFD',
            cursor: 'pointer',
            fontSize: 11,
            fontWeight: 700,
            padding: 0,
            marginTop: 4,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 2,
          }}
        >
          {expandido ? 'Recolher' : 'Ver mais...'}
        </button>
      )}
    </div>
  );
}

function CelulaDescricao({ descricao }) {
  const [expandido, setExpandido] = useState(false);

  if (!descricao) {
    return <span style={{ color: C.muted }}>—</span>;
  }

  const limite = 60;
  const precisaExpandir = descricao.length > limite;
  const textoExibido = expandido || !precisaExpandir ? descricao : `${descricao.slice(0, limite)}...`;

  return (
    <div style={{ color: '#475569', fontSize: 12, lineHeight: 1.4, wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
      <div style={{ whiteSpace: expandido ? 'pre-wrap' : 'normal' }}>
        {textoExibido}
      </div>
      {precisaExpandir && (
        <button
          type="button"
          onClick={() => setExpandido((e) => !e)}
          style={{
            background: 'none',
            border: 'none',
            color: '#2D7AFD',
            cursor: 'pointer',
            fontSize: 11,
            fontWeight: 700,
            padding: 0,
            marginTop: 4,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 2,
          }}
        >
          {expandido ? 'Ver menos' : 'Ver mais...'}
        </button>
      )}
    </div>
  );
}

// Largura fixa (tableLayout: fixed) + quebra de texto no título/descrição
function TabelaTarefas({ tarefas, aba, accent, processando, onConcluir, onReabrir, onExcluir, onAbrirPasta, onSalvarObservacao }) {
  const [colWidths, setColWidths] = useState(LARGURAS_INICIAIS);

  const resetarLargura = (colKey) => {
    if (colKey) {
      setColWidths((prev) => ({ ...prev, [colKey]: LARGURAS_INICIAIS[colKey] }));
    } else {
      setColWidths(LARGURAS_INICIAIS);
    }
  };

  const iniciarRedimensionamento = (colKey, e) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = colWidths[colKey];

    const onMouseMove = (moveEvent) => {
      const minWidth = colKey === 'pasta' ? 36 : 60;
      const newWidth = Math.max(minWidth, startWidth + (moveEvent.clientX - startX));
      setColWidths((prev) => ({ ...prev, [colKey]: newWidth }));
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const renderHeader = (colKey, label) => (
    <th
      onDoubleClick={() => resetarLargura(colKey)}
      title="Arraste a divisória para redimensionar | Clique duplo para restaurar tamanho padrão"
      style={{
        padding: '10px 14px',
        position: 'relative',
        userSelect: 'none',
        width: colWidths[colKey],
        borderRight: '1px solid rgba(226, 232, 240, 0.8)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>{label}</span>
      </div>
      <div
        onMouseDown={(e) => iniciarRedimensionamento(colKey, e)}
        onDoubleClick={(e) => { e.stopPropagation(); resetarLargura(colKey); }}
        title="Arraste para redimensionar | Clique duplo para restaurar tamanho padrão"
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          width: 9,
          cursor: 'col-resize',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10,
          transition: 'background 0.15s ease',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(45, 122, 253, 0.2)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
      >
        <div style={{ width: 2, height: 14, background: '#94A3B8', borderRadius: 1 }} />
      </div>
    </th>
  );

  const totalWidth = Object.values(colWidths).reduce((a, b) => a + b, 0);

  return (
    <div style={{ background: '#fff', borderRadius: 14, border: `1px solid ${C.borderSoft}`, overflowX: 'auto' }}>
      <table style={{ width: totalWidth, minWidth: '100%', tableLayout: 'fixed', borderCollapse: 'collapse', fontFamily: '"Open Sans", sans-serif', fontSize: 13 }}>
        <colgroup>
          <col style={{ width: colWidths.pasta }} />
          <col style={{ width: colWidths.tarefa }} />
          <col style={{ width: colWidths.descricao }} />
          <col style={{ width: colWidths.prioridade }} />
          <col style={{ width: colWidths.servico }} />
          <col style={{ width: colWidths.prazo }} />
          <col style={{ width: colWidths.observacoes }} />
          <col style={{ width: colWidths.acoes }} />
        </colgroup>
        <thead>
          <tr style={{ textAlign: 'left', color: C.muted, fontSize: 11, textTransform: 'uppercase', background: C.bg }}>
            <th style={{ padding: '10px 8px', width: colWidths.pasta, position: 'relative', borderRight: '1px solid rgba(226, 232, 240, 0.8)' }}>
              <div
                onMouseDown={(e) => iniciarRedimensionamento('pasta', e)}
                onDoubleClick={() => resetarLargura('pasta')}
                title="Arraste para redimensionar | Clique duplo para restaurar"
                style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 9, cursor: 'col-resize', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(45, 122, 253, 0.2)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                <div style={{ width: 2, height: 14, background: '#94A3B8', borderRadius: 1 }} />
              </div>
            </th>
            {renderHeader('tarefa', 'Tarefa')}
            {renderHeader('descricao', 'Descrição')}
            {renderHeader('prioridade', 'Prioridade')}
            {renderHeader('servico', 'Serviço')}
            {renderHeader('prazo', aba === 'pendentes' ? 'Prazo' : 'Concluída')}
            {renderHeader('observacoes', 'Observações')}
            <th style={{ padding: '10px 14px', width: colWidths.acoes }}></th>
          </tr>
        </thead>
        <tbody>
          {tarefas.map((t) => {
            const pastaDestino = t.linkPasta || t.servico?.caminhoPasta;
            return (
              <tr key={t.id} style={{ borderTop: `1px solid ${C.borderSoft}` }}>
                <td style={{ padding: '12px 6px 12px 12px', textAlign: 'center', width: colWidths.pasta }}>
                  {pastaDestino ? (
                    <button
                      type="button"
                      onClick={() => onAbrirPasta(pastaDestino)}
                      title={`Abrir pasta: ${pastaDestino}`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 28,
                        height: 28,
                        borderRadius: 8,
                        border: `1.5px solid ${accent}44`,
                        background: `${accent}12`,
                        color: accent,
                        cursor: 'pointer',
                        flexShrink: 0,
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <Icon name="folder" size={15} />
                    </button>
                  ) : null}
                </td>
                <td style={{ padding: '12px 14px', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                  <div style={{ fontWeight: 700, color: C.text, fontSize: 13.5, lineHeight: 1.3 }}>
                    {t.titulo}
                  </div>
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <CelulaDescricao descricao={t.descricao} />
                </td>
                <td style={{ padding: '12px 14px' }}><BadgePrioridade prioridade={t.prioridade} /></td>
                <td style={{ padding: '12px 14px', color: C.muted, wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                  {t.servico ? `${t.servico.numeroServico} — ${t.servico.nomeCliente}` : '—'}
                </td>
                <td style={{ padding: '12px 14px', color: C.muted, wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                  {aba === 'pendentes'
                    ? (t.prazo ? new Date(t.prazo).toLocaleDateString('pt-BR') : '—')
                    : (t.concluido_em ? `${t.concluidoPor || '—'} em ${new Date(t.concluido_em).toLocaleDateString('pt-BR')}` : '—')}
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <CampoObservacao
                    tarefaId={t.id}
                    observacaoInicial={t.observacoes}
                    onSalvarObservacao={onSalvarObservacao}
                  />
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                    {aba === 'pendentes' ? (
                      <button
                        type="button"
                        onClick={() => onConcluir(t.id)}
                        disabled={processando === t.id}
                        title="Concluir tarefa"
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          border: `1.5px solid ${C.green}44`,
                          background: '#fff',
                          color: C.green,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: processando === t.id ? 'default' : 'pointer',
                          opacity: processando === t.id ? 0.6 : 1,
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <Icon name="check" size={16} />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onReabrir(t.id)}
                        disabled={processando === t.id}
                        title="Reabrir tarefa"
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          border: `1.5px solid ${accent}`,
                          background: '#fff',
                          color: accent,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: processando === t.id ? 'default' : 'pointer',
                          opacity: processando === t.id ? 0.6 : 1,
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <Icon name="hash" size={15} />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onExcluir(t.id)}
                      disabled={processando === t.id}
                      title="Excluir tarefa"
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        border: `1.5px solid ${C.danger}33`,
                        background: '#fff',
                        color: C.danger,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: processando === t.id ? 'default' : 'pointer',
                        opacity: processando === t.id ? 0.6 : 1,
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <Icon name="trash" size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
          {tarefas.length === 0 && (
            <tr>
              <td colSpan={8} style={{ padding: '20px 14px', textAlign: 'center', color: C.muted }}>
                {aba === 'pendentes' ? 'Nenhuma tarefa pendente.' : 'Nenhuma tarefa concluída ainda.'}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default function TarefasView({ onBack, usuarioLogado }) {
  const accent = C.accent;
  const { toast, show } = useToast();

  const [servicos, setServicos] = useState([]);
  const [form, setForm] = useState(tarefaVazia);
  const [salvando, setSalvando] = useState(false);
  const [processando, setProcessando] = useState(null);

  const [secao, setSecao] = useState('cadastro'); // 'cadastro' | 'tabelas'
  const [setorFiltro, setSetorFiltro] = useState('DES_1'); // 'DES_1' | 'DES_2' | 'TODOS'
  const [aba, setAba] = useState('pendentes'); // 'pendentes' | 'concluidas'
  const [tarefas, setTarefas] = useState([]);
  const [tarefaParaExcluir, setTarefaParaExcluir] = useState(null);

  useEffect(() => {
    servicoService.listarTodos()
      .then((lista) => { if (Array.isArray(lista)) setServicos(lista); })
      .catch((erro) => console.error('Erro ao carregar serviços:', erro));
  }, []);

  const carregarTarefas = async () => {
    try {
      const filtros = { status: aba === 'pendentes' ? 'PENDENTE' : 'CONCLUIDA' };
      if (setorFiltro !== 'TODOS') {
        filtros.setor = setorFiltro;
      }
      const lista = await tarefaService.listar(filtros);
      if (Array.isArray(lista)) {
        const ordenadas = [...lista].sort((a, b) => {
          const pesoA = PESO_PRIORIDADE[a.prioridade] || 99;
          const pesoB = PESO_PRIORIDADE[b.prioridade] || 99;
          if (pesoA !== pesoB) return pesoA - pesoB;
          return new Date(b.created_at || 0) - new Date(a.created_at || 0);
        });
        setTarefas(ordenadas);
      }
    } catch (erro) {
      console.error('Erro ao carregar tarefas:', erro);
    }
  };

  useEffect(() => {
    carregarTarefas();
    const interval = setInterval(carregarTarefas, 5000);
    return () => clearInterval(interval);
  }, [aba, setorFiltro]);

  const opcoesServicos = servicos.map((s) => ({ value: s.id, label: s.numeroServico, sub: s.nomeCliente }));
  const setCampo = (campo) => (valor) => setForm((atual) => ({ ...atual, [campo]: valor }));

  const salvarTarefa = async () => {
    if (!form.titulo.trim()) { show('Informe um título pra tarefa.', 'err'); return; }
    if (!form.setor) { show('Selecione o Desenho (Responsável).', 'err'); return; }
    if (!form.prioridade) { show('Selecione a prioridade.', 'err'); return; }
    setSalvando(true);
    try {
      const { data, ok } = await tarefaService.criar({ ...form, criadoPor: usuarioLogado });
      if (!ok) { show(data?.error || 'Erro ao lançar tarefa.', 'err'); return; }
      show('Tarefa lançada com sucesso.', 'ok');
      setForm(tarefaVazia);
      if (data) {
        setTarefas((prev) => [data, ...prev.filter((t) => t.id !== data.id)]);
      }
      carregarTarefas();
    } catch (erro) {
      console.error(erro);
      show('Erro ao conectar com o servidor.', 'err');
    } finally {
      setSalvando(false);
    }
  };

  const salvarObservacao = async (id, observacoes) => {
    try {
      const { ok } = await tarefaService.atualizarObservacao(id, observacoes);
      if (ok) {
        setTarefas((prev) => prev.map((t) => t.id === id ? { ...t, observacoes } : t));
        show('Observação salva.', 'ok');
      } else {
        show('Erro ao salvar observação.', 'err');
      }
    } catch (erro) {
      console.error(erro);
      show('Erro ao salvar observação.', 'err');
    }
  };

  const concluirTarefa = async (id) => {
    setProcessando(id);
    try {
      const { data, ok } = await tarefaService.concluir(id, usuarioLogado);
      show(ok ? 'Tarefa concluída!' : (data?.error || 'Erro ao concluir.'), ok ? 'ok' : 'err');
      carregarTarefas();
    } catch (erro) {
      console.error(erro);
      show('Erro ao conectar com o servidor.', 'err');
    } finally {
      setProcessando(null);
    }
  };

  const reabrirTarefa = async (id) => {
    setProcessando(id);
    try {
      const { data, ok } = await tarefaService.reabrir(id);
      show(ok ? 'Tarefa reaberta.' : (data?.error || 'Erro ao reabrir.'), ok ? 'ok' : 'err');
      carregarTarefas();
    } catch (erro) {
      console.error(erro);
      show('Erro ao conectar com o servidor.', 'err');
    } finally {
      setProcessando(null);
    }
  };

  const excluirTarefa = async (id) => {
    setProcessando(id);
    try {
      const { ok } = await tarefaService.excluir(id);
      show(ok ? 'Tarefa excluída.' : 'Erro ao excluir.', ok ? 'ok' : 'err');
      carregarTarefas();
    } catch (erro) {
      console.error(erro);
      show('Erro ao conectar com o servidor.', 'err');
    } finally {
      setProcessando(null);
      setTarefaParaExcluir(null);
    }
  };

  const abrirPasta = async (caminho) => {
    try {
      await navigator.clipboard.writeText(caminho);
      show('Caminho copiado! Cole no Explorador de Arquivos (Win+E) se a pasta não abrir sozinha.', 'ok');
    } catch (erro) {
      console.error('Não deu pra copiar o caminho:', erro);
    }
    window.open(caminhoParaFileUrl(caminho), '_blank');
  };

  return (
    <Shell user={usuarioLogado} title="Tarefas" subtitle="Planilha de atividades do Desenho" onBack={onBack} accent={accent} wide={secao === 'tabelas'}>
      {toast && <Toast msg={toast.msg} kind={toast.kind} />}

      <div style={{ display: 'flex', background: '#EAEAEA', borderRadius: 20, padding: 4, width: 'fit-content', marginBottom: 22 }}>
        {[['cadastro', 'Cadastrar Tarefa'], ['tabelas', 'Tabelas']].map(([valor, rotulo]) => (
          <button key={valor} type="button" onClick={() => setSecao(valor)} style={{
            padding: '8px 18px', borderRadius: 16, border: 'none', cursor: 'pointer',
            fontFamily: '"Montserrat", sans-serif', fontWeight: 700, fontSize: 13,
            background: secao === valor ? accent : 'transparent', color: secao === valor ? '#fff' : '#787373',
            transition: 'all 0.15s ease',
          }}>
            {rotulo}
          </button>
        ))}
      </div>

      {secao === 'cadastro' && (
        <>
          <Section icon="ring" title="Nova tarefa para o Desenho" desc="Selecione o Usuário do Desenho responsável" accent={accent}>
            <Field label="Título" icon="doc" span={2} value={form.titulo} onChange={setCampo('titulo')} placeholder="Ex: Ligar pro cliente sobre o boleto" />
            <Field label="Descrição" span={2} textarea value={form.descricao} onChange={setCampo('descricao')} placeholder="Detalhes adicionais (opcional)" />
            <SelectField label="Desenho (Responsável)" icon="user" value={form.setor} onChange={setCampo('setor')} options={SETORES} />
            <SelectField label="Prioridade" icon="scale" value={form.prioridade} onChange={setCampo('prioridade')} options={PRIORIDADES.map((p) => ({ value: p, label: LABEL_PRIORIDADE[p] }))} />
            <Field label="Prazo (opcional)" icon="calendar" type="date" value={form.prazo} onChange={setCampo('prazo')} />
            <Field label="Observações iniciais (opcional)" icon="doc" value={form.observacoes} onChange={setCampo('observacoes')} placeholder="Observações da tarefa" />
            <Field label="Link da pasta (opcional)" icon="folder" span={2} value={form.linkPasta} onChange={setCampo('linkPasta')} placeholder="Ex: \\SERVIDOR\Servicos\2026-123" />
            <SearchableSelect
              label="Serviço vinculado (opcional)" icon="folder" span={2} accent={accent}
              options={opcoesServicos} value={form.servicoId} onChange={setCampo('servicoId')}
              placeholder="Buscar serviço…"
            />
          </Section>

          <Actions accent={accent} saving={salvando} onSave={salvarTarefa} saveLabel={salvando ? 'Lançando…' : 'Lançar tarefa'} />
        </>
      )}

      {secao === 'tabelas' && (
        <>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            {/* Filtro de Usuários do Desenho */}
            <div style={{ display: 'flex', background: '#EAEAEA', borderRadius: 20, padding: 4, width: 'fit-content' }}>
              {[
                ['DES_1', 'Desenho - Usuário 1'],
                ['DES_2', 'Desenho - Usuário 2'],
                ['TODOS', 'Todos do Desenho'],
              ].map(([valor, rotulo]) => (
                <button key={valor} type="button" onClick={() => setSetorFiltro(valor)} style={{
                  padding: '8px 16px', borderRadius: 16, border: 'none', cursor: 'pointer',
                  fontFamily: '"Montserrat", sans-serif', fontWeight: 700, fontSize: 12.5,
                  background: setorFiltro === valor ? accent : 'transparent', color: setorFiltro === valor ? '#fff' : '#787373',
                  transition: 'all 0.15s ease',
                }}>
                  {rotulo}
                </button>
              ))}
            </div>

            {/* Filtro de Status (Pendentes / Concluídas) */}
            <div style={{ display: 'flex', background: '#EAEAEA', borderRadius: 20, padding: 4, width: 'fit-content' }}>
              {[['pendentes', 'Pendentes'], ['concluidas', 'Concluídas']].map(([valor, rotulo]) => (
                <button key={valor} type="button" onClick={() => setAba(valor)} style={{
                  padding: '8px 18px', borderRadius: 16, border: 'none', cursor: 'pointer',
                  fontFamily: '"Montserrat", sans-serif', fontWeight: 700, fontSize: 12.5,
                  background: aba === valor ? accent : 'transparent', color: aba === valor ? '#fff' : '#787373',
                  transition: 'all 0.15s ease',
                }}>
                  {rotulo}
                </button>
              ))}
            </div>
          </div>

          <TabelaTarefas
            tarefas={tarefas}
            aba={aba}
            accent={accent}
            processando={processando}
            onConcluir={concluirTarefa}
            onReabrir={reabrirTarefa}
            onExcluir={setTarefaParaExcluir}
            onAbrirPasta={abrirPasta}
            onSalvarObservacao={salvarObservacao}
          />
        </>
      )}

      {tarefaParaExcluir && (
        <ConfirmModal
          title="Excluir essa tarefa?"
          message="Essa ação não pode ser desfeita."
          confirmLabel="Excluir"
          onConfirm={() => excluirTarefa(tarefaParaExcluir)}
          onCancel={() => setTarefaParaExcluir(null)}
        />
      )}
    </Shell>
  );
}
