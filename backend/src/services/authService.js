// src/services/authService.js
import bcrypt from 'bcryptjs';
import { prisma } from '../prisma.js';

const SENHA_MIN = 4;

// "nomeUsuario" aqui é o mesmo valor usado no seletor de usuário do login
// (o nome do Role: "ENG", "DES", "TOPO", "CRD") — o resto do sistema já
// trata esse nome como identidade do usuário logado.
async function buscarUsuarioPorRole(nomeUsuario) {
  const role = await prisma.role.findUnique({ where: { name: nomeUsuario } });
  if (!role) throw new Error('Usuário não encontrado.');

  const user = await prisma.user.findFirst({ where: { roleId: role.id } });
  if (!user) throw new Error('Usuário não encontrado.');

  return user;
}

export const authService = {
  // password_hash nulo = usuário ainda não criou a própria senha — o front
  // usa precisaCriarSenha pra decidir entre logar ou abrir o fluxo de criação.
  async login(nomeUsuario, senha) {
    const user = await buscarUsuarioPorRole(nomeUsuario);

    if (!user.password_hash) {
      return { precisaCriarSenha: true };
    }

    const senhaConfere = await bcrypt.compare(senha || '', user.password_hash);
    if (!senhaConfere) throw new Error('Senha incorreta.');

    return { precisaCriarSenha: false };
  },

  async criarSenha(nomeUsuario, novaSenha) {
    const user = await buscarUsuarioPorRole(nomeUsuario);
    if (user.password_hash) throw new Error('Este usuário já tem senha definida — use "Alterar senha".');
    if (!novaSenha || novaSenha.length < SENHA_MIN) throw new Error(`A senha deve ter pelo menos ${SENHA_MIN} caracteres.`);

    const hash = await bcrypt.hash(novaSenha, 10);
    await prisma.user.update({ where: { id: user.id }, data: { password_hash: hash } });
  },

  async alterarSenha(nomeUsuario, senhaAtual, novaSenha) {
    const user = await buscarUsuarioPorRole(nomeUsuario);
    if (!user.password_hash) throw new Error('Este usuário ainda não tem senha — crie uma primeiro.');

    const senhaConfere = await bcrypt.compare(senhaAtual || '', user.password_hash);
    if (!senhaConfere) throw new Error('Senha atual incorreta.');
    if (!novaSenha || novaSenha.length < SENHA_MIN) throw new Error(`A nova senha deve ter pelo menos ${SENHA_MIN} caracteres.`);

    const hash = await bcrypt.hash(novaSenha, 10);
    await prisma.user.update({ where: { id: user.id }, data: { password_hash: hash } });
  },
};
