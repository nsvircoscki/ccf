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
    const data = montarDados(dados);
    return prisma.$transaction(async (tx) => {
      const cliente = await tx.cliente.create({ data });
      await sincronizarEstadoCivilDoConjuge(tx, cliente);
      return tx.cliente.findUnique({ where: { id: cliente.id }, include: INCLUDE_CONJUGE });
    });
  },

  async atualizar(id, dados) {
    const cliente = await prisma.cliente.findUnique({ where: { id } });
    if (!cliente) throw new Error('Cliente não encontrado.');

    const data = montarDados(dados);
    return prisma.$transaction(async (tx) => {
      const atualizado = await tx.cliente.update({ where: { id }, data });
      await sincronizarEstadoCivilDoConjuge(tx, atualizado);
      return tx.cliente.findUnique({ where: { id: atualizado.id }, include: INCLUDE_CONJUGE });
    });
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

const ESTADOS_CASADO = ['casado(a)', 'em união estável'];

// Ao marcar outra pessoa já cadastrada como cônjuge, o casamento precisa
// aparecer nos dois cadastros — sem isso, abrir o cadastro do cônjuge direto
// mostraria "solteiro(a)" mesmo estando vinculado. Não mexe no conjugeId do
// outro lado (o vínculo em si já é lido dos dois lados via conjuge/conjugeDe,
// ver resolverConjuge acima) — só alinha o estado civil.
async function sincronizarEstadoCivilDoConjuge(tx, cliente) {
  if (!cliente.conjugeId || !ESTADOS_CASADO.includes(cliente.estadoCivil)) return;

  const conjuge = await tx.cliente.findUnique({ where: { id: cliente.conjugeId } });
  if (!conjuge || ESTADOS_CASADO.includes(conjuge.estadoCivil)) return;

  await tx.cliente.update({
    where: { id: conjuge.id },
    data: { estadoCivil: cliente.estadoCivil },
  });
}

function montarDados(dados) {
  const {
    tipo, nome, documento, rg, orgaoEmissor, rgDataExpedicao, dataNascimento, situacao, telefone, email, logradouro, numero, bairro, cidade, estado, cep, pastaLink,
    representanteLegalNome, representanteLegalCpf, representanteLegalCargo, representanteLegalDataNascimento,
    nacionalidade, estadoCivil, profissao, conjugeId,
  } = dados;

  if (!tipo || (tipo !== 'Física' && tipo !== 'Jurídica')) {
    throw new Error('Informe o tipo do cliente (Física ou Jurídica).');
  }
  if (!nome?.trim()) throw new Error('Informe o nome do cliente.');

  return {
    tipo,
    nome: nome.trim(),
    documento: documento?.trim() || null,
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
    numero: numero || null,
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
