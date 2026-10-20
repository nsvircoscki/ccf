// src/services/ponto/feriados.js
// Feriados do ponto (sem rede): os nacionais são calculados aqui; os
// municipais/estaduais e as folgas da empresa vêm da configuração que o ENG
// edita (sis-ponto.json, chave "feriados"). Em dia de feriado a jornada
// prevista é zero: não gera "esquecimento" e quem trabalhar ganha crédito.

// Nacionais de data fixa (Lei 662/1949, 6.802/1980, 14.759/2023 — Consciência Negra).
const NACIONAIS_FIXOS = [
  ['01-01', 'Confraternização Universal'],
  ['04-21', 'Tiradentes'],
  ['05-01', 'Dia do Trabalho'],
  ['09-07', 'Independência do Brasil'],
  ['10-12', 'Nossa Senhora Aparecida'],
  ['11-02', 'Finados'],
  ['11-15', 'Proclamação da República'],
  ['11-20', 'Dia da Consciência Negra'],
  ['12-25', 'Natal'],
];

// Configuração padrão da CCF (São Bento do Sul - SC): trabalha no Carnaval, na
// Quarta de Cinzas e em Corpus Christi (pontos facultativos, não feriados).
// A Data Magna de SC (11/08) é transferida para o domingo seguinte (Lei
// Estadual 18.531/2022), então não tira dia útil e não entra aqui.
export const CONFIG_FERIADOS_PADRAO = {
  carnaval: false,
  corpusChristi: false,
  extras: [
    { data: '09-23', nome: 'Aniversário de São Bento do Sul', tipo: 'municipal' },
  ],
};

// Domingo de Páscoa (algoritmo de Meeus/Jones/Butcher, calendário gregoriano).
export function pascoa(ano) {
  const a = ano % 19;
  const b = Math.floor(ano / 100);
  const c = ano % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31);
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(ano, mes - 1, dia));
}

const chave = (data) => data.toISOString().slice(0, 10);
const somarDias = (data, dias) => new Date(data.getTime() + dias * 24 * 3600 * 1000);

// -> [{ dia: 'YYYY-MM-DD', nome, tipo: 'nacional' | 'facultativo' | 'municipal' | 'estadual' | 'empresa' }]
export function feriadosDoAno(ano, config = CONFIG_FERIADOS_PADRAO) {
  const lista = NACIONAIS_FIXOS.map(([mmdd, nome]) => ({ dia: `${ano}-${mmdd}`, nome, tipo: 'nacional' }));
  const domingoPascoa = pascoa(ano);
  lista.push({ dia: chave(somarDias(domingoPascoa, -2)), nome: 'Sexta-feira Santa', tipo: 'nacional' });
  if (config.carnaval) {
    lista.push({ dia: chave(somarDias(domingoPascoa, -48)), nome: 'Carnaval (segunda)', tipo: 'facultativo' });
    lista.push({ dia: chave(somarDias(domingoPascoa, -47)), nome: 'Carnaval (terça)', tipo: 'facultativo' });
  }
  if (config.corpusChristi) {
    lista.push({ dia: chave(somarDias(domingoPascoa, 60)), nome: 'Corpus Christi', tipo: 'facultativo' });
  }
  for (const extra of config.extras || []) {
    // "MM-DD" repete todo ano; "YYYY-MM-DD" vale só naquele ano.
    if (/^\d{2}-\d{2}$/.test(extra.data)) lista.push({ dia: `${ano}-${extra.data}`, nome: extra.nome, tipo: extra.tipo || 'empresa' });
    else if (extra.data?.startsWith(`${ano}-`)) lista.push({ dia: extra.data, nome: extra.nome, tipo: extra.tipo || 'empresa' });
  }
  const unicos = new Map();
  lista.forEach((f) => { if (!unicos.has(f.dia)) unicos.set(f.dia, f); });
  return [...unicos.values()].sort((a, b) => a.dia.localeCompare(b.dia));
}

// Map('YYYY-MM-DD' -> nome) para os anos de um intervalo de dias.
export function mapaFeriados(anos, config) {
  const mapa = new Map();
  for (const ano of new Set(anos)) feriadosDoAno(Number(ano), config).forEach((f) => mapa.set(f.dia, f.nome));
  return mapa;
}

const TIPOS_EXTRA = ['municipal', 'estadual', 'empresa'];

export function validarConfigFeriados(config) {
  const extras = Array.isArray(config?.extras) ? config.extras : [];
  return {
    carnaval: Boolean(config?.carnaval),
    corpusChristi: Boolean(config?.corpusChristi),
    extras: extras.map((extra) => {
      const data = String(extra?.data || '').trim();
      const nome = String(extra?.nome || '').trim().slice(0, 80);
      if (!/^(\d{4}-)?(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(data)) throw new Error(`Data de feriado inválida: "${data}". Use MM-DD (todo ano) ou AAAA-MM-DD.`);
      if (!nome) throw new Error('Informe o nome do feriado.');
      return { data, nome, tipo: TIPOS_EXTRA.includes(extra?.tipo) ? extra.tipo : 'empresa' };
    }),
  };
}
