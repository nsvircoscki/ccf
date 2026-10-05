// scripts/seedPontoFalso.js
// Cria usuários FALSOS e algumas semanas de batidas de ponto para testar as
// telas (calendário, banco de horas, revisão do ENG, export da folha).
// Só para o banco de desenvolvimento.
//
// Uso (na pasta backend):
//   node scripts/seedPontoFalso.js            -> cria (ou recria) os dados falsos
//   node scripts/seedPontoFalso.js --remover  -> apaga tudo o que o seed criou
//
// Todos os usuários falsos têm e-mail @exemplo.test e senha "teste123" —
// é por esse domínio que o --remover os encontra. Rodar de novo apaga e
// recria (os dados variam conforme a data de hoje, mas são previsíveis).
import bcrypt from 'bcryptjs';
import { prisma } from '../src/prisma.js';
import { classificarSequencia, chaveDiaLocal, dataLocalParaUtc, horariosPrevistos } from '../src/services/ponto/sequencia.js';
import { gerarPrevistas } from '../src/services/ponto/batidaService.js';
import { listarPadroesHorario, listarJustificativas, criarJustificativa, atualizarJustificativa, excluirJustificativa } from '../src/services/sisPontoService.js';

const DOMINIO = '@exemplo.test';
const SENHA = 'teste123';
const DIAS_DE_HISTORICO = 35;
const UM_DIA = 24 * 3600 * 1000;

// Perfis de comportamento: cada um gera um tipo de situação nas telas.
const PESSOAS = [
  { nome: 'Ana Teste', login: 'ana.teste', setor: 'DES', padrao: 'integral', perfil: 'pontual' },
  { nome: 'Bruno Teste', login: 'bruno.teste', setor: 'DES', padrao: 'integral', perfil: 'atrasa' },
  { nome: 'Carla Teste', login: 'carla.teste', setor: 'TOPO', padrao: 'manha', perfil: 'esquece' },
  { nome: 'Diego Teste', login: 'diego.teste', setor: 'TOPO', padrao: 'tarde', perfil: 'falta' },
  { nome: 'Elisa Teste', login: 'elisa.teste', setor: 'CRD', padrao: 'integral', perfil: 'hora_extra' },
  { nome: 'Fábio Teste', login: 'fabio.teste', setor: 'CRD', padrao: null, horista: true, perfil: 'horista' },
];

// Aleatório com semente: o mesmo dia gera sempre as mesmas batidas.
function aleatorio(semente) {
  let x = 0;
  for (const c of semente) x = (x * 31 + c.charCodeAt(0)) >>> 0;
  return () => {
    x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0;
    return x / 2 ** 32;
  };
}

const somarMinutos = (hora, minutos) => {
  const [h, m] = hora.split(':').map(Number);
  const total = h * 60 + m + Math.round(minutos);
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
};

// Batidas de um dia útil conforme o perfil. Devolve [{ tipo, hora }] (hora local).
function batidasDoDia(pessoa, previstos, rnd, ehUltimoDia) {
  const variar = () => (rnd() - 0.5) * 8; // ±4 min
  let lista = previstos.map((p) => ({ tipo: p.tipo, hora: somarMinutos(p.hora, variar()) }));
  const sorte = rnd();

  if (pessoa.perfil === 'atrasa' && sorte < 0.35) lista[0].hora = somarMinutos(previstos[0].hora, 15 + rnd() * 30);
  if (pessoa.perfil === 'esquece' && sorte < 0.25) lista = lista.slice(0, -1); // esqueceu a saída
  if (pessoa.perfil === 'falta' && sorte < 0.15) return [];
  if (pessoa.perfil === 'hora_extra' && sorte < 0.4) lista[lista.length - 1].hora = somarMinutos(previstos[previstos.length - 1].hora, 45 + rnd() * 75);
  if (pessoa.perfil === 'pontual' && ehUltimoDia) lista = lista.slice(0, -2); // saiu no almoço e não voltou
  return lista;
}

// Horista: horário livre, 4 a 8 horas por dia, em 3 de cada 5 dias úteis.
function batidasHorista(rnd) {
  if (rnd() < 0.4) return [];
  const inicio = somarMinutos('08:00', rnd() * 120);
  return [{ tipo: 'ENTRADA', hora: inicio }, { tipo: 'SAIDA', hora: somarMinutos(inicio, 240 + rnd() * 240) }];
}

async function remover() {
  const usuarios = await prisma.user.findMany({ where: { email: { endsWith: DOMINIO } }, select: { id: true } });
  const ids = usuarios.map((u) => u.id);
  if (!ids.length) {
    console.log('Nenhum usuário falso encontrado.');
    return;
  }
  const quemAdmin = { id: 'seed', nome: 'seed', setor: 'ENG' };
  for (const j of await listarJustificativas()) {
    if (ids.includes(j.funcionarioId)) await excluirJustificativa(j.id, quemAdmin);
  }
  const { count: batidas } = await prisma.pontoBatida.deleteMany({ where: { userId: { in: ids } } });
  await prisma.pontoDispositivo.deleteMany({ where: { deviceId: { startsWith: 'seed-' } } });
  const { count: pessoas } = await prisma.user.deleteMany({ where: { id: { in: ids } } });
  console.log(`Removidos: ${pessoas} usuários falsos e ${batidas} batidas.`);
}

