import React, { useState } from 'react';

export function DetalhesProjetoModal({ kanban, onClose }) {
  const { workflows, workflowAtivo, atualizarDetalhesProjeto } = kanban;
  const projeto = workflows.find(w => w.id === workflowAtivo);

  const [matriculaTexto, setMatriculaTexto] = useState(projeto?.matricula || '');
  const [enderecoTexto, setEnderecoTexto] = useState(projeto?.endereco || '');
  const [detalhesTexto, setDetalhesTexto] = useState(projeto?.details || '');

  const salvar = async () => {
    if (!workflowAtivo) return;
    await atualizarDetalhesProjeto(workflowAtivo, {
      matricula: matriculaTexto,
      endereco: enderecoTexto,
      details: detalhesTexto
    });
    onClose();
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 300 }}>
      <div style={{ background: '#FFF', padding: '30px', borderRadius: '20px', width: '500px', boxShadow: '0px 10px 40px rgba(0,0,0,0.2)' }}>
        <h2 style={{ margin: '0 0 10px', color: '#333' }}>Informações do Projeto</h2>
        <p style={{ color: '#777', fontSize: '13px', marginBottom: '20px', fontWeight: 'bold' }}>{projeto?.name}</p>

        <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#999', display: 'block', marginBottom: '6px' }}>MATRÍCULA (Visível)</label>
            <input
              type="text"
              value={matriculaTexto}
              onChange={(e) => setMatriculaTexto(e.target.value)}
              placeholder="Nº da Matrícula"
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '2px solid #EEE', outline: 'none', fontSize: '14px', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ flex: 2 }}>
            <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#999', display: 'block', marginBottom: '6px' }}>ENDEREÇO (Visível)</label>
            <input
              type="text"
              value={enderecoTexto}
              onChange={(e) => setEnderecoTexto(e.target.value)}
              placeholder="Rua, Cidade..."
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '2px solid #EEE', outline: 'none', fontSize: '14px', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#999', display: 'block', marginBottom: '6px' }}>NOTAS / DETALHES</label>
        <textarea
          value={detalhesTexto}
          onChange={(e) => setDetalhesTexto(e.target.value)}
          placeholder="Anotações internas, contatos, ou detalhes extras..."
          style={{ width: '100%', minHeight: '120px', padding: '12px', borderRadius: '8px', border: '2px solid #EEE', outline: 'none', resize: 'vertical', fontSize: '14px', fontFamily: 'inherit', boxSizing: 'border-box' }}
        />

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px', marginTop: '20px' }}>
          <button onClick={onClose} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#F0F0F0', color: '#777', cursor: 'pointer', fontWeight: 'bold' }}>Fechar</button>
          <button onClick={salvar} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#4A90E2', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}>Salvar</button>
        </div>
      </div>
    </div>
  );
}
