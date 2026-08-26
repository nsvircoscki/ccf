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

async function emitir(id) {
  const notaFiscal = await prisma.notaFiscal.findUnique({ where: { id } });
  if (!notaFiscal) throw new Error('Nota fiscal não encontrada.');
  if (notaFiscal.status === 'EMITIDO') throw new Error('Essa nota já foi emitida.');

  try {
    const { numeroNfse, linkPrefeitura } = await nfseService.emitirNfse(notaFiscal);

    let caminhoPdf = null;
    try {
      const pdfBuffer = await nfseService.baixarPdf(linkPrefeitura);
      caminhoPdf = path.join(pastaNotas(), `${id}.pdf`);
      fs.writeFileSync(caminhoPdf, pdfBuffer);
    } catch (erroPdf) {
      // A nota já foi emitida com sucesso pela prefeitura mesmo que o
      // download do PDF falhe depois — não desfazemos o EMITIDO por causa
      // disso, só deixamos sem o arquivo local (o link ainda funciona).
      console.error(`Nota ${id} emitida, mas falhou ao baixar o PDF:`, erroPdf.message);
    }

    return prisma.notaFiscal.update({
      where: { id },
      data: { status: 'EMITIDO', numeroNfse, linkPrefeitura, caminhoPdf, erroMensagem: null },
    });
  } catch (erro) {
    const mensagem = erro.response?.data ? JSON.stringify(erro.response.data) : erro.message;
    await prisma.notaFiscal.update({
      where: { id },
      data: { status: 'ERRO', erroMensagem: mensagem.slice(0, 1000) },
    });
    throw new Error(`Falha ao emitir nota fiscal: ${mensagem}`);
  }
}

async function caminhoArquivoPdf(id) {
  const notaFiscal = await prisma.notaFiscal.findUnique({ where: { id } });
  if (!notaFiscal?.caminhoPdf || !fs.existsSync(notaFiscal.caminhoPdf)) {
    throw new Error('PDF ainda não disponível para esta nota fiscal.');
  }
  return { caminho: notaFiscal.caminhoPdf, nome: `nf-${id}.pdf` };
}

export const notaFiscalService = { listar, criar, emitir, caminhoArquivoPdf };
