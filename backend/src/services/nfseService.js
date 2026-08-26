import axios from 'axios';
import { DOMParser } from '@xmldom/xmldom';
import { NFSE_EMPRESAS } from '../config/nfseEmpresas.js';

const URL_WEBSERVICE = 'https://saobentodosul.atende.net/atende.php?pg=rest&service=WNERestServiceNFSe&cidade=padrao';

// Credenciais de login (CNPJ + senha do portal) por empresa — ficam no
// .env, nunca no código-fonte (diferente dos códigos fiscais em
// nfseEmpresas.js, que não são segredo).
const CREDENCIAIS_LOGIN = {
  TOPOGRAFIA: { cnpj: process.env.NFSE_TOPOGRAFIA_CNPJ, senha: process.env.NFSE_TOPOGRAFIA_SENHA },
  CONSULTORES: { cnpj: process.env.NFSE_CONSULTORES_CNPJ, senha: process.env.NFSE_CONSULTORES_SENHA },
};

function escaparXml(texto) {
  return String(texto || '').replace(/&/g, '&amp;');
}

// Monta o XML no mesmo formato que o script Python já usa — a prefeitura
// espera exatamente essa estrutura de tags.
function montarXml(notaFiscal) {
  const config = NFSE_EMPRESAS[notaFiscal.empresa];
  const cpfCnpjLimpo = (notaFiscal.documentoCliente || '').replace(/\D/g, '');
  const valorStr = notaFiscal.valor.toFixed(2).replace('.', ',');
  const identificador = `NF_${Date.now()}_${notaFiscal.id}`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<nfse>
    <nfse_teste>0</nfse_teste>
    <identificador>${identificador}</identificador>
    <nf>
        <valor_total>${valorStr}</valor_total>
        <valor_desconto>0,00</valor_desconto>
        <valor_ir>0,00</valor_ir>
        <valor_inss>0,00</valor_inss>
        <valor_contribuicao_social>0,00</valor_contribuicao_social>
        <valor_rps>0,00</valor_rps>
        <valor_pis>0,00</valor_pis>
        <valor_cofins>0,00</valor_cofins>
    </nf>
    <prestador>
        <cpfcnpj>${CREDENCIAIS_LOGIN[notaFiscal.empresa].cnpj}</cpfcnpj>
        <cidade>${config.codigoLocalPrestacao}</cidade>
    </prestador>
    <tomador>
        <tipo>${cpfCnpjLimpo.length > 11 ? 'J' : 'F'}</tipo>
        <cpfcnpj>${cpfCnpjLimpo}</cpfcnpj>
        <nome_razao_social>${escaparXml(notaFiscal.nomeCliente).slice(0, 200)}</nome_razao_social>
        <logradouro>${escaparXml(notaFiscal.logradouro).slice(0, 70)}</logradouro>
        <numero_residencia>S/N</numero_residencia>
        <bairro>Centro</bairro>
        <cidade>${config.codigoLocalPrestacao}</cidade>
        <cep>${(notaFiscal.cep || '').replace(/\D/g, '')}</cep>
    </tomador>
    <itens>
        <lista>
            <tributa_municipio_prestador>S</tributa_municipio_prestador>
            <codigo_local_prestacao_servico>${config.codigoLocalPrestacao}</codigo_local_prestacao_servico>
            <codigo_item_lista_servico>${config.codigoItemListaServico}</codigo_item_lista_servico>
            <codigo_nbs>${config.codigoNbs}</codigo_nbs>
            <codigo_atividade>${config.codigoAtividade}</codigo_atividade>
            <descritivo>${escaparXml(notaFiscal.descricao).slice(0, 1000)}</descritivo>
            <aliquota_item_lista_servico>${config.aliquota}</aliquota_item_lista_servico>
            <situacao_tributaria>0</situacao_tributaria>
            <valor_tributavel>${valorStr}</valor_tributavel>
        </lista>
    </itens>
</nfse>`;
}

function textoDaTag(xmlTexto, nomeTag) {
  const doc = new DOMParser().parseFromString(xmlTexto, 'text/xml');
  const elemento = doc.getElementsByTagName(nomeTag)[0];
  return elemento ? elemento.textContent : null;
}

async function emitirNfse(notaFiscal) {
  const login = CREDENCIAIS_LOGIN[notaFiscal.empresa];
  if (!login) throw new Error(`Empresa "${notaFiscal.empresa}" sem credenciais configuradas.`);

  const authBase64 = Buffer.from(`${login.cnpj}:${login.senha}`).toString('base64');
  const xml = montarXml(notaFiscal);

  const formData = new FormData();
  formData.append('xml', new Blob([xml], { type: 'text/xml' }), 'nfse.xml');

  const resposta = await axios.postForm(URL_WEBSERVICE, formData, {
    headers: { Authorization: `Basic ${authBase64}` },
  });

  const texto = resposta.data;
  if (typeof texto !== 'string' || !texto.toLowerCase().includes('00001 - sucesso')) {
    throw new Error(`Prefeitura recusou a nota: ${String(texto).slice(0, 300)}`);
  }

  return {
    numeroNfse: textoDaTag(texto, 'numero_nfse') || 'Desconhecido',
    linkPrefeitura: (textoDaTag(texto, 'link_nfse') || '').replace(/&amp;/g, '&'),
  };
}

async function baixarPdf(linkPrefeitura) {
  const resposta = await axios.get(linkPrefeitura, { responseType: 'arraybuffer' });
  const buffer = Buffer.from(resposta.data);
  if (buffer.slice(0, 4).toString() !== '%PDF') {
    throw new Error('A prefeitura não retornou um PDF válido.');
  }
  return buffer;
}


export const nfseService = { emitirNfse, baixarPdf };
