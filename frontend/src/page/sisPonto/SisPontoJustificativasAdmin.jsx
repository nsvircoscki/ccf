import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Trash2, User } from 'lucide-react';
import { api } from '../../services/api';
import { JUSTIFICATIVA_CORES } from './sisPontoData.js';
import { Card, ConfirmacaoPonto } from './SisPontoComponents.jsx';

const ORDEM_STATUS_JUSTIFICATIVA = { 'Em análise': 0, Aceita: 1, Inválida: 2, Recusada: 3 };

export default function SisPontoJustificativasAdmin({ justificativas, carregando, onAtualizado }) {
  const [processandoId, setProcessandoId] = useState(null);
  const [imagemAmpliada, setImagemAmpliada] = useState(null);
  const [confirmacaoExclusao, setConfirmacaoExclusao] = useState(null);

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

  const ordenadas = [...justificativas].sort((a, b) => {
    const porStatus = (ORDEM_STATUS_JUSTIFICATIVA[a.status] ?? 9) - (ORDEM_STATUS_JUSTIFICATIVA[b.status] ?? 9);
    if (porStatus !== 0) return porStatus;
    return new Date(b.criadoEm) - new Date(a.criadoEm);
  });

  if (carregando) {
    return <Card style={{ padding: 26, minHeight: 200 }}><p style={{ color: '#7183a3', fontSize: 13 }}>Carregando justificativas...</p></Card>;
  }

  if (!ordenadas.length) {
    return <Card style={{ padding: 26, minHeight: 200 }}>
      <h2 style={{ margin: 0, fontSize: 20 }}>Justificativas</h2>
      <p style={{ margin: '6px 0 0', color: '#7183a3', fontSize: 13, fontWeight: 600 }}>Nenhuma solicitação enviada pelos funcionários até o momento.</p>
    </Card>;
  }

  return (
    <>
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
