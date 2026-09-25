import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarDays, ChartNoAxesColumn, Clock3, FileText, Trash2, User } from 'lucide-react';
import { api } from '../../services/api';
import { JUSTIFICATIVA_CORES } from './sisPontoData.js';
import { Card, ConfirmacaoPonto } from './SisPontoComponents.jsx';

const ORDEM_STATUS_JUSTIFICATIVA = { 'Em análise': 0, Aceita: 1, Inválida: 2, Recusada: 3 };
const OPCOES_STATUS = ['Todos os status', 'Em análise', 'Aceita', 'Inválida', 'Recusada'];

export default function SisPontoJustificativasAdmin({ justificativas, carregando, onAtualizado }) {
  const [processandoId, setProcessandoId] = useState(null);
  const [imagemAmpliada, setImagemAmpliada] = useState(null);
  const [confirmacaoExclusao, setConfirmacaoExclusao] = useState(null);
  const [funcionarioFiltro, setFuncionarioFiltro] = useState('Todos os funcionários');
  const [setorFiltro, setSetorFiltro] = useState('Todos os setores');
  const [statusFiltro, setStatusFiltro] = useState('Todos os status');
  const [mesFiltro, setMesFiltro] = useState('Todos os meses');

  const nomes = useMemo(() => Array.from(new Set(justificativas.map((item) => item.nome))).sort(), [justificativas]);
  const setores = useMemo(() => Array.from(new Set(justificativas.map((item) => item.setor))).sort(), [justificativas]);
  // "yyyy-mm" -> rótulo "MM/AAAA", pra filtrar por mês sem depender do mês
  // que estiver aberto em outra aba (Calendário, Dashboard).
  const meses = useMemo(() => Array.from(new Set(justificativas.map((item) => item.dia?.slice(0, 7)).filter(Boolean)))
    .sort((a, b) => b.localeCompare(a))
    .map((chave) => ({ chave, label: `${chave.slice(5, 7)}/${chave.slice(0, 4)}` })), [justificativas]);

  const decidir = async (id, status) => {
    setProcessandoId(id);
    try {
      await api.updateSispontoJustificativa(id, { status });
      onAtualizado();
    } catch {
      // mantém a lista como está; o admin pode tentar novamente.
    } finally {
      setProcessandoId(null);
    }
  };

  const excluir = (justificativa) => setConfirmacaoExclusao({
    titulo: 'Excluir justificativa',
    mensagem: `Excluir a justificativa de ${justificativa.nome} (${justificativa.dia})? Essa ação não pode ser desfeita.`,
    destrutivo: true,
    confirmar: async () => {
      setConfirmacaoExclusao(null);
      setProcessandoId(justificativa.id);
      try {
        await api.deleteSispontoJustificativa(justificativa.id);
        onAtualizado();
      } catch {
        // mantém a lista como está; o admin pode tentar novamente.
      } finally {
        setProcessandoId(null);
      }
    },
  });

  const ordenadas = [...justificativas]
    .filter((item) => (funcionarioFiltro === 'Todos os funcionários' || item.nome === funcionarioFiltro)
      && (setorFiltro === 'Todos os setores' || item.setor === setorFiltro)
      && (statusFiltro === 'Todos os status' || item.status === statusFiltro)
      && (mesFiltro === 'Todos os meses' || item.dia?.startsWith(mesFiltro)))
    .sort((a, b) => {
      const porStatus = (ORDEM_STATUS_JUSTIFICATIVA[a.status] ?? 9) - (ORDEM_STATUS_JUSTIFICATIVA[b.status] ?? 9);
      if (porStatus !== 0) return porStatus;
      return new Date(b.criadoEm) - new Date(a.criadoEm);
    });
  const filtrosAtivos = funcionarioFiltro !== 'Todos os funcionários' || setorFiltro !== 'Todos os setores' || statusFiltro !== 'Todos os status' || mesFiltro !== 'Todos os meses';
  const limparFiltros = () => { setFuncionarioFiltro('Todos os funcionários'); setSetorFiltro('Todos os setores'); setStatusFiltro('Todos os status'); setMesFiltro('Todos os meses'); };

  const filtros = (
    <section className="sis-filterbar" style={{ marginBottom: 16 }}>
      <div className="sis-filter-group">
        <User size={16} color="#3177dd" />
        <select value={funcionarioFiltro} onChange={(evento) => setFuncionarioFiltro(evento.target.value)}>
          <option>Todos os funcionários</option>
          {nomes.map((nome) => <option key={nome}>{nome}</option>)}
        </select>
      </div>
      <div className="sis-filter-group">
        <ChartNoAxesColumn size={16} color="#3177dd" />
        <select value={setorFiltro} onChange={(evento) => setSetorFiltro(evento.target.value)}>
          <option>Todos os setores</option>
          {setores.map((setor) => <option key={setor}>{setor}</option>)}
        </select>
      </div>
      <div className="sis-filter-group">
        <Clock3 size={16} color="#3177dd" />
        <select value={statusFiltro} onChange={(evento) => setStatusFiltro(evento.target.value)}>
          {OPCOES_STATUS.map((status) => <option key={status}>{status}</option>)}
        </select>
      </div>
      <div className="sis-filter-group">
        <CalendarDays size={16} color="#3177dd" />
        <select value={mesFiltro} onChange={(evento) => setMesFiltro(evento.target.value)}>
          <option value="Todos os meses">Todos os meses</option>
          {meses.map((item) => <option key={item.chave} value={item.chave}>{item.label}</option>)}
        </select>
      </div>
      {filtrosAtivos && <button type="button" className="sis-export-button" onClick={limparFiltros} style={{ background: '#fff', color: '#52637f', border: '1px solid #d8e4f3' }}>Limpar filtros</button>}
    </section>
  );

  if (carregando) {
    return <Card style={{ padding: 26, minHeight: 200 }}><p style={{ color: '#7183a3', fontSize: 13 }}>Carregando justificativas...</p></Card>;
  }

  if (!justificativas.length) {
    return <Card style={{ padding: 26, minHeight: 200 }}>
      <h2 style={{ margin: 0, fontSize: 20 }}>Justificativas</h2>
      <p style={{ margin: '6px 0 0', color: '#7183a3', fontSize: 13, fontWeight: 600 }}>Nenhuma solicitação enviada pelos funcionários até o momento.</p>
    </Card>;
  }

  return (
    <>
    {filtros}
    {!ordenadas.length && (
      <Card style={{ padding: 26, minHeight: 160, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 10 }}>
        <p style={{ margin: 0, color: '#7183a3', fontSize: 13, fontWeight: 600 }}>Nenhuma justificativa encontrada com esses filtros.</p>
        <button type="button" onClick={limparFiltros} style={{ border: 0, borderRadius: 9, padding: '9px 14px', background: '#eef4ff', color: '#1767e8', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>Limpar filtros</button>
      </Card>
    )}
    <div style={{ display: 'grid', gap: 12 }}>
      {ordenadas.map((justificativa) => {
        const cor = JUSTIFICATIVA_CORES[justificativa.status] || JUSTIFICATIVA_CORES['Em análise'];
        const processando = processandoId === justificativa.id;
        return (
          <motion.div key={justificativa.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ background: '#fff', border: `1px solid ${cor.borda}`, borderRadius: 14, boxShadow: '0 4px 14px rgba(15,35,70,.05)', padding: 18, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 260px', minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 900, color: '#1d3156', fontSize: 14 }}><User size={14} /> {justificativa.nome}</span>
                <span style={{ color: '#7183a3', fontSize: 11, fontWeight: 800 }}>{justificativa.setor}</span>
                <span style={{ marginLeft: 'auto', padding: '4px 10px', borderRadius: 99, background: cor.texto, color: '#fff', fontSize: 10, fontWeight: 900 }}>{justificativa.status}</span>
              </div>
              <div style={{ marginTop: 8, color: '#243755', fontSize: 12, fontWeight: 800 }}>
                {new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', weekday: 'long' }).format(new Date(`${justificativa.dia}T12:00:00`))} · {justificativa.horaInicio}–{justificativa.horaFim}
              </div>
              <p style={{ margin: '8px 0 0', color: '#405371', fontSize: 12, fontWeight: 600, lineHeight: 1.5 }}>{justificativa.motivo}</p>
              {justificativa.anexoDataUrl && (
                <button type="button" onClick={() => setImagemAmpliada(justificativa.anexoDataUrl)} style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10, border: 0, background: 'transparent', padding: 0, cursor: 'pointer' }}>
                  <span style={{ display: 'block', width: 56, height: 56, borderRadius: 8, overflow: 'hidden', border: '1px solid #e5edf8', flexShrink: 0 }}>
                    <img src={justificativa.anexoDataUrl} alt="Atestado anexado" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#1767e8', fontSize: 11, fontWeight: 800 }}><FileText size={13} /> Ver atestado anexado</span>
                </button>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: '0 0 auto', justifyContent: 'center', alignItems: 'stretch' }}>
              {justificativa.status === 'Em análise' ? (
                <>
                  <button type="button" disabled={processando} onClick={() => decidir(justificativa.id, 'Aceita')} style={{ border: 0, borderRadius: 8, padding: '9px 16px', background: '#2aba72', color: '#fff', fontWeight: 800, fontSize: 12, cursor: processando ? 'default' : 'pointer', opacity: processando ? .6 : 1 }}>Aceitar justificativa</button>
                  <button type="button" disabled={processando} onClick={() => decidir(justificativa.id, 'Inválida')} style={{ border: 0, borderRadius: 8, padding: '9px 16px', background: '#ff9c2e', color: '#fff', fontWeight: 800, fontSize: 12, cursor: processando ? 'default' : 'pointer', opacity: processando ? .6 : 1 }}>Justificativa inválida</button>
                  <button type="button" disabled={processando} onClick={() => decidir(justificativa.id, 'Recusada')} style={{ border: 0, borderRadius: 8, padding: '9px 16px', background: '#e4544e', color: '#fff', fontWeight: 800, fontSize: 12, cursor: processando ? 'default' : 'pointer', opacity: processando ? .6 : 1 }}>Recusar justificativa</button>
                </>
              ) : (
                <div style={{ color: '#7183a3', fontSize: 11, fontWeight: 700, textAlign: 'right' }}>
                  Decidida em {new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(justificativa.atualizadoEm))}
                </div>
              )}
              <button type="button" disabled={processando} onClick={() => excluir(justificativa)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, border: '1px solid #f0d3d3', borderRadius: 8, padding: '8px 16px', background: '#fff', color: '#8a4a4f', fontWeight: 800, fontSize: 12, cursor: processando ? 'default' : 'pointer', opacity: processando ? .6 : 1 }}><Trash2 size={13} /> Excluir</button>
            </div>
          </motion.div>
        );
      })}
    </div>
    {imagemAmpliada && (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} role="presentation" onMouseDown={() => setImagemAmpliada(null)} style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'grid', placeItems: 'center', padding: 24, background: 'rgba(15, 30, 55, .72)' }}>
        <motion.img initial={{ opacity: 0, scale: .96 }} animate={{ opacity: 1, scale: 1 }} src={imagemAmpliada} alt="Atestado anexado em tamanho ampliado" onMouseDown={(event) => event.stopPropagation()} style={{ maxWidth: 'min(720px, 92vw)', maxHeight: '86vh', borderRadius: 12, boxShadow: '0 24px 70px rgba(0,0,0,.4)' }} />
      </motion.div>
    )}
    {confirmacaoExclusao && <ConfirmacaoPonto {...confirmacaoExclusao} onClose={() => setConfirmacaoExclusao(null)} />}
    </>
  );
}
