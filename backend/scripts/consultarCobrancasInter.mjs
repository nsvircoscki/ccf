// Script de diagnóstico — NÃO cria nem emite nada, só consulta (leitura)
// as cobranças já registradas no Inter num intervalo de datas, pra checar
// se uma emissão que deu erro no download do PDF já existe de verdade no
// banco antes de tentar emitir de novo (evita duplicar o boleto).
//
// Rode isso no servidor de PRODUÇÃO (onde estão as credenciais/certificado
// reais), dentro da pasta backend/:
//   node scripts/consultarCobrancasInter.mjs 2026-08-20 2026-08-27
//
// Os dois argumentos são dataInicial e dataFinal (formato AAAA-MM-DD) —
// use um intervalo que cubra o dia em que você tentou emitir o boleto.
import 'dotenv/config';
import { interBoletoService } from '../src/services/interBoletoService.js';

async function main() {
  const [dataInicial, dataFinal] = process.argv.slice(2);
  if (!dataInicial || !dataFinal) {
    console.error('Uso: node scripts/consultarCobrancasInter.mjs <dataInicial> <dataFinal>');
    console.error('Exemplo: node scripts/consultarCobrancasInter.mjs 2026-08-20 2026-08-27');
    process.exit(1);
  }

  const resultado = await interBoletoService.listarCobrancas({ dataInicial, dataFinal });
  console.log(JSON.stringify(resultado, null, 2));
}

main().catch((erro) => {
  console.error('Erro ao consultar:', erro.response?.data || erro.message);
  process.exit(1);
});
