// src/services/authService.js
import bcrypt from 'bcryptjs';
import { prisma } from '../prisma.js';
import { gerarToken } from '../config/jwt.js';

// Exportado: o cadastro de usuários (usuarioService) aplica a mesma regra à
// senha inicial e à redefinida pelo admin.
export const SENHA_MIN = 4;

// Mesma normalização do cadastro (usuarioService): o login é guardado em
// minúsculas, então "Nicolas" e "nicolas" entram na mesma conta.
export const normalizarLogin = (login) => String(login || '').trim().toLowerCase();

// Mesma mensagem pra usuário inexistente e senha errada: a tela de login não
// deve servir pra descobrir quais nomes de usuário existem.
const CREDENCIAIS_INVALIDAS = 'Usuário ou senha incorretos.';

// O que o front guarda da sessão. `setor` continua sendo o que o resto do
// sistema compara como "usuarioLogado" (permissões, Kanban, Minhas Etapas).
function paraSessao(user) {
  return { id: user.id, nome: user.name, setor: user.role.name };
}

// Login digitado (nome de usuário). Pessoa desativada é tratada como
// inexistente.
async function buscarPorLogin(login) {
  const loginNormalizado = normalizarLogin(login);
  if (!loginNormalizado) throw new Error('Informe o usuário.');

  const user = await prisma.user.findUnique({ where: { login: loginNormalizado }, include: { role: true } });
  if (!user || !user.ativo) throw new Error(CREDENCIAIS_INVALIDAS);
  return user;
}

// Para quem já está logado: o id vem do token.
async function buscarUsuarioAtivo(usuarioId) {
  const user = await prisma.user.findUnique({ where: { id: usuarioId }, include: { role: true } });
  if (!user || !user.ativo) throw new Error('Usuário não encontrado.');
  return user;
}

export const authService = {
  async login(login, senha) {
    const user = await buscarPorLogin(login);

    // Conta sem senha (password_hash nulo, contas antigas): antes a própria
    // tela deixava criar a senha só com o login — quem soubesse o nome de
    // usuário tomava a conta. Agora quem define a senha inicial é a
    // administração (Configurações → Usuários); até lá a conta não entra.
    if (!user.password_hash) throw new Error(CREDENCIAIS_INVALIDAS);

    const senhaConfere = await bcrypt.compare(senha || '', user.password_hash);
    if (!senhaConfere) throw new Error(CREDENCIAIS_INVALIDAS);

    return { precisaCriarSenha: false, token: gerarToken(user.id), usuario: paraSessao(user) };
  },

  // Desativado: criar a própria senha só com o login permitia tomar a conta
  // de outra pessoa. A senha inicial agora vem da administração.
  async criarSenha() {
    throw new Error('Peça à administração para definir sua senha inicial (Configurações → Usuários).');
  },

  // Só pra quem já está logado: o usuarioId vem do token (req.usuario), nunca
  // do corpo — senão dava pra trocar a senha de outra pessoa.
  async alterarSenha(usuarioId, senhaAtual, novaSenha) {
    const user = await buscarUsuarioAtivo(usuarioId);
    if (!user.password_hash) throw new Error('Este usuário ainda não tem senha — crie uma primeiro.');

    const senhaConfere = await bcrypt.compare(senhaAtual || '', user.password_hash);
    if (!senhaConfere) throw new Error('Senha atual incorreta.');
    if (!novaSenha || novaSenha.length < SENHA_MIN) throw new Error(`A nova senha deve ter pelo menos ${SENHA_MIN} caracteres.`);

    const hash = await bcrypt.hash(novaSenha, 10);
    await prisma.user.update({ where: { id: user.id }, data: { password_hash: hash } });
  },
};
