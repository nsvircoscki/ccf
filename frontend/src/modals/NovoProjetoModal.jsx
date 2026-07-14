import React, { useState } from 'react';
import { api } from '../services/api';

const TIPOS_PROCESSO = ["Retificação", "Desmembramento", "Unificação", "Usucapião", "Alteração de Divisas", "CAR", "Certificação INCRA", "Escritura", "Conferência", "Cadastral", "Locação", "Movimentação de Terra"];

export function NovoProjetoModal({ kanban, onClose, setTelaAtiva }) {
  const [nomeNovoProjeto, setNomeNovoProjeto] = useState("");
  const [tiposNovoProjeto, setTiposNovoProjeto] = useState([]); 
  const [carregandoCriacao, setCarregandoCriacao] = useState(false);
  const [erroCriacao, setErroCriacao] = useState("");

  const toggleTipoProjeto = (tipo) => {
    if (tiposNovoProjeto.includes(tipo)) setTiposNovoProjeto(tiposNovoProjeto.filter(t => t !== tipo));
    else setTiposNovoProjeto([...tiposNovoProjeto, tipo]);
  };

  const criarProjetoCompleto = async () => {
    if (!nomeNovoProjeto.trim() || tiposNovoProjeto.length === 0) return;
    setCarregandoCriacao(true);
    setErroCriacao("");
    try {
      const res = await api.createWorkflow(nomeNovoProjeto, tiposNovoProjeto);
      if (!res.ok) {
        setErroCriacao(res.data.error);
        setCarregandoCriacao(false);
        return;
      }
      await kanban.carregarDados(); 
      onClose();
      
      const wfAtualizados = await api.getWorkflows();
      if (Array.isArray(wfAtualizados) && wfAtualizados.length > 0) {
        kanban.setWorkflowAtivo(wfAtualizados[0].id); 
        setTelaAtiva('kanban'); 
      }
    } catch (erro) { 
      console.error(erro); 
      setErroCriacao("Erro ao conectar com o servidor.");
    } finally { 
      setCarregandoCriacao(false); 
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 }}>
      <div style={{ background: '#FFF', padding: '40px', borderRadius: '20px', width: '550px', boxShadow: '0px 10px 40px rgba(0,0,0,0.2)' }}>
        <h2 style={{ margin: '0 0 20px', color: '#333' }}>Novo Projeto</h2>
        
        {erroCriacao && (
          <div style={{ background: '#FFCDD2', color: '#B71C1C', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px', fontWeight: 'bold' }}>
            {erroCriacao}
          </div>
        )}

        <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#999' }}>NOME DO CLIENTE / PROJETO</label>
        <input autoFocus value={nomeNovoProjeto} onChange={e => setNomeNovoProjeto(e.target.value)} placeholder="Ex: Fazenda Sul..." style={{ width: '100%', padding: '15px', borderRadius: '10px', border: '2px solid #EEE', marginBottom: '20px', boxSizing: 'border-box', fontSize: '16px', outline: 'none' }} />

        <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#999', display: 'block', marginBottom: '10px' }}>TIPOS DE PROCESSO (Selecione 1 ou mais)</label>
        <div className="scroll" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '25px', maxHeight: '180px', overflowY: 'auto', background: '#F9F9F9', padding: '15px', borderRadius: '10px', border: '1px solid #EEE' }}>
          {TIPOS_PROCESSO.map(tipo => (
            <label key={tipo} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '14px', color: '#555', fontWeight: '500' }}>
              <input type="checkbox" style={{ width: '18px', height: '18px', cursor: 'pointer' }} checked={tiposNovoProjeto.includes(tipo)} onChange={() => toggleTipoProjeto(tipo)} />
              {tipo}
            </label>
          ))}
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px' }}>
          <button onClick={onClose} style={{ padding: '12px 25px', borderRadius: '10px', border: 'none', background: '#F0F0F0', color: '#777', cursor: 'pointer', fontWeight: 'bold' }}>Cancelar</button>
          <button onClick={criarProjetoCompleto} disabled={!nomeNovoProjeto.trim() || tiposNovoProjeto.length === 0 || carregandoCriacao} style={{ padding: '12px 25px', borderRadius: '10px', border: 'none', background: (!nomeNovoProjeto.trim() || tiposNovoProjeto.length === 0) ? '#CCC' : '#22C55E', color: 'white', cursor: (!nomeNovoProjeto.trim() || tiposNovoProjeto.length === 0) ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}>{carregandoCriacao ? 'Gerando...' : 'Iniciar Serviços'}</button>
        </div>
      </div>
    </div>
  );
}