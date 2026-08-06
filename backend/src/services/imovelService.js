// src/services/imovelService.js
import { prisma } from '../prisma.js';

const INCLUDE_PADRAO = { proprietario: true, confrontantes: true };

export const imovelService = {
  async listar() {
    return prisma.imovel.findMany({
      include: INCLUDE_PADRAO,
      orderBy: { created_at: 'desc' },
    });
  },

  async buscarPorId(id) {
    return prisma.imovel.findUnique({ where: { id }, include: INCLUDE_PADRAO });
  },

  async criar(dados) {
    const data = await montarDados(dados, 'connect');
    return prisma.imovel.create({ data, include: INCLUDE_PADRAO });
  },

  async atualizar(id, dados) {
    const imovel = await prisma.imovel.findUnique({ where: { id } });
    if (!imovel) throw new Error('Imóvel não encontrado.');

    const data = await montarDados(dados, 'set');
    return prisma.imovel.update({ where: { id }, data, include: INCLUDE_PADRAO });
  },

  async remover(id) {
    const imovel = await prisma.imovel.findUnique({ where: { id } });
    if (!imovel) throw new Error('Imóvel não encontrado.');

    await prisma.imovel.delete({ where: { id } });
  },
};

// modoRelacao: "connect" na criação (não existe "set" para relações no
// create do Prisma) e "set" na edição (troca a lista inteira pela enviada,
// mais simples que calcular o diff de connect/disconnect).
async function montarDados(dados, modoRelacao) {
  const {
    proprietarioId, cartorio, matricula, cns, incra, cib, logradouro, municipio, area, descricao,
    tipoTitulo, confrontanteIds, comarca, zoneamento,
  } = dados;

  if (!proprietarioId) throw new Error('Selecione o cliente proprietário do imóvel.');

  const proprietario = await prisma.cliente.findUnique({ where: { id: proprietarioId } });
  if (!proprietario) throw new Error('Cliente proprietário não encontrado.');

  return {
    proprietarioId,
    cartorio: cartorio || null,
    matricula: matricula || null,
    cns: cns || null,
    incra: incra || null,
    cib: cib || null,
    logradouro: logradouro || null,
    municipio: municipio || null,
    area: area === '' || area == null ? null : Number(String(area).replace(',', '.')),
    descricao: descricao || null,
    tipoTitulo: tipoTitulo || 'matrícula',
    comarca: comarca || null,
    zoneamento: zoneamento || null,
    ...(Array.isArray(confrontanteIds)
      ? { confrontantes: { [modoRelacao]: confrontanteIds.map((id) => ({ id })) } }
      : {}),
  };
}
