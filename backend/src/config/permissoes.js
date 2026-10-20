// src/config/permissoes.js
// Acesso por módulo, por setor — CÓPIA de frontend/src/utils/permissoes.js.
// O front só esconde as telas; quem garante é o backend (sem isso, alguém do
// TOPO chamava a API de emitir nota fiscal direto, sem passar pela tela).
// Mudou lá, muda aqui também.
const PERMISSOES = {
  ENG: 'todos',
  DEV: 'todos',
  DES: ['dashboard', 'kanban', 'vinculacao', 'sis-mon', 'cadastro', 'importar-pontos', 'clientes', 'imoveis', 'tarefas', 'sis-ponto'],
  CRD: ['orcamento', 'cadastro', 'emissao-documentos', 'sis-caixa', 'vinculacao', 'config', 'dashboard', 'kanban', 'clientes', 'imoveis', 'faturamento', 'tarefas', 'sis-ponto'],
  TOPO: ['dashboard', 'kanban', 'importar-pontos', 'sis-ponto'],
  // Administrativo: só bate o próprio ponto.
  ADM: ['sis-ponto'],
};

// Quem administra o ponto (painel no computador: justificativas, pontos a
// revisar, correções, feriados/prazo, folha): ENG e Coordenação.
export const SETORES_GESTAO_PONTO = ['ENG', 'CRD'];
export const podeGerirPonto = (setor) => SETORES_GESTAO_PONTO.includes(setor);

export function temAcessoAoModulo(setor, moduloId) {
  const permissao = PERMISSOES[setor];
  if (permissao === 'todos') return true;
  if (!permissao) return false;
  return permissao.includes(moduloId);
}

// Uso nas rotas (depois de autenticar): router.post('/', exigirModulo('clientes'), ...).
// Com vários módulos, basta ter acesso a um deles.
export function exigirModulo(...modulos) {
  return (req, res, next) => {
    if (!req.usuario || !modulos.some((m) => temAcessoAoModulo(req.usuario.setor, m))) {
      return res.status(403).json({ error: 'Sem permissão para esta ação.' });
    }
    next();
  };
}
