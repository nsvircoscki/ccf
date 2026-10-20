// Acesso por módulo, por usuário logado. Usado tanto no seletor de módulos
// quanto na Navbar, pra manter os dois sempre de acordo — se um dia essas
// listas divergirem, um dá pra entrar em algo que o outro esconde.
// 'todos' = acesso irrestrito (ENG e DEV têm o mesmo nível de administrador).
const PERMISSOES = {
  ENG: 'todos',
  DEV: 'todos',
  DES: ['dashboard', 'kanban', 'vinculacao', 'gerar-documentos', 'sis-mon', 'cadastro', 'importar-pontos', 'car', 'clientes', 'imoveis', 'tarefas', 'sis-ponto'],
  CRD: ['orcamento', 'cadastro', 'emissao-documentos', 'sis-caixa', 'vinculacao', 'gerar-documentos', 'config', 'dashboard', 'kanban', 'clientes', 'imoveis', 'faturamento', 'tarefas', 'importar-pontos', 'car', 'sis-ponto'],
  TOPO: ['dashboard', 'kanban', 'importar-pontos', 'car', 'sis-ponto'],
  // Administrativo: só bate o próprio ponto.
  ADM: ['sis-ponto'],
};

// Quem administra o ponto (painel no computador: justificativas, pontos a
// revisar, correções, feriados/prazo, folha): ENG e Coordenação.
export const SETORES_GESTAO_PONTO = ['ENG', 'CRD'];
export const podeGerirPonto = (setor) => SETORES_GESTAO_PONTO.includes(setor);

export function temAcessoAoModulo(usuarioLogado, moduloId) {
  const permissao = PERMISSOES[usuarioLogado];
  if (permissao === 'todos') return true;
  if (!permissao) return false;
  return permissao.includes(moduloId);
}
