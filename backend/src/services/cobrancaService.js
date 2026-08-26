import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { prisma } from '../prisma.js';
import { interBoletoService } from './interBoletoService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PASTA_BASE = process.env.PASTA_FATURAMENTO || path.join(__dirname, '../../faturamento');

function pastaCobrancas() {
  const caminho = path.join(PASTA_BASE, 'cobrancas');
  fs.mkdirSync(caminho, { recursive: true });
  return caminho;
}

async function listar({ servicoId } = {}) {
  return prisma.cobranca.findMany({
    where: servicoId ? { servicoId } : {},
    include: { parcelas: { orderBy: { numero: 'asc' } } },
    orderBy: { created_at: 'desc' },
  });
}

// Cada parcela vira um boleto emitido individualmente. O frontend já manda a
// divisão calculada (ver FaturamentoView.jsx), mas revalidamos aqui — nunca
// confiar só no que veio do navegador.
async function criar(dados) {
  if (!dados.nomeCliente || !dados.documentoCliente) {
    throw new Error('Nome e documento do cliente são obrigatórios.');
  }
  if (!Array.isArray(dados.parcelas) || dados.parcelas.length === 0) {
    throw new Error('Informe ao menos uma parcela.');
  }
  for (const parcela of dados.parcelas) {
    if (!parcela.valor || !parcela.vencimento) {
      throw new Error('Toda parcela precisa de valor e vencimento.');
    }
  }

  return prisma.cobranca.create({
    data: {
      servicoId: dados.servicoId || null,
      clienteId: dados.clienteId || null,
      nomeCliente: dados.nomeCliente,
      documentoCliente: dados.documentoCliente,
      logradouro: dados.logradouro || null,
      numero: dados.numero || null,
      bairro: dados.bairro || null,
      cidade: dados.cidade || null,
      estado: dados.estado || null,
      cep: dados.cep || null,
      telefone: dados.telefone || null,
      email: dados.email || null,
      descricao: dados.descricao || null,
      instrucoes: dados.instrucoes || null,
      parcelas: {
        create: dados.parcelas.map((parcela, index) => ({
          numero: parcela.numero || index + 1,
          valor: Number(parcela.valor),
          vencimento: new Date(parcela.vencimento),
        })),
      },
    },
    include: { parcelas: { orderBy: { numero: 'asc' } } },
  });
}

async function emitirParcela(cobrancaId, numeroParcela) {
  const cobranca = await prisma.cobranca.findUnique({
    where: { id: cobrancaId },
    include: { parcelas: true },
  });
  if (!cobranca) throw new Error('Cobrança não encontrada.');

  const parcela = cobranca.parcelas.find((p) => p.numero === Number(numeroParcela));
  if (!parcela) throw new Error('Parcela não encontrada.');
  if (parcela.status === 'EMITIDO') throw new Error('Essa parcela já foi emitida.');

  const seuNumero = parcela.seuNumero || `${cobranca.id.slice(0, 8)}-P${parcela.numero}`;

  try {
    const resultado = await interBoletoService.emitirBoleto(cobranca, { ...parcela, seuNumero });
    const codigoSolicitacao = resultado.codigoSolicitacao;

    const pdfBuffer = await interBoletoService.baixarPdf(codigoSolicitacao);
    const caminhoPdf = path.join(pastaCobrancas(), `${parcela.id}.pdf`);
    fs.writeFileSync(caminhoPdf, pdfBuffer);

    return prisma.parcelaCobranca.update({
      where: { id: parcela.id },
      data: { status: 'EMITIDO', seuNumero, codigoSolicitacao, caminhoPdf, erroMensagem: null },
    });
  } catch (erro) {
    const mensagem = erro.response?.data ? JSON.stringify(erro.response.data) : erro.message;
    await prisma.parcelaCobranca.update({
      where: { id: parcela.id },
      data: { status: 'ERRO', erroMensagem: mensagem.slice(0, 1000) },
    });
    throw new Error(`Falha ao emitir boleto: ${mensagem}`);
  }
}

async function caminhoArquivoPdf(cobrancaId, numeroParcela) {
  const parcela = await prisma.parcelaCobranca.findFirst({
    where: { cobrancaId, numero: Number(numeroParcela) },
  });
  if (!parcela?.caminhoPdf || !fs.existsSync(parcela.caminhoPdf)) {
    throw new Error('PDF ainda não disponível para esta parcela.');
  }
  return { caminho: parcela.caminhoPdf, nome: `boleto-${cobrancaId}-parcela-${numeroParcela}.pdf` };
}

export const cobrancaService = { listar, criar, emitirParcela, caminhoArquivoPdf };
