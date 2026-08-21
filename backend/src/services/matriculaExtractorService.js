// src/services/matriculaExtractorService.js
import { GoogleGenerativeAI } from '@google/generative-ai';

const MODELO = process.env.GEMINI_MATRICULA_MODEL || 'gemini-2.5-flash';

let genAI = null;
function client() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY não configurada no servidor.');
  }
  if (!genAI) genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  return genAI;
}

const PROMPT = `Analise o documento de matrícula/registro de imóvel fornecido e extraia apenas a
"Descrição do Imóvel" (localização, limites, confrontações, área e demais características do
imóvel tal como redigidas no documento). Responda exclusivamente com um JSON no formato:
{ "descricao_imovel": "string" }
Se não encontrar essa descrição no documento, responda com { "descricao_imovel": "" }.`;

export const matriculaExtractorService = {
  async extrairDescricao({ base64, mimeType }) {
    if (!base64 || !mimeType) {
      throw new Error('Arquivo inválido para leitura.');
    }

    const model = client().getGenerativeModel({
      model: MODELO,
      generationConfig: { responseMimeType: 'application/json' },
    });

    const result = await model.generateContent([
      { inlineData: { mimeType, data: base64 } },
      { text: PROMPT },
    ]);

    const texto = result.response.text();
    let dados;
    try {
      dados = JSON.parse(texto);
    } catch {
      throw new Error('Não foi possível interpretar a resposta da IA.');
    }

    return (dados.descricao_imovel || '').trim();
  },
};
