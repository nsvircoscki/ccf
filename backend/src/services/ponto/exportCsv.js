// src/services/ponto/exportCsv.js
// Gera o CSV no formato da planilha que o Sistema Ponto (PC da folha) já lê.
// O CCF não conhece salário: as colunas monetárias saem vazias/zeradas.
//
// Atenção: no lerCSV.js do Sistema Ponto, "Total Wages" é lido como CÓDIGO DE
// OCORRÊNCIA (0 = normal, 1 esquecimento, 2 atestado, 3 férias, 6 falta...),
// não como dinheiro. Por isso sai "0" (ou 6 quando o ENG marcou falta).
import { montarPares, formatarDataPlanilha, chaveMesLocal, PONTO_TZ } from './sequencia.js';

export const COLUNAS_EXPORT = ['O', 'Name', 'Time In', 'Time Out', 'Total Hours', 'Hourly Wage', 'Total Wages', 'CCF ID', 'Observacao'];

// RFC 4180: aspas quando houver vírgula, aspas ou quebra de linha.
function campoCsv(valor) {
  const texto = valor === null || valor === undefined ? '' : String(valor);
  return /[",\r\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
}

export function formatarCsv(colunas, linhas) {
  const corpo = linhas.map((linha) => colunas.map((coluna) => campoCsv(linha[coluna])).join(','));
  return [colunas.map(campoCsv).join(','), ...corpo].join('\r\n') + '\r\n';
}

// O período de um par é decidido pela entrada (ou pela saída, se não houver
// entrada) — o mesmo critério do calculo.js, que filtra pelo "Time In".
function periodoDoPar(par, tz) {
  const referencia = par.entrada || par.saida;
  return chaveMesLocal(referencia.batidoEm, tz);
}

// usuarios: [{ id, email }]; batidasPorUsuario: Map(userId -> batidas sem as removidas).
// periodos: Set de 'YYYY-MM' a incluir.
export function montarLinhasExport(usuarios, batidasPorUsuario, periodos, tz = PONTO_TZ) {
  const linhas = [];
  for (const usuario of usuarios) {
    const pares = montarPares(batidasPorUsuario.get(usuario.id) || []);
    for (const par of pares) {
      if (!periodos.has(periodoDoPar(par, tz))) continue;
      // Falta (decidida pelo ENG) e horário previsto ainda sem decisão não
      // contam horas; falta sai com o código 6 do Sistema Ponto.
      const falta = par.observacoes.includes('FALTA');
      const naoConta = falta || par.observacoes.includes('PREVISTA_PENDENTE');
      const horas = par.entrada && par.saida
        ? (naoConta ? 0 : (new Date(par.saida.batidoEm) - new Date(par.entrada.batidoEm)) / 3600000)
        : null;
      linhas.push({
        O: '',
        Name: String(usuario.email || '').trim().toLowerCase(),
        'Time In': par.entrada ? formatarDataPlanilha(par.entrada.batidoEm, tz) : '',
        'Time Out': par.saida ? formatarDataPlanilha(par.saida.batidoEm, tz) : '',
        'Total Hours': horas === null ? '' : horas.toFixed(2),
        'Hourly Wage': '',
        'Total Wages': falta ? 6 : 0,
        'CCF ID': usuario.id,
        Observacao: par.observacoes.join(';'),
        _ordem: new Date((par.entrada || par.saida).batidoEm).getTime(),
      });
    }
  }
  linhas.sort((a, b) => a.Name.localeCompare(b.Name) || a._ordem - b._ordem);
  return linhas.map(({ _ordem, ...linha }) => linha);
}

// ?mes=YYYY-MM ou ?ano=YYYY -> { periodos, inicio, fim } (fim exclusivo, com
// folga de 1 dia em cada ponta por causa do fuso e de pares na virada do mês).
export function interpretarPeriodo({ mes, ano }) {
  let meses;
  if (typeof mes === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(mes)) {
    meses = [mes];
  } else if (typeof ano === 'string' && /^\d{4}$/.test(ano)) {
    meses = Array.from({ length: 12 }, (_, i) => `${ano}-${String(i + 1).padStart(2, '0')}`);
  } else {
    return null;
  }
  const [anoIni, mesIni] = meses[0].split('-').map(Number);
  const [anoFim, mesFim] = meses[meses.length - 1].split('-').map(Number);
  const umDia = 24 * 3600 * 1000;
  return {
    periodos: new Set(meses),
    inicio: new Date(Date.UTC(anoIni, mesIni - 1, 1) - umDia),
    fim: new Date(Date.UTC(anoFim, mesFim, 1) + umDia),
  };
}