async function criar() {
  await remover();
  const padroes = await listarPadroesHorario();
  const roles = new Map((await prisma.role.findMany()).map((r) => [r.name, r.id]));
  const senha = await bcrypt.hash(SENHA, 10);
  const agora = new Date();
  const hoje = chaveDiaLocal(agora);
  const inicio = new Date(agora.getTime() - DIAS_DE_HISTORICO * UM_DIA);
  const dias = [];
  for (let t = inicio.getTime(); chaveDiaLocal(new Date(t)) < hoje; t += UM_DIA) dias.push(chaveDiaLocal(new Date(t)));
  const ultimoDiaUtil = [...dias].reverse().find((d) => horariosPrevistos(padroes.integral, d).length);

  for (const pessoa of PESSOAS) {
    const user = await prisma.user.create({
      data: {
        name: pessoa.nome,
        email: `${pessoa.login}${DOMINIO}`,
        login: pessoa.login,
        password_hash: senha,
        roleId: roles.get(pessoa.setor),
        registraPonto: true,
        horista: Boolean(pessoa.horista),
        padraoHorarioId: pessoa.padrao,
        pontoDesde: dataLocalParaUtc(dias[0], '00:00'),
      },
    });

    const batidas = [];
    for (const dia of dias) {
      const rnd = aleatorio(`${pessoa.login}:${dia}`);
      const previstos = horariosPrevistos(padroes[pessoa.padrao || 'integral'], dia);
      if (!previstos.length) continue; // fim de semana
      const doDia = pessoa.horista ? batidasHorista(rnd) : batidasDoDia(pessoa, previstos, rnd, dia === ultimoDiaUtil);
      doDia.forEach((b, i) => {
        const batidoEm = dataLocalParaUtc(dia, b.hora);
        // De vez em quando a batida chegou depois (aparelho estava offline).
        const offline = rnd() < 0.1;
        batidas.push({
          clientId: `seed:${pessoa.login}:${dia}:${i}`,
          userId: user.id,
          tipo: b.tipo,
          batidoEm,
          recebidoEm: offline ? new Date(batidoEm.getTime() + (2 + rnd() * 20) * 3600 * 1000) : batidoEm,
          deviceId: `seed-${pessoa.login}`,
          registradoPorId: user.id,
        });
      });
    }
    // Hoje: entrada da manhã já batida (dia em andamento).
    if (!pessoa.horista && horariosPrevistos(padroes[pessoa.padrao], hoje).length) {
      const primeira = horariosPrevistos(padroes[pessoa.padrao], hoje)[0];
      const batidoEm = dataLocalParaUtc(hoje, primeira.hora);
      if (batidoEm < agora) {
        batidas.push({ clientId: `seed:${pessoa.login}:${hoje}:0`, userId: user.id, tipo: 'ENTRADA', batidoEm, recebidoEm: batidoEm, deviceId: `seed-${pessoa.login}`, registradoPorId: user.id });
      }
    }

    await prisma.pontoBatida.createMany({ data: batidas });
    const gravadas = await prisma.pontoBatida.findMany({ where: { userId: user.id } });
    for (const r of classificarSequencia(gravadas)) {
      if (r.inconsistente) {
        await prisma.pontoBatida.update({ where: { clientId: r.clientId }, data: { inconsistente: true, motivoInconsistencia: r.motivoInconsistencia } });
      }
    }
    console.log(`  ${pessoa.nome.padEnd(12)} ${pessoa.setor.padEnd(4)} ${(pessoa.padrao || 'horista').padEnd(8)} ${pessoa.perfil.padEnd(10)} ${batidas.length} batidas`);
    pessoa.id = user.id;
  }

  // Justificativas de exemplo (ficam no sis-ponto.json).
  const carla = PESSOAS.find((p) => p.perfil === 'esquece');
  const bruno = PESSOAS.find((p) => p.perfil === 'atrasa');
  const quem = (p) => ({ id: p.id, nome: p.nome, setor: p.setor });
  const diaRecente = [...dias].reverse().find((d) => horariosPrevistos(padroes.integral, d).length);
  await criarJustificativa({ dia: diaRecente, horaInicio: '12:30', horaFim: '13:00', tipo: 'esquecimento', motivo: 'Esqueci de bater a saída.' }, quem(carla));
  const atestado = await criarJustificativa({ dia: dias.find((d) => horariosPrevistos(padroes.integral, d).length), horaInicio: '08:00', horaFim: '10:00', tipo: 'consulta', motivo: 'Consulta médica (seed).' }, quem(bruno));
  await atualizarJustificativa(atestado.id, { status: 'Aceita' }, { id: 'seed', setor: 'ENG' });

  // Esquecimentos/faltas viram horários previstos para o ENG decidir.
  await gerarPrevistas();
  const previstas = await prisma.pontoBatida.count({ where: { origem: 'PREVISTA', userId: { in: PESSOAS.map((p) => p.id) } } });
  const inconsistentes = await prisma.pontoBatida.count({ where: { inconsistente: true, userId: { in: PESSOAS.map((p) => p.id) } } });

  console.log(`\nPeríodo: ${dias[0]} a ontem (${hoje} com entrada da manhã).`);
  console.log(`Horários previstos (esquecimento/falta) para o ENG decidir: ${previstas}. Batidas inconsistentes: ${inconsistentes}.`);
  console.log(`Login de qualquer um: ${PESSOAS.map((p) => p.login).join(', ')} — senha "${SENHA}".`);
  console.log('Para apagar tudo: node scripts/seedPontoFalso.js --remover');
}

(process.argv.includes('--remover') ? remover() : criar())
  .catch((erro) => { console.error(erro); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
