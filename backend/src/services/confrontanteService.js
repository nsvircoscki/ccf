// src/services/confrontanteService.js
import { prisma } from '../prisma.js';

export const confrontanteService = {
  async listar() {
    return prisma.confrontante.findMany({ orderBy: { nome: 'asc' } });
  },

  async buscarPorId(id) {
    return prisma.confrontante.findUnique({ where: { id } });
  },

  async criar(dados) {
    return prisma.confrontante.create({ data: montarDados(dados) });
  },

  async atualizar(id, dados) {
    const confrontante = await prisma.confrontante.findUnique({ where: { id } });
    if (!confrontante) throw new Error('Confrontante não encontrado.');

    return prisma.confrontante.update({ where: { id }, data: montarDados(dados) });
  },

  async remover(id) {
    const confrontante = await prisma.confrontante.findUnique({ where: { id } });
    if (!confrontante) throw new Error('Confrontante não encontrado.');

    await prisma.confrontante.delete({ where: { id } });
  },
};

function montarDados(dados) {
  const {
    tipo, nome, documento, rg, telefone, email, logradouro, bairro, cidade, estado, cep,
    nacionalidade, estadoCivil, profissao,
  } = dados;

  if (!tipo || (tipo !== 'Física' && tipo !== 'Jurídica')) {
    throw new Error('Informe o tipo do confrontante (Física ou Jurídica).');
  }
  if (!nome?.trim()) throw new Error('Informe o nome do confrontante.');

  return {
    tipo,
    nome: nome.trim(),
    // Documento é opcional aqui — diferente do Cliente, nem sempre o CPF/CNPJ
    // do confrontante é conhecido no momento do cadastro.
    documento: documento?.trim() || null,
    rg: tipo === 'Física' ? (rg || null) : null,
    telefone: telefone || null,
    email: email || null,
    logradouro: logradouro || null,
    bairro: bairro || null,
    cidade: cidade || null,
    estado: estado || null,
    cep: cep || null,
    nacionalidade: tipo === 'Física' ? (nacionalidade || null) : null,
    estadoCivil: tipo === 'Física' ? (estadoCivil || null) : null,
    profissao: tipo === 'Física' ? (profissao || null) : null,
  };
}
