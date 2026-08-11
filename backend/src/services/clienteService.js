// src/services/clienteService.js
import { prisma } from '../prisma.js';

const INCLUDE_CONJUGE = { conjuge: true, conjugeDe: true };

export const clienteService = {
  async listar() {
    return prisma.cliente.findMany({ orderBy: { nome: 'asc' }, include: INCLUDE_CONJUGE });
  },

  async buscarPorId(id) {
    return prisma.cliente.findUnique({ where: { id }, include: INCLUDE_CONJUGE });
  },

  async criar(dados) {
    return prisma.cliente.create({ data: montarDados(dados), include: INCLUDE_CONJUGE });
  },

  async atualizar(id, dados) {
    const cliente = await prisma.cliente.findUnique({ where: { id } });
    if (!cliente) throw new Error('Cliente não encontrado.');

    return prisma.cliente.update({ where: { id }, data: montarDados(dados), include: INCLUDE_CONJUGE });
  },

  async remover(id) {
    const cliente = await prisma.cliente.findUnique({ where: { id } });
    if (!cliente) throw new Error('Cliente não encontrado.');

    await prisma.cliente.delete({ where: { id } });
  },
};

// O cônjuge pode estar em qualquer um dos dois campos, dependendo de qual dos
// dois lados foi editado por último (ver comentário em schema.prisma).
export function resolverConjuge(cliente) {
  return cliente?.conjuge || cliente?.conjugeDe || null;
}

function montarDados(dados) {
  const {
    tipo, nome, documento, rg, orgaoEmissor, rgDataExpedicao, dataNascimento, situacao, telefone, email, logradouro, bairro, cidade, estado, cep, pastaLink,
    representanteLegalNome, representanteLegalCpf, representanteLegalCargo, representanteLegalDataNascimento,
    nacionalidade, estadoCivil, profissao, conjugeId,
  } = dados;

  if (!tipo || (tipo !== 'Física' && tipo !== 'Jurídica')) {
    throw new Error('Informe o tipo do cliente (Física ou Jurídica).');
  }
  if (!nome?.trim()) throw new Error('Informe o nome do cliente.');
  if (!documento?.trim()) throw new Error(tipo === 'Física' ? 'Informe o CPF.' : 'Informe o CNPJ.');
  if (tipo === 'Jurídica' && !representanteLegalNome?.trim()) {
    throw new Error('Informe o nome do representante legal.');
  }
  if (tipo === 'Jurídica' && !representanteLegalCpf?.trim()) {
    throw new Error('Informe o CPF do representante legal.');
  }

  return {
    tipo,
    nome: nome.trim(),
    documento: documento.trim(),
    rg: tipo === 'Física' ? (rg || null) : null,
    orgaoEmissor: tipo ==='Física' ? (orgaoEmissor || null) : null,
    rgDataExpedicao: tipo === 'Física' && rgDataExpedicao ? new Date(rgDataExpedicao) : null,
    dataNascimento: tipo === 'Física' && dataNascimento ? new Date(dataNascimento) : null,
    representanteLegalNome: tipo === 'Jurídica' ? (representanteLegalNome || null) : null,
    representanteLegalCpf: tipo === 'Jurídica' ? (representanteLegalCpf || null) : null,
    representanteLegalCargo: tipo === 'Jurídica' ? (representanteLegalCargo || null) : null,
    representanteLegalDataNascimento: tipo === 'Jurídica' && representanteLegalDataNascimento ? new Date(representanteLegalDataNascimento) : null,
    situacao: tipo === 'Física' ? (situacao || null) : null,
    telefone: telefone || null,
    email: email || null,
    logradouro: logradouro || null,
    bairro: bairro || null,
    cidade: cidade || null,
    estado: estado || null,
    cep: cep || null,
    pastaLink: pastaLink || null,
    // Só fazem sentido para PF — usados na "qualificação completa" dos
    // documentos gerados (ver documentoService.js).
    nacionalidade: tipo === 'Física' ? (nacionalidade || null) : null,
    estadoCivil: tipo === 'Física' ? (estadoCivil || null) : null,
    profissao: tipo === 'Física' ? (profissao || null) : null,
    conjugeId: tipo === 'Física' ? (conjugeId || null) : null,
  };
}
