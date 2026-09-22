import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChartNoAxesColumn, Clock3, Pencil, Settings, User } from 'lucide-react';
import { api } from '../../services/api';
import { DIAS_SEMANA_PADRAO, PADROES_HORARIO_INFO } from './sisPontoData.js';
import { descreverTurnos, ehHorista } from './sisPontoUtils.js';

// As 5 boxes da tela de Jornada: os 3 padrões fixos, mais "sem designado"
// (ninguém aponta pra nenhum padrão ainda) e "horista" (não usa padrão nenhum).
const BUCKETS_JORNADA = [
  { id: '__sem__', nome: 'Sem Horário Assinalado' },
  { id: 'integral', nome: PADROES_HORARIO_INFO.integral.nome },
  { id: 'manha', nome: PADROES_HORARIO_INFO.manha.nome },
  { id: 'tarde', nome: PADROES_HORARIO_INFO.tarde.nome },
  { id: '__horista__', nome: 'Horista' },
];

// Resumo curto do padrão pro cabeçalho da coluna/menu: mostra o horário de
// segunda e avisa se algum outro dia da semana for diferente.
function descreverPadrao(padrao) {
  const dias = padrao?.dias || {};
  const turnosSegunda = dias.segunda || [];
  if (!turnosSegunda.length) return '';
  const igualTodoDia = DIAS_SEMANA_PADRAO.every(({ id }) => JSON.stringify(dias[id] || []) === JSON.stringify(turnosSegunda));
  const texto = descreverTurnos(turnosSegunda);
  return igualTodoDia ? texto : `${texto} (varia por dia)`;
}

const bucketDoFuncionario = (funcionario, padroesHorario) => {
  if (ehHorista(funcionario)) return '__horista__';
  if (funcionario.padraoHorarioId && padroesHorario[funcionario.padraoHorarioId]) return funcionario.padraoHorarioId;
  return '__sem__';
};

