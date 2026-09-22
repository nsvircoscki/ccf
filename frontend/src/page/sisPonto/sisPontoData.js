export const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
export const JUSTIFICATIVA_CORES = {
  'Em análise': { fundo: '#fff8ee', texto: '#b9770e', borda: '#ffd8aa' },
  Aceita: { fundo: '#effaf6', texto: '#1f9d63', borda: '#b7f0d6' },
  Recusada: { fundo: '#fff4f3', texto: '#c23b34', borda: '#ffc4bd' },
  Inválida: { fundo: '#fff1e0', texto: '#c2650a', borda: '#ffcf9e' },
};
export const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
export const DIAS_SEMANA_PADRAO = [
  { id: 'segunda', nome: 'Segunda' },
  { id: 'terca', nome: 'Terça' },
  { id: 'quarta', nome: 'Quarta' },
  { id: 'quinta', nome: 'Quinta' },
  { id: 'sexta', nome: 'Sexta' },
];

function diasIguais(turnos) {
  return Object.fromEntries(DIAS_SEMANA_PADRAO.map(({ id }) => [id, turnos.map((turno) => ({ ...turno }))]));
}

// Os 3 padrões de horário fixos da "Alocação de Horários Padrão": cada um tem
// uma lista de turnos (1 ou 2) por dia útil (dá pra ter uma sexta mais curta,
// por exemplo). O admin edita pela tela — isso aqui é só o valor inicial/
// fallback antes de carregar do backend.
export const PADROES_HORARIO_INFO = {
  integral: { id: 'integral', nome: 'Horário Integral' },
  manha: { id: 'manha', nome: 'Horário Manhã' },
  tarde: { id: 'tarde', nome: 'Horário Tarde' },
};
export const PADROES_HORARIO_PADRAO = {
  integral: { dias: diasIguais([{ entrada: '08:00', saida: '12:00' }, { entrada: '13:00', saida: '18:00' }]) },
  manha: { dias: diasIguais([{ entrada: '07:00', saida: '13:00' }]) },
  tarde: { dias: diasIguais([{ entrada: '13:00', saida: '19:00' }]) },
};
