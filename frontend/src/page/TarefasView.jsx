import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { tarefaService } from '../services/tarefaService';
import { servicoService } from '../services/servicoService';
import {
  Actions, ConfirmModal, Field, Icon, MONT, SANS, SearchableSelect, SelectField, Section, Shell, Toast, useToast, C,
} from '../components/cadastros/CadastroKit.jsx';

async function copiarParaAreaDeTransferencia(texto) {
  if (!texto) return false;
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(texto);
      return true;
    }
  } catch (e) {
    console.warn('Clipboard API falhou, tentando fallback:', e);
  }
  try {
    const textarea = document.createElement('textarea');
    textarea.value = texto;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const copiado = document.execCommand('copy');
    document.body.removeChild(textarea);
    return copiado;
  } catch (err) {
    console.error('Fallback execCommand falhou:', err);
    return false;
  }
}

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
  acoes: 140,
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

// Modal pra registrar o que falta antes de pausar a tarefa — mesmo visual do
// ConfirmModal (CadastroKit), mas com um campo de texto no lugar da mensagem
// fixa, já que aqui o motivo é o que dá sentido ao aguardo na tabela.
function ModalAguardo({ onConfirm, onCancel, salvando }) {
  const [motivo, setMotivo] = useState('');

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(14,37,73,0.45)', zIndex: 400,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }} onClick={onCancel}>
      <div style={{
        background: '#fff', borderRadius: 18, width: 420, maxWidth: '100%', padding: '28px 26px',
        boxShadow: '0 20px 60px rgba(14,37,73,0.25)', animation: 'fadeUp 0.22s ease both', textAlign: 'center',
      }} onClick={(e) => e.stopPropagation()}>
        <div style={{
          width: 52, height: 52, borderRadius: '50%', margin: '0 auto 16px',
          background: '#f59e0b15', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon name="clock" size={26} />
        </div>
        <h3 style={{ fontFamily: MONT, fontWeight: 700, fontSize: 16, color: C.text, margin: '0 0 8px' }}>Colocar tarefa em aguardo</h3>
        <p style={{ fontFamily: SANS, fontSize: 13.5, color: C.muted, margin: '0 0 16px', lineHeight: 1.5 }}>
          O que falta para concluir essa tarefa? (opcional)
        </p>
        <textarea
          rows={3}
          autoFocus
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          placeholder="Ex: Aguardando documento do cliente"
          style={{
            width: '100%', padding: '10px 12px', borderRadius: 10, border: `1.5px solid ${C.border}`,
            fontSize: 13, outline: 'none', color: C.text, fontFamily: 'inherit', resize: 'vertical',
            boxSizing: 'border-box', textAlign: 'left',
          }}
        />
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 20 }}>
          <button onClick={onCancel} style={{
            padding: '11px 22px', borderRadius: 11, border: `1.5px solid ${C.border}`, background: '#fff',
            color: C.label, fontFamily: MONT, fontWeight: 700, fontSize: 13, cursor: 'pointer',
          }}>Cancelar</button>
          <button onClick={() => onConfirm(motivo)} disabled={salvando} style={{
            padding: '11px 22px', borderRadius: 11, border: 'none', background: '#f59e0b',
            color: '#fff', fontFamily: MONT, fontWeight: 700, fontSize: 13, cursor: salvando ? 'default' : 'pointer',
            opacity: salvando ? 0.7 : 1, boxShadow: '0 8px 20px #f59e0b44',
          }}>{salvando ? 'Salvando…' : 'Colocar em aguardo'}</button>
        </div>
      </div>
    </div>
  );
}

