import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { prisma } from '../prisma.js';
import { nfseService } from './nfseService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PASTA_BASE = process.env.PASTA_FATURAMENTO || path.join(__dirname, '../../faturamento');

function pastaNotas() {
  const caminho = path.join(PASTA_BASE, 'notas');
  fs.mkdirSync(caminho, { recursive: true });
  return caminho;
}

async function excluir(id) {
  const nota = await prisma.notaFiscal.findUnique({ where: { id } });
  if (!nota) throw new Error('Nota fiscal não encontrada.');
  if (nota.status === 'EMITIDO') throw new Error('Não é possível excluir uma nota já emitida.');
  await prisma.notaFiscal.delete({ where: { id } });
}

async function listar({ status, servicoId } = {}) {
  return prisma.notaFiscal.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(servicoId ? { servicoId } : {}),
    },
    orderBy: { created_at: 'desc' },
  });
}

async function criar(dados) {
  if (!dados.empresa) throw new Error('Empresa emissora é obrigatória.');
  if (!dados.nomeCliente || !dados.documentoCliente) {
    throw new Error('Nome e documento do cliente são obrigatórios.');
  }
  if (!dados.valor || !dados.descricao) {
    throw new Error('Valor e descrição são obrigatórios.');
  }

  return prisma.notaFiscal.create({
    data: {
      servicoId: dados.servicoId || null,
      clienteId: dados.clienteId || null,
      empresa: dados.empresa,
      nomeCliente: dados.nomeCliente,
      documentoCliente: dados.documentoCliente,
      logradouro: dados.logradouro || null,
      cep: dados.cep || null,
      cidade: dados.cidade || null,
      valor: Number(dados.valor),
      descricao: dados.descricao,
    },
  });
}

async function baixarESalvarPdf(notaFiscal) {
  try {
    const pdfBuffer = await nfseService.baixarPdf(notaFiscal.linkPrefeitura);
    const caminhoPdf = path.join(pastaNotas(), `${notaFiscal.id}.pdf`);
    fs.writeFileSync(caminhoPdf, pdfBuffer);
    return prisma.notaFiscal.update({ where: { id: notaFiscal.id }, data: { caminhoPdf, erroMensagem: null } });
  } catch (erro) {
    const mensagem = erro.response?.data ? JSON.stringify(erro.response.data) : erro.message;
    return prisma.notaFiscal.update({
      where: { id: notaFiscal.id },
      data: { erroMensagem: `Nota emitida, mas o PDF ainda não ficou pronto: ${mensagem}`.slice(0, 1000) },
    });
  }
}

async function emitir(id) {
  const notaFiscal = await prisma.notaFiscal.findUnique({ where: { id } });
  if (!notaFiscal) throw new Error('Nota fiscal não encontrada.');
  if (notaFiscal.status === 'EMITIDO') throw new Error('Essa nota já foi emitida.');

  let numeroNfse;
  let linkPrefeitura;
  try {
    ({ numeroNfse, linkPrefeitura } = await nfseService.emitirNfse(notaFiscal));
  } catch (erro) {
    const mensagem = erro.response?.data ? JSON.stringify(erro.response.data) : erro.message;
    await prisma.notaFiscal.update({
      where: { id },
      data: { status: 'ERRO', erroMensagem: mensagem.slice(0, 1000) },
    });
    throw new Error(`Falha ao emitir nota fiscal: ${mensagem}`);
  }

  // A prefeitura já aceitou a nota aqui — nunca mais chamamos emitirNfse de
  // novo pra essa nota (evitaria duplicar a NFS-e), só tentamos o PDF.
  const notaEmitida = await prisma.notaFiscal.update({
    where: { id },
    data: { status: 'EMITIDO', numeroNfse, linkPrefeitura, erroMensagem: null },
  });
  return baixarESalvarPdf(notaEmitida);
}

async function tentarBaixarPdf(id) {
  const notaFiscal = await prisma.notaFiscal.findUnique({ where: { id } });
  if (!notaFiscal) throw new Error('Nota fiscal não encontrada.');
  if (notaFiscal.status !== 'EMITIDO' || !notaFiscal.linkPrefeitura) {
    throw new Error('Essa nota ainda não foi emitida.');
  }
  return baixarESalvarPdf(notaFiscal);
}

async function caminhoArquivoPdf(id) {
  const notaFiscal = await prisma.notaFiscal.findUnique({ where: { id } });
  if (!notaFiscal?.caminhoPdf || !fs.existsSync(notaFiscal.caminhoPdf)) {
    throw new Error('PDF ainda não disponível para esta nota fiscal.');
  }
  return { caminho: notaFiscal.caminhoPdf, nome: `nf-${id}.pdf` };
}

export const notaFiscalService = { listar, criar, emitir, tentarBaixarPdf, caminhoArquivoPdf, excluir };
