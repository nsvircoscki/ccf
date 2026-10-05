// src/services/ponto/sequencia.js
// Regras puras (sem banco) sobre a sequência de batidas de UMA pessoa. Usadas
// pelo sync (marcar inconsistências), pelo mapa de registros das telas e pelo
// export CSV pro PC da folha — por isso não podem divergir entre si.

export const PONTO_TZ = process.env.PONTO_TZ || 'America/Sao_Paulo';

// Batidas separadas por mais que isso não formam par (e reiniciam a sequência
// esperada): cobre virada de meia-noite num turno noturno, mas não junta a
// entrada de ontem com a saída de hoje.
export const JANELA_PAR_MS = 16 * 60 * 60 * 1000;

const formatadores = new Map();
function formatador(tz) {
  if (!formatadores.has(tz)) {
    formatadores.set(tz, new Intl.DateTimeFormat('en-US', {
      timeZone: tz, hourCycle: 'h23',
      year: 'numeric', month: 'numeric', day: 'numeric',
      hour: 'numeric', minute: 'numeric', second: 'numeric',
    }));
  }
  return formatadores.get(tz);
}

// Data/hora "de parede" no fuso da empresa — o servidor pode estar em UTC.
export function partesLocais(data, tz = PONTO_TZ) {
  const partes = Object.fromEntries(
    formatador(tz).formatToParts(new Date(data)).filter((p) => p.type !== 'literal').map((p) => [p.type, Number(p.value)]),
  );
  return { ano: partes.year, mes: partes.month, dia: partes.day, hora: partes.hour, minuto: partes.minute, segundo: partes.second };
}

const doisDigitos = (n) => String(n).padStart(2, '0');

export function chaveDiaLocal(data, tz = PONTO_TZ) {
  const p = partesLocais(data, tz);
  return `${p.ano}-${doisDigitos(p.mes)}-${doisDigitos(p.dia)}`;
}

export function chaveMesLocal(data, tz = PONTO_TZ) {
  return chaveDiaLocal(data, tz).slice(0, 7);
}

// Formato da planilha atual (lido pelo calculo.js do Sistema Ponto): M/D/YYYY H:mm:ss.
export function formatarDataPlanilha(data, tz = PONTO_TZ) {
  const p = partesLocais(data, tz);
  return `${p.mes}/${p.dia}/${p.ano} ${p.hora}:${doisDigitos(p.minuto)}:${doisDigitos(p.segundo)}`;
}

const ms = (b) => new Date(b.batidoEm).getTime();
export const ordenarBatidas = (batidas) => [...batidas].sort((a, b) => ms(a) - ms(b) || String(a.clientId).localeCompare(String(b.clientId)));

// Percorre as batidas em ordem esperando ENTRADA, SAIDA, ENTRADA... e marca a
// que quebra a alternância. A batida marcada não é descartada: a sequência
// "ressincroniza" a partir dela (duas entradas seguidas -> espera saída).
// Devolve [{ clientId, inconsistente, motivoInconsistencia }] na mesma ordem.
export function classificarSequencia(batidas) {
  let esperado = 'ENTRADA';
  let anterior = null;
  return ordenarBatidas(batidas).map((batida) => {
    if (anterior && ms(batida) - ms(anterior) > JANELA_PAR_MS) esperado = 'ENTRADA';
    anterior = batida;

    const ok = batida.tipo === esperado;
    esperado = batida.tipo === 'ENTRADA' ? 'SAIDA' : 'ENTRADA';
    if (ok) return { clientId: batida.clientId, inconsistente: false, motivoInconsistencia: null };
    return {
      clientId: batida.clientId,
      inconsistente: true,
      motivoInconsistencia: batida.tipo === 'ENTRADA' ? 'ENTRADA_SEGUIDA' : 'SAIDA_SEM_ENTRADA',
    };
  });
}