// Largura fixa (tableLayout: fixed) + quebra de texto no título/descrição
function TabelaTarefas({ tarefas, aba, accent, processando, onConcluir, onReabrir, onAguardar, onRetomar, onExcluir, onAbrirPasta, onSalvarObservacao, onReordenar }) {
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
    <DragDropContext onDragEnd={onReordenar}>
      <div style={{ background: '#fff', borderRadius: 14, border: `1px solid ${C.borderSoft}`, overflowX: 'auto' }}>
        <table style={{ width: totalWidth, minWidth: '100%', tableLayout: 'fixed', borderCollapse: 'collapse', fontFamily: '"Open Sans", sans-serif', fontSize: 13 }}>
          <colgroup>
            <col style={{ width: 32 }} />
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
              <th style={{ width: 32 }} />
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
              {renderHeader('prazo', aba === 'pendentes' ? 'Prazo' : aba === 'aguardo' ? 'Motivo do Aguardo' : 'Concluída')}
              {renderHeader('observacoes', 'Observações')}
              <th style={{ padding: '10px 14px', width: colWidths.acoes }} />
            </tr>
          </thead>

          <Droppable droppableId="tarefas">
            {(provided) => (
              <tbody ref={provided.innerRef} {...provided.droppableProps}>
                {tarefas.map((t, index) => {
                  const pastaDestino = t.linkPasta || t.servico?.caminhoPasta;
                  return (
                    <Draggable key={t.id} draggableId={String(t.id)} index={index}>
                      {(provided, snapshot) => {
                        const row = (
                          <tr
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            style={{
                              borderTop: `1px solid ${C.borderSoft}`,
                              cursor: 'grab',
                              display: snapshot.isDragging ? 'table' : undefined,
                              background: snapshot.isDragging ? '#fff' : undefined,
                              boxShadow: snapshot.isDragging ? '0 6px 24px rgba(0,0,0,0.13)' : undefined,
                              borderRadius: snapshot.isDragging ? 10 : undefined,
                              ...provided.draggableProps.style,
                            }}
                          >
                            <td
                              title="Arraste para reordenar"
                              style={{ padding: '12px 6px', textAlign: 'center', color: C.muted, fontSize: 14, userSelect: 'none', width: 32 }}
                            >
                              {'||'}
                            </td>
                            <td style={{ padding: '12px 6px 12px 12px', textAlign: 'center', width: colWidths.pasta }}>
                              {pastaDestino ? (
                                <button
                                  type="button"
                                  onClick={() => onAbrirPasta(pastaDestino)}
                                  title={`Abrir pasta: ${pastaDestino}`}
                                  style={{
                                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                    width: 28, height: 28, borderRadius: 8,
                                    border: `1.5px solid ${accent}44`, background: `${accent}12`,
                                    color: accent, cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s ease',
                                  }}
                                >
                                  <Icon name="folder" size={15} />
                                </button>
                              ) : null}
                            </td>
                            <td style={{ padding: '12px 14px', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                              <div style={{ fontWeight: 700, color: C.text, fontSize: 13.5, lineHeight: 1.3 }}>{t.titulo}</div>
                            </td>
                            <td style={{ padding: '12px 14px' }}>
                              <CelulaDescricao descricao={t.descricao} />
                            </td>
                            <td style={{ padding: '12px 14px' }}><BadgePrioridade prioridade={t.prioridade} /></td>
                            <td style={{ padding: '12px 14px', color: C.muted, wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                              {t.servico ? `${t.servico.numeroServico} \u2014 ${t.servico.nomeCliente}` : '\u2014'}
                            </td>
                            <td style={{ padding: '12px 14px', color: C.muted, wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                              {aba === 'pendentes' ? (
                                t.prazo ? new Date(t.prazo).toLocaleDateString('pt-BR') : '\u2014'
                              ) : aba === 'aguardo' ? (
                                <CelulaDescricao descricao={t.motivoAguardo} />
                              ) : (
                                t.concluido_em ? `${t.concluidoPor || '\u2014'} em ${new Date(t.concluido_em).toLocaleDateString('pt-BR')}` : '\u2014'
                              )}
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
                                {aba === 'pendentes' && (
                                  <button type="button" onClick={() => onAguardar(t.id)} disabled={processando === t.id} title="Colocar em aguardo"
                                    style={{ width: 32, height: 32, borderRadius: 8, border: '1.5px solid #f59e0b44', background: '#fff', color: '#f59e0b', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: processando === t.id ? 'default' : 'pointer', opacity: processando === t.id ? 0.6 : 1, transition: 'all 0.15s ease' }}>
                                    <Icon name="clock" size={15} />
                                  </button>
                                )}
                                {aba === 'aguardo' && (
                                  <button type="button" onClick={() => onRetomar(t.id)} disabled={processando === t.id} title="Retomar tarefa"
                                    style={{ width: 32, height: 32, borderRadius: 8, border: `1.5px solid ${accent}`, background: '#fff', color: accent, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: processando === t.id ? 'default' : 'pointer', opacity: processando === t.id ? 0.6 : 1, transition: 'all 0.15s ease' }}>
                                    <Icon name="hash" size={15} />
                                  </button>
                                )}
                                {(aba === 'pendentes' || aba === 'aguardo') && (
                                  <button type="button" onClick={() => onConcluir(t.id)} disabled={processando === t.id} title="Concluir tarefa"
                                    style={{ width: 32, height: 32, borderRadius: 8, border: `1.5px solid ${C.green}44`, background: '#fff', color: C.green, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: processando === t.id ? 'default' : 'pointer', opacity: processando === t.id ? 0.6 : 1, transition: 'all 0.15s ease' }}>
                                    <Icon name="check" size={16} />
                                  </button>
                                )}
                                {aba === 'concluidas' && (
                                  <button type="button" onClick={() => onReabrir(t.id)} disabled={processando === t.id} title="Reabrir tarefa"
                                    style={{ width: 32, height: 32, borderRadius: 8, border: `1.5px solid ${accent}`, background: '#fff', color: accent, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: processando === t.id ? 'default' : 'pointer', opacity: processando === t.id ? 0.6 : 1, transition: 'all 0.15s ease' }}>
                                    <Icon name="hash" size={15} />
                                  </button>
                                )}
                                <button type="button" onClick={() => onExcluir(t.id)} disabled={processando === t.id} title="Excluir tarefa"
                                  style={{ width: 32, height: 32, borderRadius: 8, border: `1.5px solid ${C.danger}33`, background: '#fff', color: C.danger, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: processando === t.id ? 'default' : 'pointer', opacity: processando === t.id ? 0.6 : 1, transition: 'all 0.15s ease' }}>
                                  <Icon name="trash" size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );

                        return snapshot.isDragging
                          ? ReactDOM.createPortal(row, document.body)
                          : row;
                      }}
                    </Draggable>
                  );
                })}
                {provided.placeholder}
                {tarefas.length === 0 && (
                  <tr>
                    <td colSpan={9} style={{ padding: '20px 14px', textAlign: 'center', color: C.muted }}>
                      {aba === 'pendentes' ? 'Nenhuma tarefa pendente.' : aba === 'aguardo' ? 'Nenhuma tarefa em aguardo.' : 'Nenhuma tarefa concluída ainda.'}
                    </td>
                  </tr>
                )}
              </tbody>
            )}
          </Droppable>

        </table>
      </div>
    </DragDropContext>
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
  const [aba, setAba] = useState('pendentes'); // 'pendentes' | 'aguardo' | 'concluidas'
  const [tarefas, setTarefas] = useState([]);
  const [tarefaParaExcluir, setTarefaParaExcluir] = useState(null);
  const [tarefaParaAguardar, setTarefaParaAguardar] = useState(null);
  const reorderingRef = useRef(false); // bloqueia o interval durante/após reordenamento

  useEffect(() => {
    servicoService.listarTodos()
      .then((lista) => { if (Array.isArray(lista)) setServicos(lista); })
      .catch((erro) => console.error('Erro ao carregar serviços:', erro));
  }, []);

  const carregarTarefas = async () => {
    if (reorderingRef.current) return; // não sobrescreve se acabou de reordenar
    try {
      const statusPorAba = { pendentes: 'PENDENTE', aguardo: 'AGUARDO', concluidas: 'CONCLUIDA' };
      const filtros = { status: statusPorAba[aba] };
      if (setorFiltro !== 'TODOS') {
        filtros.setor = setorFiltro;
      }
      const lista = await tarefaService.listar(filtros);
      if (Array.isArray(lista)) {
        const ordenadas = [...lista].sort((a, b) => a.ordem - b.ordem);
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

  const confirmarAguardo = async (motivo) => {
    const id = tarefaParaAguardar;
    if (!id) return;
    setProcessando(id);
    try {
      const { data, ok } = await tarefaService.colocarEmAguardo(id, motivo);
      show(ok ? 'Tarefa em aguardo.' : (data?.error || 'Erro ao colocar em aguardo.'), ok ? 'ok' : 'err');
      carregarTarefas();
    } catch (erro) {
      console.error(erro);
      show('Erro ao conectar com o servidor.', 'err');
    } finally {
      setProcessando(null);
      setTarefaParaAguardar(null);
    }
  };

  const retomarTarefa = async (id) => {
    setProcessando(id);
    try {
      const { data, ok } = await tarefaService.retomar(id);
      show(ok ? 'Tarefa retomada.' : (data?.error || 'Erro ao retomar.'), ok ? 'ok' : 'err');
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

  const handleReordenar = async (result) => {
    if (!result.destination) return;
    if (result.source.index === result.destination.index) return;

    const novaOrdem = [...tarefas];
    const [removida] = novaOrdem.splice(result.source.index, 1);
    novaOrdem.splice(result.destination.index, 0, removida);
    setTarefas(novaOrdem);

    reorderingRef.current = true; // pausa o interval
    const ids = novaOrdem.map(t => t.id);
    try {
      const res = await tarefaService.reordenar(ids);
      if (!res || !res.ok) {
        show(res?.data?.error || 'Não foi possível salvar a nova ordem.', 'err');
      }
    } catch (e) {
      console.error('Erro ao salvar ordem:', e);
      show('Não foi possível salvar a nova ordem.', 'err');
    } finally {
      // libera o interval 2s depois, tempo suficiente para o banco confirmar
      setTimeout(() => { reorderingRef.current = false; }, 2000);
    }
  };

  // Só copia o caminho: quem abre a pasta é o usuário, no Explorador da própria
  // máquina. Abrir pelo backend abriria a pasta no servidor, não no PC de quem
  // clicou — e o navegador bloqueia navegação file:// vinda de uma página http.
  const abrirPasta = async (caminho) => {
    if (!caminho) return;

    const copiado = await copiarParaAreaDeTransferencia(caminho);

    if (copiado) {
      show('Caminho copiado com sucesso! Pressione Win+E e cole no Explorador de Arquivos.', 'ok');
    } else {
      show(`Caminho da pasta: ${caminho}`, 'ok');
    }

    try {
      window.open(caminhoParaFileUrl(caminho), '_blank');
    } catch (e) {
      console.warn(e);
    }
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

            {/* Filtro de Status (Pendentes / Em Aguardo / Concluídas) */}
            <div style={{ display: 'flex', background: '#EAEAEA', borderRadius: 20, padding: 4, width: 'fit-content' }}>
              {[['pendentes', 'Pendentes'], ['aguardo', 'Em Aguardo'], ['concluidas', 'Concluídas']].map(([valor, rotulo]) => (
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
            onAguardar={setTarefaParaAguardar}
            onRetomar={retomarTarefa}
            onExcluir={setTarefaParaExcluir}
            onAbrirPasta={abrirPasta}
            onSalvarObservacao={salvarObservacao}
            onReordenar={handleReordenar}
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

      {tarefaParaAguardar && (
        <ModalAguardo
          salvando={processando === tarefaParaAguardar}
          onConfirm={confirmarAguardo}
          onCancel={() => setTarefaParaAguardar(null)}
        />
      )}
    </Shell>
  );
}
