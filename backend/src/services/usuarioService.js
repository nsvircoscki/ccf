// src/services/usuarioService.js
import bcrypt from 'bcryptjs';
import { prisma } from '../prisma.js';
import { SENHA_MIN, normalizarLogin } from './authService.js';

// Nunca devolve o hash — só se a pessoa já tem senha.
function paraResposta(user) {
  return {
    id: user.id,
    nome: user.name,
    email: user.email,
    login: user.login,
    setor: user.role.name,
    ativo: user.ativo,
    registraPonto: user.registraPonto,
    horista: user.horista,
    temSenha: Boolean(user.password_hash),
  };
}

const normalizarEmail = (email) => String(email || '').trim().toLowerCase();

function validarDados({ nome, email, login }) {
  if (!String(nome || '').trim()) throw new Error('Informe o nome da pessoa.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizarEmail(email))) throw new Error('Informe um e-mail válido.');
  // Digitado no login: curto, sem espaço nem acento, pra não ter dúvida de
  // como se escreve.
  if (!/^[a-z0-9._-]{3,30}$/.test(normalizarLogin(login))) {
    throw new Error('O usuário deve ter de 3 a 30 caracteres: letras sem acento, números, ponto, hífen ou _.');
  }
}

function validarSenha(senha) {
  if (!senha || senha.length < SENHA_MIN) throw new Error(`A senha deve ter pelo menos ${SENHA_MIN} caracteres.`);
}

async function buscarRole(setor) {
  const role = await prisma.role.findUnique({ where: { name: setor } });
  if (!role) throw new Error('Setor inválido.');
  return role;
}

async function garantirLoginLivre(login, idAtual = null) {
  const existente = await prisma.user.findUnique({ where: { login } });
  if (existente && existente.id !== idAtual) throw new Error('Esse nome de usuário já está em uso.');
}

async function garantirEmailLivre(email, idAtual = null) {
  const existente = await prisma.user.findUnique({ where: { email } });
  if (existente && existente.id !== idAtual) throw new Error('Já existe uma pessoa cadastrada com esse e-mail.');
}

async function listar() {
  const usuarios = await prisma.user.findMany({
    include: { role: true },
    orderBy: [{ ativo: 'desc' }, { role: { name: 'asc' } }, { name: 'asc' }],
  });
  return usuarios.map(paraResposta);
}

// A senha inicial é obrigatória e definida por quem cadastra: uma conta sem
// senha pode ser "reivindicada" por qualquer um que a escolha primeiro no
// login (fluxo de primeiro acesso). A pessoa troca depois em "Alterar senha".
async function criar(dados) {
  validarDados(dados);
  validarSenha(dados.senha);

  const email = normalizarEmail(dados.email);
  const login = normalizarLogin(dados.login);
  await garantirEmailLivre(email);
  await garantirLoginLivre(login);
  const role = await buscarRole(dados.setor);

  const user = await prisma.user.create({
    data: {
      name: String(dados.nome).trim(),
      email,
      login,
      roleId: role.id,
      password_hash: await bcrypt.hash(dados.senha, 10),
      registraPonto: dados.registraPonto ?? true,
      horista: dados.horista ?? false,
    },
    include: { role: true },
  });
  return paraResposta(user);
}

// Não existe exclusão: desativar (ativo: false) tira a pessoa do login e corta
// o acesso na hora, mas preserva histórico de Kanban, comentários e ponto.
async function atualizar(id, dados, idQuemEdita) {
  const atual = await prisma.user.findUnique({ where: { id }, include: { role: true } });
  if (!atual) throw new Error('Pessoa não encontrada.');

  validarDados(dados);
  const email = normalizarEmail(dados.email);
  const login = normalizarLogin(dados.login);
  await garantirEmailLivre(email, id);
  await garantirLoginLivre(login, id);
  const role = await buscarRole(dados.setor);

  // Proteções contra se trancar do lado de fora: quem administra não pode
  // desativar a própria conta nem sair do próprio setor (perderia o acesso a
  // esta tela no mesmo instante).
  if (id === idQuemEdita && dados.ativo === false) {
    throw new Error('Você não pode desativar a própria conta.');
  }
  if (id === idQuemEdita && role.name !== atual.role.name) {
    throw new Error('Você não pode mudar o próprio setor — perderia o acesso de administrador.');
  }

  const user = await prisma.user.update({
    where: { id },
    data: {
      name: String(dados.nome).trim(),
      email,
      login,
      roleId: role.id,
      ativo: dados.ativo ?? atual.ativo,
      registraPonto: dados.registraPonto ?? atual.registraPonto,
      horista: dados.horista ?? atual.horista,
    },
    include: { role: true },
  });
  return paraResposta(user);
}

// Esqueceu a senha: o admin define uma nova temporária e passa pra pessoa.
async function definirSenha(id, novaSenha) {
  const atual = await prisma.user.findUnique({ where: { id } });
  if (!atual) throw new Error('Pessoa não encontrada.');
  validarSenha(novaSenha);
  await prisma.user.update({ where: { id }, data: { password_hash: await bcrypt.hash(novaSenha, 10) } });
}

async function listarSetores() {
  const roles = await prisma.role.findMany({ orderBy: { name: 'asc' } });
  return roles.map((r) => r.name);
}

export const usuarioService = { listar, criar, atualizar, definirSenha, listarSetores };
