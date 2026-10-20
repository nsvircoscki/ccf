// scripts/ajustarInicioPonto.js
// O banco de horas só conta a partir do "início do ponto" de cada pessoa
// (User.pontoDesde, gravado quando "Registra ponto" foi ligado). Registros
// lançados em dias anteriores — ex.: correções com os horários de antes de a
// pessoa começar a usar o sistema — ficavam fora do banco. Este script recua
// o início até o primeiro dia com registro (real ou correção).
// Correções novas já fazem isso sozinhas (batidaService.inserirAjuste).
//
// Uso (na pasta backend):
//   node scripts/ajustarInicioPonto.js            -> só mostra o que mudaria
//   node scripts/ajustarInicioPonto.js --aplicar  -> grava
import { prisma } from '../src/prisma.js';
import { chaveDiaLocal, dataLocalParaUtc } from '../src/services/ponto/sequencia.js';
import { gerarPrevistas } from '../src/services/ponto/batidaService.js';

const aplicar = process.argv.includes('--aplicar');

async function main() {
  const usuarios = await prisma.user.findMany({ where: { registraPonto: true }, orderBy: { name: 'asc' } });
  let mudancas = 0;
  for (const usuario of usuarios) {
    const primeiro = await prisma.pontoBatida.findFirst({
      where: { userId: usuario.id, removidoEm: null, origem: { not: 'PREVISTA' } },
      orderBy: { batidoEm: 'asc' },
    });
    if (!primeiro) continue;
    const diaPrimeiro = chaveDiaLocal(primeiro.batidoEm);
    const diaAtual = chaveDiaLocal(usuario.pontoDesde);
    if (diaPrimeiro >= diaAtual) continue;
    mudancas += 1;
    console.log(`  ${usuario.name}: início do ponto ${diaAtual} -> ${diaPrimeiro}`);
    if (aplicar) {
      await prisma.user.update({ where: { id: usuario.id }, data: { pontoDesde: dataLocalParaUtc(diaPrimeiro, '00:00') } });
    }
  }
  if (!mudancas) {
    console.log('Nada a ajustar: ninguém tem registro antes do início do ponto.');
    return;
  }
  if (aplicar) {
    // Dias úteis do novo período sem registro viram "esquecimento" (prazo/ENG decidem).
    await gerarPrevistas();
    console.log(`\n${mudancas} pessoa(s) ajustada(s). O banco de horas já conta esses dias.`);
  } else {
    console.log(`\n${mudancas} pessoa(s) seriam ajustadas. Para gravar: node scripts/ajustarInicioPonto.js --aplicar`);
  }
}

main()
  .catch((erro) => { console.error(erro); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
