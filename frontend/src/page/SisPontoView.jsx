import SisPontoFuncionarioScreen from './sisPonto/SisPontoFuncionario.jsx';
import SisPontoEngAdminScreen from './sisPonto/SisPontoEngAdmin.jsx';

export default function SisPontoView({ usuarioLogado, destino }) {
  if (usuarioLogado === 'ENG') {
    return <SisPontoEngAdminScreen usuarioLogado={usuarioLogado} destino={destino} />;
  }

  return <SisPontoFuncionarioScreen usuarioLogado={usuarioLogado} />;
}
