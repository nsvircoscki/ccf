import React, { useState } from 'react';
import LeafIcon from './LeafIcon';
import { authService } from '../services/authService';

const USUARIOS = ['DES', 'TOPO', 'ENG', 'CRD'];

const fieldStyle = {
  width: '100%',
  padding: '12px 16px',
  border: '1.5px solid #d8e0f0',
  borderRadius: 10,
  fontFamily: '"Open Sans", sans-serif',
  fontSize: 14,
  color: '#0e2549',
  background: '#ffffff',
  outline: 'none',
  transition: 'border-color 0.2s',
  boxSizing: 'border-box',
};

const labelStyle = {
  display: 'block',
  fontFamily: '"Montserrat", sans-serif',
  fontWeight: 600,
  fontSize: 12,
  color: '#3a4a6b',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  marginBottom: 7,
};

export function LoginView({ onLogin, globalCss }) {
  const [senhaInput, setSenhaInput] = useState('');
  const [confirmarSenhaInput, setConfirmarSenhaInput] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [usuarioSelecionadoLogin, setUsuarioSelecionadoLogin] = useState('ENG');
  // 'login': tela normal. 'criar-senha': primeiro acesso desse usuário —
  // password_hash ainda é nulo no banco, então pedimos pra ele definir uma.
  const [modo, setModo] = useState('login');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  const trocarUsuario = (nome) => {
    setUsuarioSelecionadoLogin(nome);
    setModo('login');
    setSenhaInput('');
    setConfirmarSenhaInput('');
    setErro('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErro('');

    if (modo === 'criar-senha') {
      if (senhaInput !== confirmarSenhaInput) {
        setErro('As senhas não coincidem.');
        return;
      }
      setCarregando(true);
      try {
        const res = await authService.criarSenha(usuarioSelecionadoLogin, senhaInput);
        if (!res.ok) {
          setErro(res.data?.error || 'Erro ao criar senha.');
          return;
        }
        onLogin(usuarioSelecionadoLogin);
      } catch (erro) {
        console.error(erro);
        setErro('Erro ao conectar com o servidor.');
      } finally {
        setCarregando(false);
      }
      return;
    }

    setCarregando(true);
    try {
      const res = await authService.login(usuarioSelecionadoLogin, senhaInput);
      if (!res.ok) {
        setErro(res.data?.error || 'Erro ao entrar.');
        return;
      }
      if (res.data.precisaCriarSenha) {
        setModo('criar-senha');
        setSenhaInput('');
        setConfirmarSenhaInput('');
        return;
      }
      onLogin(usuarioSelecionadoLogin);
    } catch (erro) {
      console.error(erro);
      setErro('Erro ao conectar com o servidor.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: '#f4f7fb' }}>
      {globalCss}

      {/* Esquerda — marca */}
      <div
        style={{
          flex: '0 0 44%',
          background: 'linear-gradient(155deg, #0e2549 0%, #1a3a8a 60%, #1d4f9e 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: 360,
            height: 360,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(46,139,46,0.18) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28 }}>
          <LeafIcon size={150} />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div
              style={{
                fontFamily: '"Montserrat", sans-serif',
                fontWeight: 900,
                fontSize: 64,
                lineHeight: 1,
                color: '#ffffff',
                letterSpacing: '-0.02em',
              }}
            >
              CCF
            </div>
            <div
              style={{
                fontFamily: '"Montserrat", sans-serif',
                fontWeight: 700,
                fontSize: 15,
                color: 'rgba(255,255,255,0.75)',
                letterSpacing: '0.28em',
                textTransform: 'uppercase',
              }}
            >
              Consultores
            </div>
          </div>
        </div>

        <div style={{ position: 'absolute', bottom: -40, left: '50%', transform: 'translateX(-50%)' }}>
          {[80, 140, 200].map((r) => (
            <div
              key={r}
              style={{
                position: 'absolute',
                width: r * 2,
                height: r * 2,
                borderRadius: '50%',
                border: '1px solid rgba(122,218,240,0.15)',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%,-50%)',
              }}
            />
          ))}
        </div>
      </div>

      {/* Direita — formulário */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 40px' }}>
        <form onSubmit={handleLogin} style={{ width: '100%', maxWidth: 380 }}>
          <div style={{ marginBottom: 40 }}>
            <h1
              style={{
                fontFamily: '"Montserrat", sans-serif',
                fontWeight: 700,
                fontSize: 28,
                color: '#0e2549',
                margin: '0 0 8px',
                letterSpacing: '-0.01em',
              }}
            >
              {modo === 'criar-senha' ? 'Crie sua senha' : 'Bem-vindo'}
            </h1>
            <p style={{ fontFamily: '"Open Sans", sans-serif', fontSize: 14, color: '#6b7a99', margin: 0 }}>
              {modo === 'criar-senha'
                ? `Primeiro acesso de ${usuarioSelecionadoLogin} — defina uma senha para continuar.`
                : 'Acesse o sistema CCF Consultores'}
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label style={labelStyle}>Usuário</label>
              <select
                value={usuarioSelecionadoLogin}
                onChange={(e) => trocarUsuario(e.target.value)}
                style={{ ...fieldStyle, cursor: 'pointer' }}
              >
                {USUARIOS.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>{modo === 'criar-senha' ? 'Nova senha' : 'Senha'}</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={mostrarSenha ? 'text' : 'password'}
                  value={senhaInput}
                  onChange={(e) => setSenhaInput(e.target.value)}
                  placeholder="••••••••"
                  autoFocus
                  style={{ ...fieldStyle, padding: '12px 44px 12px 16px' }}
                  onFocus={(e) => (e.target.style.borderColor = '#1a3a8a')}
                  onBlur={(e) => (e.target.style.borderColor = '#d8e0f0')}
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha((s) => !s)}
                  style={{
                    position: 'absolute',
                    right: 14,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    color: '#8899bb',
                    fontSize: 16,
                    lineHeight: 1,
                  }}
                  aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {mostrarSenha ? '👁' : '👁'}
                </button>
              </div>
            </div>

            {modo === 'criar-senha' && (
              <div>
                <label style={labelStyle}>Confirmar senha</label>
                <input
                  type={mostrarSenha ? 'text' : 'password'}
                  value={confirmarSenhaInput}
                  onChange={(e) => setConfirmarSenhaInput(e.target.value)}
                  placeholder="••••••••"
                  style={fieldStyle}
                  onFocus={(e) => (e.target.style.borderColor = '#1a3a8a')}
                  onBlur={(e) => (e.target.style.borderColor = '#d8e0f0')}
                />
              </div>
            )}

            {erro && (
              <p style={{ fontFamily: '"Open Sans", sans-serif', fontSize: 13, color: '#DC2626', margin: 0, fontWeight: 600 }}>
                {erro}
              </p>
            )}

            <button
              type="submit"
              disabled={carregando}
              style={{
                width: '100%',
                padding: '13px',
                background: 'linear-gradient(135deg, #1a3a8a 0%, #2e8b2e 100%)',
                border: 'none',
                borderRadius: 10,
                fontFamily: '"Montserrat", sans-serif',
                fontWeight: 700,
                fontSize: 14,
                letterSpacing: '0.06em',
                color: '#ffffff',
                cursor: carregando ? 'default' : 'pointer',
                opacity: carregando ? 0.7 : 1,
                transition: 'opacity 0.2s, transform 0.15s',
                marginTop: 4,
              }}
              onMouseEnter={(e) => {
                if (carregando) return;
                e.currentTarget.style.opacity = '0.9';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                if (carregando) return;
                e.currentTarget.style.opacity = '1';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {carregando ? '...' : modo === 'criar-senha' ? 'CRIAR SENHA E ENTRAR' : 'ENTRAR'}
            </button>
          </div>

          <p
            style={{
              fontFamily: '"Open Sans", sans-serif',
              fontSize: 12,
              color: '#9aabcc',
              textAlign: 'center',
              marginTop: 36,
            }}
          >
            © {new Date().getFullYear()} CCF Consultores
          </p>
        </form>
      </div>
    </div>
  );
}
