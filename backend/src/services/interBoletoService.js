import fs from 'fs';
import https from 'https';
import path from 'path';
import { fileURLToPath, URLSearchParams } from 'url';
import axios from 'axios';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const CAMINHO_CERT = path.join(__dirname, '../..', process.env.INTER_CERT_PATH || './certs/inter.crt');
const CAMINHO_CHAVE = path.join(__dirname, '../..', process.env.INTER_CHAVE_PATH || './certs/inter.key');

function agenteHttps() {
    return new https.Agent({
        cert: fs.readFileSync(CAMINHO_CERT),
        key: fs.readFileSync(CAMINHO_CHAVE),
    });
}

async function obterToken() {
    const resposta = await axios.post(
        'https://cdpj.partners.bancointer.com.br/oauth/v2/token',
        new URLSearchParams({
            client_id: process.env.INTER_CLIENT_ID,
            client_secret: process.env.INTER_CLIENT_SECRET,
            scope: 'boleto-cobranca.write boleto-cobranca.read',
            grant_type: 'client_credentials',
        }),
        {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            httpsAgent: agenteHttps(),
        }
    );
    return resposta.data.access_token;
}

// Monta o payload no formato que o Inter espera. "cobranca" traz os dados
// do cliente (compartilhados por todas as parcelas) e "parcela" traz o que
// varia por título (valor, vencimento, número do documento) — ver
// cobrancaService.js, que é quem separa isso.
function montarPayload(cobranca, parcela) {
  const cpfLimpo = (cobranca.documentoCliente || '').replace(/\D/g, '');
  return {
    seuNumero: parcela.seuNumero || parcela.id.slice(0, 15),
    valorNominal: parcela.valor,
    dataVencimento: parcela.vencimento.toISOString().slice(0, 10),
    numDiasAgenda: 60,
    multa: { codigo: 'PERCENTUAL', taxa: 2.0 },
    mora: { codigo: 'TAXAMENSAL', taxa: 1.0 },
    mensagem: {
      linha1: (cobranca.descricao || '').slice(0, 78),
      linha2: (cobranca.instrucoes || 'Multa 2% / Juros 1% a.m.').slice(0, 78),
    },
    pagador: {
      tipoPessoa: cpfLimpo.length <= 11 ? 'FISICA' : 'JURIDICA',
      nome: cobranca.nomeCliente.slice(0, 100),
      endereco: (cobranca.logradouro || 'Nao informado').slice(0, 90),
      numero: (cobranca.numero || 'S/N').slice(0, 10),
      bairro: (cobranca.bairro || 'Centro').slice(0, 60),
      cidade: (cobranca.cidade || 'Nao informada').slice(0, 60),
      uf: (cobranca.estado || 'SC').toUpperCase().slice(0, 2),
      cep: (cobranca.cep || '').replace(/\D/g, '') || '89280000',
      email: cobranca.email || '',
      cpfCnpj: cpfLimpo,
    },
  };
}

async function emitirBoleto(cobranca, parcela) {
  const token = await obterToken();
  const resposta = await axios.post(
    'https://cdpj.partners.bancointer.com.br/cobranca/v3/cobrancas',
    montarPayload(cobranca, parcela),
    {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      httpsAgent: agenteHttps(),
    }
  );
  return resposta.data; // contém codigoSolicitacao
}

async function baixarPdf(codigoSolicitacao) {
  const token = await obterToken();
  const resposta = await axios.get(
    `https://cdpj.partners.bancointer.com.br/cobranca/v3/cobrancas/${codigoSolicitacao}/pdf`,
    {
      headers: { Authorization: `Bearer ${token}` },
      httpsAgent: agenteHttps(),
    }
  );
  return Buffer.from(resposta.data.pdf, 'base64');
}

// Consulta (só leitura, não cria nada) as cobranças já registradas no banco
// num intervalo de datas — usado pra checar se uma emissão que "sumiu" no
// nosso sistema (ex: emitiu com sucesso mas o download do PDF falhou antes
// de salvarmos o código) já existe de verdade no Inter, sem precisar
// re-emitir e arriscar duplicar o boleto.
async function listarCobrancas({ dataInicial, dataFinal }) {
  const token = await obterToken();
  const resposta = await axios.get(
    'https://cdpj.partners.bancointer.com.br/cobranca/v3/cobrancas',
    {
      params: { dataInicial, dataFinal },
      headers: { Authorization: `Bearer ${token}` },
      httpsAgent: agenteHttps(),
    }
  );
  return resposta.data;
}

export const interBoletoService = { emitirBoleto, baixarPdf, listarCobrancas };