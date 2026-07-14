import React, { useState } from 'react';

const USUARIOS = ['Desenho', 'Topografia', 'Charles', 'Coordenação'];

export function LoginView({ onLogin, globalCss }) {
  const [senhaInput, setSenhaInput] = useState('');
  const [usuarioSelecionadoLogin, setUsuarioSelecionadoLogin] = useState('Charles');

  const handleLogin = (e) => {
    e.preventDefault();
    if (senhaInput === '123' || senhaInput === '') {
      onLogin(usuarioSelecionadoLogin);
    }
  };

  return (
    <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      {globalCss}
      <div style={{ background: '#CCCBCB', padding: '40px', borderRadius: '20px', width: '360px' }}>
        <h1 style={{ textAlign: 'center', color: '#787373', margin: '0 0 20px' }}>Acesso ao Sistema</h1>
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <select 
            value={usuarioSelecionadoLogin} 
            onChange={e => setUsuarioSelecionadoLogin(e.target.value)} 
            style={{ padding: '12px', borderRadius: '8px', border: 'none' }}
          >
            {USUARIOS.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
          <input 
            type="password" 
            placeholder="Senha..." 
            value={senhaInput} 
            onChange={e => setSenhaInput(e.target.value)} 
            style={{ padding: '12px', borderRadius: '8px', border: 'none' }} 
          />
          <button 
            type="submit" 
            style={{ padding: '12px', background: '#333', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}