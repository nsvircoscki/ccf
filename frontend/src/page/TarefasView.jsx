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

const CORES_PRIORIDADE = { BAIXA: '#64748b', MEDIA: '#b45309', ALTA: '#be123c' };
const LABEL_PRIORIDADE = { BAIXA: 'Baixa', MEDIA: 'Média', ALTA: 'Alta' };

const tarefaVazia = {
  titulo: '',
  descricao: '',
  setor: 'DES_1',
  prioridade: 'MEDIA',
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

  useEffect(() => {
    setTexto(observacaoInicial || '');
  }, [observacaoInicial]);

  const handleBlur = async () => {
    if (texto === (observacaoInicial || '')) return;
    setSalvando(true);
    await onSalvarObservacao(tarefaId, texto);
    setSalvando(false);
  };

  return (
    <input
      type="text"
      value={texto}
      onChange={(e) => setTexto(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
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
        transition: 'all 0.15s ease',
      }}
    />
  );
}

// Largura fixa (tableLayout: fixed) + quebra de texto no título/descrição
function TabelaTarefas({ tarefas, aba, accent, processando, onConcluir, onReabrir, onExcluir, onAbrirPasta, onSalvarObservacao }) {
  return (
    <div style={{ background: '#fff', borderRadius: 14, border: `1px solid ${C.borderSoft}`, overflow: 'hidden' }}>
      <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse', fontFamily: '"Open Sans", sans-serif', fontSize: 13 }}>
        <colgroup>
          <col style={{ width: 'auto' }} />
          <col style={{ width: 100 }} />
          <col style={{ width: 150 }} />
          <col style={{ width: 110 }} />
          <col style={{ width: 180 }} />
          <col style={{ width: 170 }} />
        </colgroup>
        <thead>
          <tr style={{ textAlign: 'left', color: C.muted, fontSize: 11, textTransform: 'uppercase', background: C.bg }}>
            <th style={{ padding: '10px 14px' }}>Tarefa</th>
            <th style={{ padding: '10px 14px' }}>Prioridade</th>
            <th style={{ padding: '10px 14px' }}>Serviço</th>
            <th style={{ padding: '10px 14px' }}>{aba === 'pendentes' ? 'Prazo' : 'Concluída'}</th>
            <th style={{ padding: '10px 14px' }}>Observações</th>
            <th style={{ padding: '10px 14px' }}></th>
          </tr>
        </thead>
        <tbody>
          {tarefas.map((t) => (
            <tr key={t.id} style={{ borderTop: `1px solid ${C.borderSoft}` }}>
              <td style={{ padding: '12px 14px', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                <div style={{ fontWeight: 700, color: C.text }}>{t.titulo}</div>
                {t.descricao && <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{t.descricao}</div>}
                {t.linkPasta && (
                  <button onClick={() => onAbrirPasta(t.linkPasta)} title={t.linkPasta} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 6, padding: '3px 9px 3px 6px',
                    borderRadius: 999, border: `1px solid ${accent}33`, background: `${accent}0d`, color: accent,
                    fontFamily: '"Montserrat", sans-serif', fontWeight: 700, fontSize: 11, cursor: 'pointer',
                  }}>
                    <Icon name="folder" size={11} /> Abrir pasta
                  </button>
                )}
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
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 8 }}>
                  {aba === 'pendentes' ? (
                    <button onClick={() => onConcluir(t.id)} disabled={processando === t.id} style={{
                      padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
                      background: accent, color: '#fff', fontFamily: '"Montserrat", sans-serif',
                      fontWeight: 700, fontSize: 11.5, opacity: processando === t.id ? 0.6 : 1,
                    }}>
                      {processando === t.id ? 'Concluindo…' : 'Concluir'}
                    </button>
                  ) : (
                    <button onClick={() => onReabrir(t.id)} disabled={processando === t.id} style={{
                      padding: '6px 14px', borderRadius: 8, border: `1.5px solid ${accent}`, cursor: 'pointer', whiteSpace: 'nowrap',
                      background: '#fff', color: accent, fontFamily: '"Montserrat", sans-serif',
                      fontWeight: 700, fontSize: 11.5, opacity: processando === t.id ? 0.6 : 1,
                    }}>
                      {processando === t.id ? 'Reabrindo…' : 'Reabrir'}
                    </button>
                  )}
                  <button onClick={() => onExcluir(t.id)} disabled={processando === t.id} style={{
                    padding: '6px 12px', borderRadius: 8, border: `1.5px solid ${C.danger}`, cursor: 'pointer', whiteSpace: 'nowrap',
                    background: '#fff', color: C.danger, fontFamily: '"Montserrat", sans-serif',
                    fontWeight: 700, fontSize: 11.5, opacity: processando === t.id ? 0.6 : 1,
                  }}>
                    Excluir
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {tarefas.length === 0 && (
            <tr>
              <td colSpan={6} style={{ padding: '20px 14px', textAlign: 'center', color: C.muted }}>
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
      if (Array.isArray(lista)) setTarefas(lista);
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
    <Shell user={usuarioLogado} title="Tarefas" subtitle="Planilha de atividades do Desenho" onBack={onBack} accent={accent} wide>
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
