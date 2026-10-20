// Conserto pontual: a parcela 1/2 do serviço 2026-383 (Raymundo Bráulio
// Pscheidt) foi emitida com sucesso no Banco Inter, mas um bug fazia o
// nosso sistema marcar ERRO e perder o codigoSolicitacao quando o download
// do PDF falhava logo em seguida (já corrigido em cobrancaService.js).
// Este script só atualiza o registro local pra refletir o que já existe de
// verdade no banco — confirmado via scripts/consultarCobrancasInter.mjs — e
// NÃO chama a API do Inter (não cria nada, não duplica nada).
//
// Os IDs abaixo são desse caso específico; não reaproveite o script pra outra
// parcela sem trocá-los.
//
// Rode no servidor de produção, dentro de backend/:
//   node scripts/corrigirParcelaEmitida.mjs
import 'dotenv/config';
import { prisma } from '../src/prisma.js';

const PREFIXO_COBRANCA = '394c20a6'; // início do id da Cobranca, extraído do seuNumero "394c20a6-P1"
const NUMERO_PARCELA = 1;
const CODIGO_SOLICITACAO = 'caa05cd3-9dd7-45ff-ac75-27615681458c';
const SEU_NUMERO = '394c20a6-P1';

async function main() {
  const cobranca = await prisma.cobranca.findFirst({
    where: { id: { startsWith: PREFIXO_COBRANCA } },
    include: { parcelas: true },
  });
  if (!cobranca) {
    console.error(`Nenhuma Cobranca encontrada com id começando em "${PREFIXO_COBRANCA}".`);
    process.exit(1);
  }

  const parcela = cobranca.parcelas.find((p) => p.numero === NUMERO_PARCELA);
  if (!parcela) {
    console.error(`Cobranca ${cobranca.id} encontrada, mas sem parcela número ${NUMERO_PARCELA}.`);
    process.exit(1);
  }

  console.log('Encontrado:', cobranca.nomeCliente, '- parcela', parcela.numero, '- valor', parcela.valor, '- status atual:', parcela.status);

  const atualizada = await prisma.parcelaCobranca.update({
    where: { id: parcela.id },
    data: { status: 'EMITIDO', codigoSolicitacao: CODIGO_SOLICITACAO, seuNumero: SEU_NUMERO, erroMensagem: null },
  });

  console.log('Corrigido! Parcela agora está EMITIDO com codigoSolicitacao salvo:', atualizada);
  console.log('Use o botão "Tentar baixar PDF" na tela do Faturamento pra buscar o arquivo.');
}

main()
  .catch((erro) => { console.error(erro); process.exit(1); })
  .finally(() => prisma.$disconnect());
