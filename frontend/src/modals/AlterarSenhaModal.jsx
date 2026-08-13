import React, { useState } from 'react';
import { authService } from '../services/authService';

const campoStyle = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: '10px',
  border: '1.5px solid #DDD',
  outline: 'none',
  fontSize: '14px',
  boxSizing: 'border-box',
};

const labelStyle = {
  fontSize: '12px', fontWeight: 'bold', color: '#999', display: 'block', marginBottom: '8px',
};

export function AlterarSenhaModal({ usuarioLogado, onClose }) {
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const handleSalvar = async () => {
    setErro('');
    if (novaSenha !== confirmarSenha) {
      setErro('A nova senha e a confirmação não coincidem.');
      return;
    }

    setSalvando(true);
    try {
      const res = await authService.alterarSenha(usuarioLogado, senhaAtual, novaSenha);
      if (!res.ok) {
        setErro(res.data?.error || 'Erro ao alterar senha.');
        return;
      }
      setSucesso(true);
    } catch (erro) {
      console.error(erro);
      setErro('Erro ao conectar com o servidor.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 200 }}>
      <div style={{ background: '#FFF', padding: '32px', borderRadius: '18px', width: '380px', boxShadow: '0px 10px 40px rgba(0,0,0,0.2)' }}>
        <h2 style={{ margin: '0 0 4px', color: '#333', fontSize: '18px' }}>Alterar senha</h2>
        <p style={{ margin: '0 0 22px', color: '#777', fontSize: '13px', fontWeight: 'bold' }}>{usuarioLogado}</p>

        {sucesso ? (
          <>
            <p style={{ color: '#22C55E', fontWeight: 'bold', fontSize: '14px', margin: '0 0 20px' }}>
              Senha alterada com sucesso.
            </p>
            <button
              type="button"
              onClick={onClose}
              style={{ width: '100%', padding: '12px', borderRadius: '10px', border: 'none', background: '#2D7AFD', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}
            >
              Fechar
            </button>
          </>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Senha atual</label>
                <input type="password" value={senhaAtual} onChange={(e) => setSenhaAtual(e.target.value)} style={campoStyle} />
              </div>
              <div>
                <label style={labelStyle}>Nova senha</label>
                <input type="password" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} style={campoStyle} />
              </div>
              <div>
                <label style={labelStyle}>Confirmar nova senha</label>
                <input type="password" value={confirmarSenha} onChange={(e) => setConfirmarSenha(e.target.value)} style={campoStyle} />
              </div>
            </div>

            {erro && (
              <p style={{ color: '#DC2626', fontSize: '13px', fontWeight: 'bold', margin: '14px 0 0' }}>{erro}</p>
            )}

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button
                type="button"
                onClick={onClose}
                style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid #DDD', background: '#FFF', color: '#777', fontWeight: 'bold', cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSalvar}
                disabled={salvando || !senhaAtual || !novaSenha || !confirmarSenha}
                style={{
                  flex: 1, padding: '12px', borderRadius: '10px', border: 'none',
                  background: salvando ? '#94B8FF' : '#2D7AFD', color: '#fff', fontWeight: 'bold',
                  cursor: salvando ? 'default' : 'pointer',
                }}
              >
                {salvando ? 'Salvando…' : 'Salvar'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
