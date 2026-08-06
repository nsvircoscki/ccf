// src/services/clienteService.js
import { prisma } from '../prisma.js';

export const clienteService = {
  async listar() {
    return prisma.cliente.findMany({ orderBy: { nome: 'asc' } });
  },

  async buscarPorId(id) {
    return prisma.cliente.findUnique({ where: { id } });
  },

  async criar(dados) {
    return prisma.cliente.create({ data: montarDados(dados) });
  },

  async atualizar(id, dados) {
    const cliente = await prisma.cliente.findUnique({ where: { id } });
    if (!cliente) throw new Error('Cliente não encontrado.');

    return prisma.cliente.update({ where: { id }, data: montarDados(dados) });
  },

  async remover(id) {
    const cliente = await prisma.cliente.findUnique({ where: { id } });
    if (!cliente) throw new Error('Cliente não encontrado.');

    await prisma.cliente.delete({ where: { id } });
  },
};

function montarDados(dados) {
  const {
    tipo, nome, documento, rg, orgaoEmissor, situacao, telefone, email, logradouro, bairro, cidade, estado, cep, pastaLink,
    representanteLegalNome, representanteLegalCpf, representanteLegalCargo,
    nacionalidade, estadoCivil, profissao,
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
    representanteLegalNome: tipo === 'Jurídica' ? (representanteLegalNome || null) : null,
    representanteLegalCpf: tipo === 'Jurídica' ? (representanteLegalCpf || null) : null,
    representanteLegalCargo: tipo === 'Jurídica' ? (representanteLegalCargo || null) : null,
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
  };
}
