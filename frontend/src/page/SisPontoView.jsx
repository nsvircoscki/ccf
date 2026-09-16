import SisPontoFuncionarioScreen from './sisPonto/SisPontoFuncionario.jsx';
import SisPontoEngAdminScreen from './sisPonto/SisPontoEngAdmin.jsx';

export default function SisPontoView({ usuarioLogado }) {
  if (usuarioLogado === 'ENG') {
    return <SisPontoEngAdminScreen usuarioLogado={usuarioLogado} />;
  }

  return <SisPontoFuncionarioScreen usuarioLogado={usuarioLogado} />;
}
