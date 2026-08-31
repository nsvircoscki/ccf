// Acesso por módulo, por usuário logado. Usado tanto no seletor de módulos
// quanto na Navbar, pra manter os dois sempre de acordo — se um dia essas
// listas divergirem, um dá pra entrar em algo que o outro esconde.
// 'todos' = acesso irrestrito (ENG e DEV têm o mesmo nível de administrador).
const PERMISSOES = {
  ENG: 'todos',
  DEV: 'todos',
  DES: ['dashboard', 'kanban', 'vinculacao', 'sis-mon', 'cadastro', 'importar-pontos', 'clientes', 'imoveis', 'tarefas'],
  CRD: ['orcamento', 'cadastro', 'emissao-documentos', 'sis-caixa', 'vinculacao', 'config', 'dashboard', 'kanban', 'clientes', 'imoveis', 'faturamento', 'tarefas'],
  TOPO: ['dashboard', 'kanban', 'importar-pontos'],
};

export function temAcessoAoModulo(usuarioLogado, moduloId) {
  const permissao = PERMISSOES[usuarioLogado];
  if (permissao === 'todos') return true;
  if (!permissao) return false;
  return permissao.includes(moduloId);
}
