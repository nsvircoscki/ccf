// src/services/imovelService.js
import { prisma } from '../prisma.js';
import { cartorioService } from './cartorioService.js';

const INCLUDE_PADRAO = { proprietarios: true, usufrutuarios: true };

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
    const { idsProprietarios, idsUsufrutuarios, ...data } = await montarDados(dados);
    await cartorioService.salvar(data.cns, { cartorio: data.cartorio, comarca: data.comarca });
    return prisma.imovel.create({
      data: {
        ...data,
        proprietarios: { connect: idsProprietarios.map((id) => ({ id })) },
        usufrutuarios: { connect: idsUsufrutuarios.map((id) => ({ id })) },
      },
      include: INCLUDE_PADRAO,
    });
  },

  async atualizar(id, dados) {
    const imovel = await prisma.imovel.findUnique({ where: { id } });
    if (!imovel) throw new Error('Imóvel não encontrado.');

    const { idsProprietarios, idsUsufrutuarios, ...data } = await montarDados(dados);
    await cartorioService.salvar(data.cns, { cartorio: data.cartorio, comarca: data.comarca });
    return prisma.imovel.update({
      where: { id },
      data: {
        ...data,
        proprietarios: { set: idsProprietarios.map((id) => ({ id })) },
        usufrutuarios: { set: idsUsufrutuarios.map((id) => ({ id })) },
      },
      include: INCLUDE_PADRAO,
    });
  },

  async remover(id) {
    const imovel = await prisma.imovel.findUnique({ where: { id } });
    if (!imovel) throw new Error('Imóvel não encontrado.');

    await prisma.imovel.delete({ where: { id } });
  },
};

// Aceita tanto "1234,56" (formato antigo) quanto "1.234,56 m²" (máscara nova
// do front) — remove o sufixo "m²", os pontos de milhar e troca a vírgula
// decimal por ponto antes de converter pra Float.
function parseArea(valor) {
  if (valor === '' || valor == null) return null;
  const limpo = String(valor).replace(/m²/gi, '').trim().replace(/\./g, '').replace(',', '.');
  if (limpo === '') return null;
  const numero = Number(limpo);
  return Number.isFinite(numero) ? numero : null;
}

// proprietarioIds/usufrutuarioIds: tanto o imóvel quanto o usufruto sobre ele
// podem ter mais de uma pessoa (casal, herdeiros em condomínio...) — todos
// entram na qualificação dos documentos.
async function montarDados(dados) {
  const {
    proprietarioIds, cartorio, matricula, cns, incra, cib, logradouro, municipio, estado, area, descricao,
    tipoTitulo, comarca, zoneamento, usufruto, usufrutuarioIds,
  } = dados;

  const idsProprietarios = Array.isArray(proprietarioIds) ? [...new Set(proprietarioIds.filter(Boolean))] : [];
  if (idsProprietarios.length === 0) throw new Error('Selecione ao menos um cliente proprietário do imóvel.');

  const proprietariosEncontrados = await prisma.cliente.findMany({ where: { id: { in: idsProprietarios } } });
  if (proprietariosEncontrados.length !== idsProprietarios.length) {
    throw new Error('Um ou mais clientes proprietários não foram encontrados.');
  }

  const idsUsufrutuariosBrutos = Array.isArray(usufrutuarioIds) ? [...new Set(usufrutuarioIds.filter(Boolean))] : [];
  if (usufruto && idsUsufrutuariosBrutos.length === 0) {
    throw new Error('Selecione ao menos um usufrutuário do imóvel.');
  }
  if (idsUsufrutuariosBrutos.length > 0) {
    const usufrutuariosEncontrados = await prisma.cliente.findMany({ where: { id: { in: idsUsufrutuariosBrutos } } });
    if (usufrutuariosEncontrados.length !== idsUsufrutuariosBrutos.length) {
      throw new Error('Um ou mais clientes usufrutuários não foram encontrados.');
    }
  }
  const idsUsufrutuarios = usufruto ? idsUsufrutuariosBrutos : [];

  return {
    idsProprietarios,
    idsUsufrutuarios,
    cartorio: cartorio || null,
    matricula: matricula || null,
    cns: cns || null,
    incra: incra || null,
    cib: cib || null,
    logradouro: logradouro || null,
    municipio: municipio || null,
    estado: estado || null,
    area: parseArea(area),
    descricao: descricao || null,
    tipoTitulo: tipoTitulo || 'matrícula',
    comarca: comarca || null,
    zoneamento: zoneamento || null,
    usufruto: Boolean(usufruto),
  };
}
