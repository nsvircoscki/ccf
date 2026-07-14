import React from 'react';

const CORES = {
  'Charles': { bg: '#FFF9C4', borda: '#FBC02D' },      
  'Topografia': { bg: '#BBDEFB', borda: '#1E88E5' },   
  'Desenho': { bg: '#C8E6C9', borda: '#43A047' },      
  'Coordenação': { bg: '#D7CCC8', borda: '#795548' }   
};

export function Topbar({ 
  telaAtiva, 
  setTelaAtiva, 
  buscaTexto, 
  setBuscaTexto, 
  usuarioLogado, 
  setUsuarioLogado, 
  onAbrirNovoProjeto 
}) {
  return (
    <div style={{ background: '#FFFFFF', padding: '15px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0px 2px 10px rgba(0,0,0,0.05)', zIndex: 10 }}>
      <div style={{ display: 'flex', gap: '30px', alignItems: 'center', flex: 1 }}>
        <h2 style={{ margin: 0, color: '#333', fontSize: '20px', fontWeight: '900' }}>WORKSPACE</h2>
        <div style={{ display: 'flex', gap: '10px', background: '#F0F0F0', padding: '5px', borderRadius: '10px' }}>
          <button 
            onClick={() => setTelaAtiva('dashboard')} 
            style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: telaAtiva === 'dashboard' ? '#FFFFFF' : 'transparent', color: telaAtiva === 'dashboard' ? '#22C55E' : '#777', fontWeight: 'bold', cursor: 'pointer', boxShadow: telaAtiva === 'dashboard' ? '0px 2px 5px rgba(0,0,0,0.1)' : 'none' }}
          >
            Dashboard Geral
          </button>
          <button 
            onClick={() => setTelaAtiva('kanban')} 
            style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: telaAtiva === 'kanban' ? '#FFFFFF' : 'transparent', color: telaAtiva === 'kanban' ? '#22C55E' : '#777', fontWeight: 'bold', cursor: 'pointer', boxShadow: telaAtiva === 'kanban' ? '0px 2px 5px rgba(0,0,0,0.1)' : 'none' }}
          >
            Quadro Kanban
          </button>
        </div>
        
        <input 
          type="text" 
          placeholder="Pesquisar cliente ou atividade..." 
          value={buscaTexto} 
          onChange={e => setBuscaTexto(e.target.value)} 
          style={{ padding: '10px 15px', borderRadius: '8px', border: '1px solid #DDD', outline: 'none', width: '300px', marginLeft: '20px' }} 
        />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <button 
          onClick={onAbrirNovoProjeto} 
          style={{ padding: '10px 20px', background: '#333', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          Novo Projeto
        </button>
        <div style={{ width: '1px', height: '30px', background: '#DDD' }}></div>
        <span style={{ fontWeight: 'bold', color: '#555' }}>
          Logado: <span style={{ color: CORES[usuarioLogado]?.borda || '#333' }}>{usuarioLogado}</span>
        </span>
        <button 
          onClick={() => setUsuarioLogado(null)} 
          style={{ padding: '8px 15px', background: '#FF5252', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          Sair
        </button>
      </div>
    </div>
  );
}