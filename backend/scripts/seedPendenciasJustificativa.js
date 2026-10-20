// scripts/seedPendenciasJustificativa.js
// Cria uma usuária FALSA (julia.teste / teste123, jornada integral) com vários
// tipos de pendência de justificativa, para ver a tela de Justificativas:
//   - hoje: entrada atrasada;
//   - dias úteis anteriores: volta do almoço depois das 13:00, saída
//     antecipada no almoço, saída esquecida, um dia inteiro sem batida
//     (falta) e uma entrada atrasada com justificativa RECUSADA (botão Refazer).
// Só para o banco de desenvolvimento.
//
// Uso (na pasta backend):
//   node scripts/seedPendenciasJustificativa.js              -> cria (ou recria)
//   node scripts/seedPendenciasJustificativa.js --prazo 168  -> idem, e muda o prazo
//        para justificar (horas). Com o padrão de 48 h, o que é de antes do fim
//        de semana já está vencido e só aparece como "ficaram sem justificativa".
//   node scripts/seedPendenciasJustificativa.js --remover    -> apaga a usuária
//
// O seedPontoFalso.js --remover também a apaga (mesmo domínio @exemplo.test).
import bcrypt from 'bcryptjs';
import { prisma } from '../src/prisma.js';
import { chaveDiaLocal, dataLocalParaUtc, horariosPrevistos } from '../src/services/ponto/sequencia.js';
import { gerarPrevistas } from '../src/services/ponto/batidaService.js';
import {
  listarPadroesHorario, listarJustificativas, criarJustificativa, atualizarJustificativa, excluirJustificativa,
  obterConfigFeriados, obterRegrasPonto, atualizarRegrasPonto,
} from '../src/services/sisPontoService.js';
import { mapaFeriados } from '../src/services/ponto/feriados.js';

const LOGIN = 'julia.teste';
const EMAIL = `${LOGIN}@exemplo.test`;
const NOME = 'Júlia Teste';
const SETOR = 'DES';
const UM_DIA = 24 * 3600 * 1000;
const ADMIN = { id: 'seed', nome: 'seed', setor: 'ENG' };

// Batidas de cada dia útil anterior, do mais recente para o mais antigo
// (jornada integral: 07:40–12:00 / 13:00–17:30, sexta 17:20).
const ROTEIRO = [
  { descricao: 'volta do almoço 13:18', batidas: (fim) => ['07:40', '12:00', '13:18', fim] },
  { descricao: 'saiu para o almoço 11:30', batidas: (fim) => ['07:41', '11:30', '13:00', fim] },
  { descricao: 'esqueceu a saída', batidas: () => ['07:40', '12:00', '13:00'] },
  { descricao: 'falta (nenhuma batida)', batidas: () => [] },
  { descricao: 'entrada 08:10 (justificativa recusada)', batidas: (fim) => ['08:10', '12:00', '13:00', fim], recusada: true },
];

async function remover() {
  const user = await prisma.user.findUnique({ where: { email: EMAIL }, select: { id: true } });
  if (!user) return false;
  for (const j of await listarJustificativas()) {
    if (j.funcionarioId === user.id) await excluirJustificativa(j.id, ADMIN);
  }
  await prisma.pontoBatida.deleteMany({ where: { userId: user.id } });
  await prisma.user.delete({ where: { id: user.id } });
  return true;
}

async function criar() {
  await remover();
  const padroes = await listarPadroesHorario();
  const config = await obterConfigFeriados();
  const agora = new Date();
  const hoje = chaveDiaLocal(agora);

  // Dias úteis anteriores (sem fim de semana nem feriado), do mais recente para trás.
  const anos = [hoje.slice(0, 4), String(Number(hoje.slice(0, 4)) - 1)];
  const feriados = mapaFeriados(anos, config);
  const diasUteis = [];
  for (let t = agora.getTime() - UM_DIA; diasUteis.length < ROTEIRO.length; t -= UM_DIA) {
    const dia = chaveDiaLocal(new Date(t));
    if (horariosPrevistos(padroes.integral, dia).length && !feriados.has(dia)) diasUteis.push(dia);
  }

  const role = await prisma.role.findFirst({ where: { name: SETOR } });
  const user = await prisma.user.create({
    data: {
      name: NOME, email: EMAIL, login: LOGIN,
      password_hash: await bcrypt.hash('teste123', 10),
      roleId: role?.id, registraPonto: true, horista: false, padraoHorarioId: 'integral',
      pontoDesde: dataLocalParaUtc(diasUteis[diasUteis.length - 1], '00:00'),
    },
  });

  const batidas = [];
  const adicionar = (dia, horas) => horas.forEach((hora, i) => {
    const batidoEm = dataLocalParaUtc(dia, hora);
    batidas.push({ clientId: `seed-pend:${dia}:${i}`, userId: user.id, tipo: i % 2 ? 'SAIDA' : 'ENTRADA', batidoEm, recebidoEm: batidoEm, deviceId: 'seed-pendencias', registradoPorId: user.id });
  });

  ROTEIRO.forEach((passo, i) => {
    const dia = diasUteis[i];
    const previstos = horariosPrevistos(padroes.integral, dia);
    adicionar(dia, passo.batidas(previstos[previstos.length - 1].hora));
    console.log(`  ${dia}: ${passo.descricao}`);
  });
  // Hoje: entrada às 07:52 (atrasada), se já passou desse horário.
  if (horariosPrevistos(padroes.integral, hoje).length && dataLocalParaUtc(hoje, '07:52') < agora) {
    adicionar(hoje, ['07:52']);
    console.log(`  ${hoje}: entrada atrasada 07:52 (hoje)`);
  }
  await prisma.pontoBatida.createMany({ data: batidas });

  // Justificativa recusada pelo ENG (aparece com "Refazer").
  const indiceRecusada = ROTEIRO.findIndex((p) => p.recusada);
  const quem = { id: user.id, nome: NOME, setor: SETOR };
  const recusada = await criarJustificativa({ dia: diasUteis[indiceRecusada], horaInicio: '07:40', horaFim: '08:10', tipo: 'esquecimento', motivo: 'Trânsito (seed).' }, quem, { ignorarPrazo: true });
  await atualizarJustificativa(recusada.id, { status: 'Recusada' }, ADMIN);

  // Esquecimento e falta viram horários previstos (pendências "Sem batida").
  await gerarPrevistas();

  const indicePrazo = process.argv.indexOf('--prazo');
  if (indicePrazo > 0) await atualizarRegrasPonto({ prazoJustificativaHoras: Number(process.argv[indicePrazo + 1]) });
  const { prazoJustificativaHoras } = await obterRegrasPonto();

  console.log(`\nLogin: ${LOGIN} / teste123. Prazo para justificar agora: ${prazoJustificativaHoras} h.`);
  if (prazoJustificativaHoras < 24 * 7) {
    console.log('Pendências vencidas aparecem só no aviso "ficaram sem justificativa no prazo".');
    console.log('Para ver todas na lista: rode de novo com --prazo 168 (e volte para 48 depois, na tela ou com --prazo 48).');
  }
  console.log('Para apagar: node scripts/seedPendenciasJustificativa.js --remover');
}

(process.argv.includes('--remover')
  ? remover().then((havia) => console.log(havia ? 'Usuária julia.teste removida.' : 'Nada para remover.'))
  : criar())
  .catch((erro) => { console.error(erro); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
