import { useState } from 'react';
import SisPontoFuncionarioScreen from './sisPonto/SisPontoFuncionario.jsx';
import SisPontoEngAdminScreen from './sisPonto/SisPontoEngAdmin.jsx';
import { podeGerirPonto } from '../utils/permissoes';

// `usuario` = a pessoa logada ({ id, nome, setor }). Todo mundo bate só o
// próprio ponto; quem administra o ponto (ENG e Coordenação) alterna entre o
// painel e o próprio ponto. No celular o App abre direto a tela de bater o
// ponto, então o painel é só no computador.
export default function SisPontoView({ usuario, destino }) {
  // Guarda em qual notificação (destino.ts) a pessoa escolheu "Meu ponto":
  // uma notificação nova (ex.: justificativa) volta para o painel sozinha.
  const [meuPontoEm, setMeuPontoEm] = useState(null);

  if (!podeGerirPonto(usuario?.setor)) {
    return <SisPontoFuncionarioScreen usuario={usuario} destino={destino} />;
  }

  const tsAtual = destino?.ts ?? 0;
  const meuPonto = meuPontoEm !== null && meuPontoEm === tsAtual;
  const botao = (ativo) => ({
    border: 0, borderRadius: 8, padding: '7px 12px', fontSize: 12, fontWeight: 800, cursor: 'pointer',
    background: ativo ? '#1767e8' : 'transparent', color: ativo ? '#fff' : '#405371',
  });

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', gap: 4, padding: '8px 16px', borderBottom: '1px solid #e7edf6', background: '#fff' }}>
        <button type="button" onClick={() => setMeuPontoEm(null)} style={botao(!meuPonto)}>Painel de gestão</button>
        <button type="button" onClick={() => setMeuPontoEm(tsAtual)} style={botao(meuPonto)}>Meu ponto</button>
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        {meuPonto
          ? <SisPontoFuncionarioScreen usuario={usuario} />
          : <SisPontoEngAdminScreen usuarioLogado={usuario.setor} destino={destino} />}
      </div>
    </div>
  );
}
