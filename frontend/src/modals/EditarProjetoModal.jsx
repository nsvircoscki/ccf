import React, { useState } from 'react';
import { api } from '../services/api';

const TIPOS_PROCESSO = ["Retificação", "Desmembramento", "Unificação", "Usucapião", "Alteração de Divisas", "CAR", "Certificação INCRA", "Escritura", "Conferência", "Cadastral", "Locação", "Movimentação de Terra", "Danc"];

export function EditarProjetoModal({ kanban, onClose }) {
  const { workflows, workflowAtivo, carregarDados } = kanban;
  const projetoEditando = workflows.find(w => w.id === workflowAtivo);
  
  const [tiposEditando, setTiposEditando] = useState(
    projetoEditando?.description ? projetoEditando.description.split(', ') : []
  );
  const [terrenoEditando, setTerrenoEditando] = useState(projetoEditando?.terreno || 'Urbano');

  const toggleTipoEdicao = (tipo) => {
    if (tiposEditando.includes(tipo)) setTiposEditando(tiposEditando.filter(t => t !== tipo));
    else setTiposEditando([...tiposEditando, tipo]);
  };

  const salvarEdicaoProjeto = async () => {
    if (tiposEditando.length === 0 || !projetoEditando) return;
    try {
      await api.updateWorkflow(projetoEditando.id, tiposEditando, terrenoEditando);
      await carregarDados();
      onClose();
    } catch(err) { 
      console.error(err); 
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 }}>
      <div style={{ background: '#FFF', padding: '40px', borderRadius: '20px', width: '550px', boxShadow: '0px 10px 40px rgba(0,0,0,0.2)' }}>
        <h2 style={{ margin: '0 0 10px', color: '#333' }}>Editar Serviços</h2>
        <p style={{ margin: '0 0 20px', color: '#777', fontWeight: 'bold' }}>Projeto: {projetoEditando?.name}</p>

        <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#999', display: 'block', marginBottom: '10px' }}>TIPO DE TERRENO</label>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button
            type="button"
            onClick={() => setTerrenoEditando('Urbano')}
            style={{ flex: 1, padding: '12px', borderRadius: '10px', border: terrenoEditando === 'Urbano' ? '2px solid #4A90E2' : '1px solid #DDD', background: terrenoEditando === 'Urbano' ? '#EFF6FF' : '#FFF', color: terrenoEditando === 'Urbano' ? '#4A90E2' : '#555', fontWeight: 'bold', cursor: 'pointer' }}
          >
            Urbano
          </button>
          <button
            type="button"
            onClick={() => setTerrenoEditando('Rural')}
            style={{ flex: 1, padding: '12px', borderRadius: '10px', border: terrenoEditando === 'Rural' ? '2px solid #22C55E' : '1px solid #DDD', background: terrenoEditando === 'Rural' ? '#F0FDF4' : '#FFF', color: terrenoEditando === 'Rural' ? '#22C55E' : '#555', fontWeight: 'bold', cursor: 'pointer' }}
          >
            Rural
          </button>
        </div>

        <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#999', display: 'block', marginBottom: '10px' }}>TIPOS DE PROCESSO (Adicione ou Remova)</label>
        <div className="scroll" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '25px', maxHeight: '180px', overflowY: 'auto', background: '#F9F9F9', padding: '15px', borderRadius: '10px', border: '1px solid #EEE' }}>
          {TIPOS_PROCESSO.map(tipo => (
            <label key={tipo} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '14px', color: '#555', fontWeight: '500' }}>
              <input type="checkbox" style={{ width: '18px', height: '18px', cursor: 'pointer' }} checked={tiposEditando.includes(tipo)} onChange={() => toggleTipoEdicao(tipo)} />
              {tipo}
            </label>
          ))}
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px' }}>
          <button onClick={onClose} style={{ padding: '12px 25px', borderRadius: '10px', border: 'none', background: '#F0F0F0', color: '#777', cursor: 'pointer', fontWeight: 'bold' }}>Cancelar</button>
          <button onClick={salvarEdicaoProjeto} disabled={tiposEditando.length === 0} style={{ padding: '12px 25px', borderRadius: '10px', border: 'none', background: tiposEditando.length === 0 ? '#CCC' : '#333', color: 'white', cursor: tiposEditando.length === 0 ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}>Salvar Alterações</button>
        </div>
      </div>
    </div>
  );
}