// Monta os pares entrada -> saída. Nada some: entrada sem saída e saída sem
// entrada viram "pares" com um lado nulo e observação, pra conferência antes
// de fechar a folha.
// Devolve [{ entrada, saida, observacoes: [] }], entrada/saida = a batida ou null.
export function montarPares(batidas) {
  const pares = [];
  let aberta = null;

  const fecharAberta = () => {
    if (aberta) pares.push({ entrada: aberta, saida: null, observacoes: ['SEM_SAIDA'] });
    aberta = null;
  };

  for (const batida of ordenarBatidas(batidas)) {
    if (aberta && ms(batida) - ms(aberta) > JANELA_PAR_MS) fecharAberta();

    if (batida.tipo === 'ENTRADA') {
      fecharAberta();
      aberta = batida;
    } else if (aberta) {
      pares.push({ entrada: aberta, saida: batida, observacoes: [] });
      aberta = null;
    } else {
      pares.push({ entrada: null, saida: batida, observacoes: ['SEM_ENTRADA'] });
    }
  }
  fecharAberta();

  for (const par of pares) {
    for (const batida of [par.entrada, par.saida]) {
      if (batida?.inconsistente) par.observacoes.push(`INCONSISTENTE:${batida.motivoInconsistencia || 'SEQUENCIA'}`);
    }
    // Horário previsto (pessoa não bateu): a decisão do ENG vai junto.
    const previstas = [par.entrada, par.saida].filter((b) => b?.origem === 'PREVISTA');
    if (previstas.some((b) => b.situacao === 'FALTA')) par.observacoes.push('FALTA');
    else if (previstas.some((b) => !b.situacao || b.situacao === 'PENDENTE')) par.observacoes.push('PREVISTA_PENDENTE');
    else if (previstas.length) par.observacoes.push('PREVISTA_ABONADA');
  }
  return pares;
}

// "YYYY-MM-DD" + "HH:MM" no fuso da empresa -> Date (UTC). Duas passadas
// acertam a hora mesmo se o fuso tiver horário de verão.
export function dataLocalParaUtc(dia, hora, tz = PONTO_TZ) {
  const [ano, mes, d] = dia.split('-').map(Number);
  const [h, m] = hora.split(':').map(Number);
  const alvo = Date.UTC(ano, mes - 1, d, h, m);
  let utc = alvo;
  for (let i = 0; i < 2; i += 1) {
    const p = partesLocais(new Date(utc), tz);
    const visto = Date.UTC(p.ano, p.mes - 1, p.dia, p.hora, p.minuto);
    utc += alvo - visto;
  }
  return new Date(utc);
}

const NOME_DIA = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
export function nomeDiaSemana(dia) {
  const [ano, mes, d] = dia.split('-').map(Number);
  return NOME_DIA[new Date(Date.UTC(ano, mes - 1, d)).getUTCDay()];
}

// Horários da jornada daquele dia: [{ indice, tipo, hora }] (ENTRADA/SAIDA de cada turno).
export function horariosPrevistos(padrao, dia) {
  const turnos = padrao?.dias?.[nomeDiaSemana(dia)];
  if (!Array.isArray(turnos)) return [];
  return turnos.flatMap((turno, i) => [
    { indice: i * 2, tipo: 'ENTRADA', hora: turno.entrada },
    { indice: i * 2 + 1, tipo: 'SAIDA', hora: turno.saida },
  ]);
}

// Quais horários previstos do dia ficaram sem registro (esquecimento, ou
// falta se o dia inteiro ficou vazio). Por tipo, cada registro real cobre UM
// horário previsto, na mesma ordem do dia, escolhendo a combinação mais
// próxima no total. Antes cada registro cobria o previsto mais perto mesmo
// que já coberto: uma saída às 14:30 "cobria" a das 12:00 e a das 17:30
// virava esquecimento — e o ENG abonava uma saída antecipada como se fosse
// esquecimento. Agora a saída das 14:30 cobre a das 17:30 e fica como saída
// antecipada, que o funcionário precisa justificar.
export function horariosSemBatida(previstos, batidasReais, dia, tz = PONTO_TZ) {
  const comData = previstos.map((p) => ({ ...p, em: dataLocalParaUtc(dia, p.hora, tz).getTime() }));
  const faltantes = [];
  for (const tipo of ['ENTRADA', 'SAIDA']) {
    const prev = comData.filter((p) => p.tipo === tipo).sort((a, b) => a.em - b.em);
    const reais = batidasReais.filter((b) => b.tipo === tipo).map((b) => new Date(b.batidoEm).getTime()).sort((a, b) => a - b);
    if (reais.length >= prev.length) continue; // todos cobertos
    // custo[i][j]: menor distância casando os j primeiros registros com i dos primeiros previstos.
    const n = prev.length;
    const m = reais.length;
    const custo = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(Infinity));
    custo[0][0] = 0;
    for (let i = 1; i <= n; i += 1) {
      for (let j = 0; j <= Math.min(i, m); j += 1) {
        const pulando = custo[i - 1][j];
        const casando = j > 0 ? custo[i - 1][j - 1] + Math.abs(prev[i - 1].em - reais[j - 1]) : Infinity;
        custo[i][j] = Math.min(pulando, casando);
      }
    }
    for (let i = n, j = m; i > 0; i -= 1) {
      if (custo[i][j] === custo[i - 1][j]) faltantes.push(prev[i - 1]);
      else j -= 1;
    }
  }
  return faltantes.sort((a, b) => a.indice - b.indice).map((p) => ({ ...p, em: new Date(p.em) }));
}