// Tela "Alocação de Horários Padrão": funcionários são cards arrastáveis entre
// as 5 boxes acima, e cada padrão de horário tem seu próprio editor (lápis na
// coluna ou pelo botão "Configurar Horários Padrões"). Só chama pra fora
// quando precisa mexer no que é compartilhado com o resto do admin
// (cadastroFuncionarios e padroesHorario) — o resto (drag, modais, status de
// salvamento) é só desta tela.
export default function SisPontoJornadaAdmin({ cadastroFuncionarios, setCadastroFuncionarios, padroesHorario, setPadroesHorario, carregarHorarios }) {
  const [funcionarioArrastado, setFuncionarioArrastado] = useState(null);
  const [alteracoesPendentes, setAlteracoesPendentes] = useState({});
  const [padraoEmEdicao, setPadraoEmEdicao] = useState(null);
  const [menuPadroesAberto, setMenuPadroesAberto] = useState(false);
  const [statusSalvarHorario, setStatusSalvarHorario] = useState(null);

  // Arrastar um card só muda o estado local (visível na hora); a gravação de
  // verdade no backend só acontece quando o admin clica em "Salvar Alterações",
  // igual à tela de referência (evita gravar uma sequência de drags no meio do caminho).
  const moverFuncionarioParaBucket = (funcionarioId, bucketId) => {
    const mudanca = bucketId === '__horista__' ? { padraoHorarioId: null, horista: true }
      : bucketId === '__sem__' ? { padraoHorarioId: null, horista: false }
      : { padraoHorarioId: bucketId, horista: false };
    setCadastroFuncionarios((atuais) => atuais.map((item) => item.id === funcionarioId ? { ...item, ...mudanca } : item));
    setAlteracoesPendentes((atuais) => ({ ...atuais, [funcionarioId]: mudanca }));
  };

  const salvarAlteracoesJornada = () => {
    const entradas = Object.entries(alteracoesPendentes);
    if (!entradas.length) return;
    setStatusSalvarHorario('salvando');
    Promise.all(entradas.map(([id, mudanca]) => api.updateSispontoFuncionario(id, mudanca).then(() => id).catch(() => null)))
      .then((idsSalvos) => {
        const salvosComSucesso = idsSalvos.filter(Boolean);
        setAlteracoesPendentes((atuais) => {
          const proximo = { ...atuais };
          salvosComSucesso.forEach((id) => delete proximo[id]);
          return proximo;
        });
        setStatusSalvarHorario(salvosComSucesso.length === entradas.length ? 'salvo' : 'erro');
      });
  };

  const salvarPadraoHorario = (padraoId, dias) => {
    setPadroesHorario((atuais) => ({ ...atuais, [padraoId]: { dias } }));
    setPadraoEmEdicao(null);
    api.updateSispontoPadraoHorario(padraoId, dias).catch(() => carregarHorarios());
  };

  const pendencias = Object.keys(alteracoesPendentes).length;

  return (
    <>
      <section className="sis-empty-view">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, color: '#1d3156' }}>Alocação de Horários Padrão</h2>
            <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
              {statusSalvarHorario === 'salvando' && <span style={{ color: '#7183a3', fontSize: 11, fontWeight: 800 }}>Salvando...</span>}
              {statusSalvarHorario === 'salvo' && <span style={{ color: '#2b8761', fontSize: 11, fontWeight: 800 }}>✓ Alterações salvas</span>}
              {statusSalvarHorario === 'erro' && <span style={{ color: '#be3747', fontSize: 11, fontWeight: 800 }}>Algumas alterações não foram salvas — tente novamente.</span>}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button type="button" onClick={() => setMenuPadroesAberto(true)} style={{ display: 'flex', alignItems: 'center', gap: 7, border: '1px solid #dbe6f5', borderRadius: 9, padding: '10px 14px', background: '#fff', color: '#243755', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}><Settings size={15} /> Configurar Horários Padrões</button>
            <button type="button" disabled={!pendencias} onClick={salvarAlteracoesJornada} style={{ border: 0, borderRadius: 9, padding: '10px 16px', background: pendencias ? '#1767e8' : '#a9c1ea', color: '#fff', fontWeight: 800, fontSize: 13, cursor: pendencias ? 'pointer' : 'default' }}>Salvar Alterações{pendencias ? ` (${pendencias})` : ''}</button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(220px, 1fr))', gap: 14, alignItems: 'start' }}>
          {BUCKETS_JORNADA.map((bucket) => {
            const membros = cadastroFuncionarios.filter((funcionario) => bucketDoFuncionario(funcionario, padroesHorario) === bucket.id);
            const padrao = padroesHorario[bucket.id];
            const editavel = Boolean(padrao);
            const destacado = funcionarioArrastado !== null;
            return (
              <div
                key={bucket.id}
                onDragOver={(evento) => evento.preventDefault()}
                onDrop={() => { if (funcionarioArrastado) moverFuncionarioParaBucket(funcionarioArrastado, bucket.id); setFuncionarioArrastado(null); }}
                style={{ border: `1px solid ${destacado ? '#bcd6fb' : '#e5edf8'}`, borderRadius: 12, background: '#f8fbff', padding: 12, minHeight: 260, display: 'flex', flexDirection: 'column', gap: 10 }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 900, color: '#1d3156', fontSize: 13 }}>
                      {bucket.id === '__horista__' ? <User size={14} color="#7183a3" /> : bucket.id === '__sem__' ? <ChartNoAxesColumn size={14} color="#7183a3" /> : <Clock3 size={14} color="#1767e8" />}
                      {bucket.nome}
                    </div>
                    <div style={{ marginTop: 3, color: '#7183a3', fontSize: 10.5, fontWeight: 700 }}>
                      {bucket.id === '__horista__' ? 'Flexível, conf. demanda' : bucket.id === '__sem__' ? `${membros.length}/${cadastroFuncionarios.length}` : `${descreverPadrao(padrao)} · ${membros.length}/${cadastroFuncionarios.length}`}
                    </div>
                  </div>
                  {editavel && (
                    <button type="button" onClick={() => setPadraoEmEdicao(bucket.id)} title="Editar horário do padrão" style={{ border: 0, background: 'transparent', color: '#7183a3', cursor: 'pointer', padding: 4 }}><Pencil size={14} /></button>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                  {membros.map((funcionario) => (
                    <div
                      key={funcionario.id}
                      draggable
                      onDragStart={() => setFuncionarioArrastado(funcionario.id)}
                      onDragEnd={() => setFuncionarioArrastado(null)}
                      style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 10px', borderRadius: 9, background: '#fff', border: '1px solid #e5edf8', cursor: 'grab', boxShadow: '0 1px 3px rgba(15,35,70,.05)' }}
                    >
                      <span style={{ width: 26, height: 26, borderRadius: '50%', background: '#eaf2ff', color: '#1767e8', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 900, flexShrink: 0 }}>{funcionario.nome.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}</span>
                      <span style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 800, color: '#243755', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{funcionario.nome}</div>
                        <div style={{ fontSize: 10, color: '#8a99b1', fontWeight: 700 }}>{funcionario.setor}</div>
                      </span>
                    </div>
                  ))}
                  {!membros.length && (
                    <div style={{ flex: 1, display: 'grid', placeItems: 'center', color: '#a7b4c9', fontSize: 11.5, fontWeight: 700, textAlign: 'center', border: '1px dashed #dbe6f5', borderRadius: 9, padding: 16 }}>Arraste funcionários aqui.</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {menuPadroesAberto && (
        <MenuPadroesHorario
          padroesHorario={padroesHorario}
          onEditar={(padraoId) => { setMenuPadroesAberto(false); setPadraoEmEdicao(padraoId); }}
          onClose={() => setMenuPadroesAberto(false)}
        />
      )}
      {padraoEmEdicao && (
        <EditarPadraoTurnosModal
          nome={PADROES_HORARIO_INFO[padraoEmEdicao]?.nome}
          dias={padroesHorario[padraoEmEdicao]?.dias || {}}
          onSalvar={(dias) => salvarPadraoHorario(padraoEmEdicao, dias)}
          onClose={() => setPadraoEmEdicao(null)}
        />
      )}
    </>
  );
}

// Painel disparado pelo botão "Configurar Horários Padrões": lista os 3
// padrões editáveis com seus horários atuais e um lápis pra cada um, que abre
// o EditarPadraoTurnosModal — o mesmo modal aberto pelo lápis de cada coluna.
function MenuPadroesHorario({ padroesHorario, onEditar, onClose }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} role="presentation" onMouseDown={onClose} style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'grid', placeItems: 'center', padding: 20, background: 'rgba(18, 37, 74, .32)', backdropFilter: 'blur(3px)' }}>
      <motion.section initial={{ opacity: 0, y: 12, scale: .96 }} animate={{ opacity: 1, y: 0, scale: 1 }} role="dialog" aria-modal="true" onMouseDown={(evento) => evento.stopPropagation()} style={{ width: 'min(420px, 100%)', border: '1px solid #dbe7f7', borderRadius: 18, padding: 24, background: '#fff', boxShadow: '0 24px 70px rgba(20, 48, 95, .22)' }}>
        <h2 style={{ margin: 0, color: '#1d3156', fontSize: 18 }}>Configurar Horários Padrões</h2>
        <p style={{ margin: '5px 0 18px', color: '#7183a3', fontSize: 12, fontWeight: 600 }}>Escolha qual padrão editar.</p>
        <div style={{ display: 'grid', gap: 9 }}>
          {Object.entries(PADROES_HORARIO_INFO).map(([padraoId, info]) => (
            <button key={padraoId} type="button" onClick={() => onEditar(padraoId)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, border: '1px solid #e5edf8', borderRadius: 10, padding: '11px 13px', background: '#f8fbff', cursor: 'pointer', textAlign: 'left' }}>
              <span>
                <strong style={{ display: 'block', color: '#243755', fontSize: 13 }}>{info.nome}</strong>
                <span style={{ color: '#7183a3', fontSize: 11, fontWeight: 700 }}>{descreverPadrao(padroesHorario[padraoId])}</span>
              </span>
              <Pencil size={15} color="#1767e8" />
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}><button type="button" onClick={onClose} style={{ border: '1px solid #d8e4f3', borderRadius: 9, padding: '10px 15px', background: '#fff', color: '#52637f', fontWeight: 800, cursor: 'pointer' }}>Fechar</button></div>
      </motion.section>
    </motion.div>
  );
}

// Editor de um único padrão de horário: 1 turno (Manhã/Tarde) ou 2 (Integral,
// com almoço entre eles), um por dia da semana — dá pra deixar, por exemplo,
// a sexta mais curta que o resto. Só os horários mudam — a quantidade de
// turnos do padrão é fixa.
function EditarPadraoTurnosModal({ nome, dias, onSalvar, onClose }) {
  const [valores, setValores] = useState(dias);
  const atualizarCampo = (diaId, turnoIndice, campo, valor) => setValores((atuais) => ({
    ...atuais,
    [diaId]: atuais[diaId].map((turno, indice) => indice === turnoIndice ? { ...turno, [campo]: valor } : turno),
  }));
  const copiarSegundaPraTodos = () => setValores((atuais) => Object.fromEntries(DIAS_SEMANA_PADRAO.map(({ id }) => [id, atuais.segunda.map((turno) => ({ ...turno }))])));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} role="presentation" onMouseDown={onClose} style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'grid', placeItems: 'center', padding: 20, background: 'rgba(18, 37, 74, .32)', backdropFilter: 'blur(3px)' }}>
      <motion.section initial={{ opacity: 0, y: 12, scale: .96 }} animate={{ opacity: 1, y: 0, scale: 1 }} role="dialog" aria-modal="true" onMouseDown={(evento) => evento.stopPropagation()} style={{ width: 'min(480px, 100%)', maxHeight: '86vh', overflowY: 'auto', border: '1px solid #dbe7f7', borderRadius: 18, padding: 24, background: '#fff', boxShadow: '0 24px 70px rgba(20, 48, 95, .22)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ margin: 0, color: '#1d3156', fontSize: 18 }}>Editar {nome}</h2>
            <p style={{ margin: '5px 0 0', color: '#7183a3', fontSize: 12, fontWeight: 600 }}>Um horário por dia da semana.</p>
          </div>
          <button type="button" onClick={copiarSegundaPraTodos} style={{ border: '1px solid #dbe6f5', borderRadius: 8, padding: '8px 11px', background: '#f8fbff', color: '#1767e8', fontWeight: 800, fontSize: 11, cursor: 'pointer', whiteSpace: 'nowrap' }}>Copiar segunda p/ todos</button>
        </div>
        <div style={{ display: 'grid', gap: 16, marginTop: 18 }}>
          {DIAS_SEMANA_PADRAO.map(({ id: diaId, nome: nomeDia }) => (
            <div key={diaId} style={{ display: 'grid', gap: 8, padding: '12px', borderRadius: 10, background: '#f8fbff', border: '1px solid #e5edf8' }}>
              <strong style={{ color: '#243755', fontSize: 12 }}>{nomeDia}</strong>
              <div style={{ display: 'grid', gap: 8 }}>
                {(valores[diaId] || []).map((turno, turnoIndice) => (
                  <div key={turnoIndice} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <label style={{ display: 'grid', gap: 4, color: '#7183a3', fontSize: 10, fontWeight: 800 }}>{(valores[diaId] || []).length > 1 ? `Entrada ${turnoIndice + 1}` : 'Entrada'}
                      <input type="time" value={turno.entrada} onChange={(evento) => atualizarCampo(diaId, turnoIndice, 'entrada', evento.target.value)} style={{ height: 36, borderRadius: 8, border: '1px solid #d8e6fc', padding: '0 8px', fontSize: 12.5, fontWeight: 700, color: '#405371' }} />
                    </label>
                    <label style={{ display: 'grid', gap: 4, color: '#7183a3', fontSize: 10, fontWeight: 800 }}>{(valores[diaId] || []).length > 1 ? `Saída ${turnoIndice + 1}` : 'Saída'}
                      <input type="time" value={turno.saida} onChange={(evento) => atualizarCampo(diaId, turnoIndice, 'saida', evento.target.value)} style={{ height: 36, borderRadius: 8, border: '1px solid #d8e6fc', padding: '0 8px', fontSize: 12.5, fontWeight: 700, color: '#405371' }} />
                    </label>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 9, marginTop: 22 }}>
          <button type="button" onClick={onClose} style={{ border: '1px solid #d8e4f3', borderRadius: 9, padding: '10px 15px', background: '#fff', color: '#52637f', fontWeight: 800, cursor: 'pointer' }}>Cancelar</button>
          <button type="button" onClick={() => onSalvar(valores)} style={{ border: 0, borderRadius: 9, padding: '10px 17px', background: '#1767e8', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>Salvar</button>
        </div>
      </motion.section>
    </motion.div>
  );
}
