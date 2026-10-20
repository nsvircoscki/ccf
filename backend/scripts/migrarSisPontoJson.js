// scripts/migrarSisPontoJson.js
// Leva funcionários e batidas do data/sis-ponto.json para o Postgres:
//   - cada funcionário do JSON é casado com um User (mesmo setor, mesmo nome);
//   - padraoHorarioId vai para o User;
//   - cada horário vira uma PontoBatida (origem LEGADO, tipo alternado no dia);
//   - justificativas passam a apontar para o User.id.
//
// Uso (na pasta backend, COM O BACKEND PARADO — ele também grava o JSON):
//   node scripts/migrarSisPontoJson.js                 -> só mostra o que faria
//   node scripts/migrarSisPontoJson.js --mapa mapa.json -> { "ENG-1727...": "<userId>" } p/ quem não casar pelo nome
//   node scripts/migrarSisPontoJson.js --aplicar        -> grava (faz backup do JSON antes)
// Pode rodar de novo: clientId determinístico + skipDuplicates não duplicam nada.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { prisma } from '../src/prisma.js';
import { classificarSequencia } from '../src/services/ponto/sequencia.js';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ARQUIVO = path.join(RAIZ, 'data', 'sis-ponto.json');
const args = process.argv.slice(2);
const aplicar = args.includes('--aplicar');
const mapaArg = args.includes('--mapa') ? args[args.indexOf('--mapa') + 1] : null;

const normalizarNome = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();

async function main() {
  const store = JSON.parse(fs.readFileSync(ARQUIVO, 'utf8'));
  const funcionarios = store.funcionarios || [];
  const registros = store.registros || {};
  if (!funcionarios.length && !Object.keys(registros).length) {
    console.log('Nada a migrar: o JSON não tem mais "funcionarios" nem "registros".');
    return;
  }

  const mapaManual = mapaArg ? JSON.parse(fs.readFileSync(path.resolve(mapaArg), 'utf8')) : {};
  const users = await prisma.user.findMany({ include: { role: true } });
  const porId = new Map(users.map((u) => [u.id, u]));

  // 1) Casar funcionário do JSON -> User.
  const mapa = new Map();
  const faltando = [];
  console.log('\nFuncionários do JSON -> User');
  for (const f of funcionarios) {
    let user = mapaManual[f.id] ? porId.get(mapaManual[f.id]) : null;
    if (!user) {
      const candidatos = users.filter((u) => u.role.name === f.setor && normalizarNome(u.name) === normalizarNome(f.nome));
      if (candidatos.length === 1) user = candidatos[0];
    }
    if (user) {
      mapa.set(f.id, user);
      const avisos = [];
      if (!user.ativo) avisos.push('User INATIVO');
      if (!user.registraPonto) avisos.push('User com "registra ponto" DESLIGADO');
      if (Boolean(f.horista) !== user.horista) avisos.push(`horista no JSON=${Boolean(f.horista)}, no User=${user.horista} (mantido o do User)`);
      console.log(`  ok  ${f.id}  "${f.nome}" (${f.setor}) -> ${user.id} "${user.name}" <${user.email}>${avisos.length ? '  ⚠ ' + avisos.join('; ') : ''}`);
    } else {
      faltando.push(f);
      console.log(`  ??  ${f.id}  "${f.nome}" (${f.setor}) -> SEM User correspondente`);
    }
  }

  // Registros de ids que nem estão na lista de funcionários também precisam de destino.
  const idsComRegistro = new Set(Object.values(registros).flatMap((dia) => Object.keys(dia || {})));
  for (const id of idsComRegistro) {
    if (!mapa.has(id) && !faltando.some((f) => f.id === id)) {
      if (mapaManual[id] && porId.get(mapaManual[id])) mapa.set(id, porId.get(mapaManual[id]));
      else { faltando.push({ id, nome: '(só tem registros)', setor: '?' }); console.log(`  ??  ${id}  tem registros mas não está na lista de funcionários`); }
    }
  }

  // 2) Montar as batidas.
  const batidas = [];
  for (const [, dia] of Object.entries(registros)) {
    for (const [idAntigo, lista] of Object.entries(dia || {})) {
      const user = mapa.get(idAntigo);
      if (!user) continue;
      [...lista].sort().forEach((iso, i) => {
        batidas.push({
          clientId: `legado:${idAntigo}:${iso}`,
          userId: user.id,
          tipo: i % 2 === 0 ? 'ENTRADA' : 'SAIDA',
          batidoEm: new Date(iso),
          recebidoEm: new Date(iso),
          origem: 'LEGADO',
        });
      });
    }
  }
  const justificativas = (store.justificativas || []).filter((j) => mapa.has(j.funcionarioId));

  console.log(`\nBatidas a importar: ${batidas.length}`);
  console.log(`Justificativas a remapear: ${justificativas.length} de ${(store.justificativas || []).length}`);

  if (faltando.length) {
    console.log(`\n${faltando.length} funcionário(s) sem User. Crie a pessoa em Configurações → Usuários ou passe --mapa arquivo.json`);
    console.log('com { "<id antigo>": "<id do User>" }. Nada foi gravado.');
    process.exitCode = 1;
    return;
  }
  if (!aplicar) {
    console.log('\nDry-run: nada foi gravado. Rode com --aplicar para gravar.');
    return;
  }

  // 3) Gravar.
  const backup = `${ARQUIVO}.bak-${new Date().toISOString().replace(/[:.]/g, '-')}`;
  fs.copyFileSync(ARQUIVO, backup);
  console.log(`\nBackup do JSON: ${backup}`);

  await prisma.$transaction(async (tx) => {
    for (const f of funcionarios) {
      if (f.padraoHorarioId) await tx.user.update({ where: { id: mapa.get(f.id).id }, data: { padraoHorarioId: f.padraoHorarioId } });
    }
    await tx.pontoBatida.createMany({ data: batidas, skipDuplicates: true });

    const userIds = [...new Set(batidas.map((b) => b.userId))];
    for (const userId of userIds) {
      const todas = await tx.pontoBatida.findMany({ where: { userId, removidoEm: null } });
      const porClientId = new Map(todas.map((b) => [b.clientId, b]));
      for (const r of classificarSequencia(todas)) {
        const atual = porClientId.get(r.clientId);
        if (atual.inconsistente !== r.inconsistente || atual.motivoInconsistencia !== r.motivoInconsistencia) {
          await tx.pontoBatida.update({ where: { id: atual.id }, data: { inconsistente: r.inconsistente, motivoInconsistencia: r.motivoInconsistencia } });
        }
      }
    }
  }, { timeout: 120000 });

  // Os dados antigos ficam no JSON com outro nome (nada mais lê), além do backup.
  store.justificativas = (store.justificativas || []).map((j) => (mapa.has(j.funcionarioId)
    ? { ...j, funcionarioIdLegado: j.funcionarioId, funcionarioId: mapa.get(j.funcionarioId).id }
    : j));
  store.funcionariosLegado = funcionarios;
  store.registrosLegado = registros;
  delete store.funcionarios;
  delete store.registros;
  store.migradoParaPostgresEm = new Date().toISOString();
  fs.writeFileSync(ARQUIVO, JSON.stringify(store, null, 2), 'utf8');

  const inconsistentes = await prisma.pontoBatida.count({ where: { origem: 'LEGADO', inconsistente: true } });
  console.log(`Gravado. Batidas legadas marcadas como inconsistentes: ${inconsistentes}.`);
}

main()
  .catch((erro) => { console.error(erro); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
