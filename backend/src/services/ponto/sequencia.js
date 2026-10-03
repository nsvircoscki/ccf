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
  }
  return pares;
}
