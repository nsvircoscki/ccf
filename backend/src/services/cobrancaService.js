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

async function excluir(id) {
  //Não permite excluir boletos já emitidos no banco
  const cobranca = await prisma.cobranca.findUnique({
    where: { id },
    include: { parcelas: true }
  });
  if (!cobranca) throw new Error('Cobrança não encontrada.');
  const temEmitido = cobranca.parcelas.some(p => p.status === 'EMITIDO');
    if(temEmitido) throw new Error('Não é possível excluir parcelas de boletos que já foram emitidos');

    await prisma.cobranca.delete({ where: { id } });
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
// O vencimento chega do <input type="date"> como 'AAAA-MM-DD'. new Date() lê
// esse formato como MEIA-NOITE UTC, que no Brasil (UTC-3) é o dia anterior às
// 21h — por isso o boleto de dia 15 aparecia como dia 14 na tela. Gravando ao
// meio-dia UTC, nenhum fuso entre UTC-11 e UTC+12 muda o dia do calendário.
function dataDeVencimento(valor) {
  if (valor instanceof Date) return valor;
  const texto = String(valor).trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(texto) ? new Date(`${texto}T12:00:00.000Z`) : new Date(texto);
}

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
          vencimento: dataDeVencimento(parcela.vencimento),
        })),
      },
    },
    include: { parcelas: { orderBy: { numero: 'asc' } } },
  });
}

// O Inter às vezes ainda está processando a cobrança no momento em que
// tentamos baixar o PDF logo em seguida, e devolve erro nesse passo mesmo
// com o boleto já criado de verdade no banco. Por isso o download vive
// isolado num try/catch próprio: se falhar, a parcela continua EMITIDO
// (o boleto existe) — só falta o arquivo, e dá pra tentar de novo depois
// via tentarBaixarPdf, sem nunca chamar emitirBoleto outra vez pra ela.
async function baixarESalvarPdf(parcela) {
  try {
    const pdfBuffer = await interBoletoService.baixarPdf(parcela.codigoSolicitacao);
    const caminhoPdf = path.join(pastaCobrancas(), `${parcela.id}.pdf`);
    fs.writeFileSync(caminhoPdf, pdfBuffer);
    return prisma.parcelaCobranca.update({
      where: { id: parcela.id },
      data: { caminhoPdf, erroMensagem: null },
    });
  } catch (erro) {
    const mensagem = erro.response?.data ? JSON.stringify(erro.response.data) : erro.message;
    return prisma.parcelaCobranca.update({
      where: { id: parcela.id },
      data: { erroMensagem: `Boleto emitido, mas o PDF ainda não ficou pronto: ${mensagem}`.slice(0, 1000) },
    });
  }
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

  // Se já existe um código de solicitação salvo, o boleto já foi criado de
  // verdade no banco numa tentativa anterior (só o PDF não tinha vindo) —
  // NUNCA chama emitirBoleto de novo nesse caso, ou duplicaria o boleto no
  // Inter. Só tenta buscar o PDF de novo.
  if (parcela.codigoSolicitacao) {
    return baixarESalvarPdf(parcela);
  }

  const seuNumero = parcela.seuNumero || `${cobranca.id.slice(0, 8)}-P${parcela.numero}`;

  let codigoSolicitacao;
  try {
    const resultado = await interBoletoService.emitirBoleto(cobranca, { ...parcela, seuNumero });
    codigoSolicitacao = resultado.codigoSolicitacao;
  } catch (erro) {
    const mensagem = erro.response?.data ? JSON.stringify(erro.response.data) : erro.message;
    await prisma.parcelaCobranca.update({
      where: { id: parcela.id },
      data: { status: 'ERRO', erroMensagem: mensagem.slice(0, 1000) },
    });
    throw new Error(`Falha ao emitir boleto: ${mensagem}`);
  }

  // A partir daqui o boleto JÁ EXISTE de verdade no Inter — salva isso
  // imediatamente, antes de tentar o PDF, pra nunca perder essa referência.
  const parcelaEmitida = await prisma.parcelaCobranca.update({
    where: { id: parcela.id },
    data: { status: 'EMITIDO', seuNumero, codigoSolicitacao, erroMensagem: null },
  });

  return baixarESalvarPdf(parcelaEmitida);
}

// Reemitir o PDF de uma parcela que já está EMITIDO (boleto real já existe
// no banco) mas ficou sem o arquivo — nunca chama a emissão de novo.
async function tentarBaixarPdf(cobrancaId, numeroParcela) {
  const parcela = await prisma.parcelaCobranca.findFirst({
    where: { cobrancaId, numero: Number(numeroParcela) },
  });
  if (!parcela) throw new Error('Parcela não encontrada.');
  if (parcela.status !== 'EMITIDO' || !parcela.codigoSolicitacao) {
    throw new Error('Essa parcela ainda não foi emitida no banco.');
  }
  return baixarESalvarPdf(parcela);
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

export const cobrancaService = { listar, criar, emitirParcela, tentarBaixarPdf, caminhoArquivoPdf, excluir };
