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
  // Horário da CCF: 07:40–12:00 e 13:00–17:30 (sexta até 17:20) = 44 h/semana.
  integral: { dias: { ...diasIguais([{ entrada: '07:40', saida: '12:00' }, { entrada: '13:00', saida: '17:30' }]), sexta: [{ entrada: '07:40', saida: '12:00' }, { entrada: '13:00', saida: '17:20' }] } },
  manha: { dias: diasIguais([{ entrada: '07:00', saida: '13:00' }]) },
  tarde: { dias: diasIguais([{ entrada: '13:00', saida: '19:00' }]) },
};

// Motivos padrão de ajuste de ponto (mesma lista do backend em
// services/sisPontoService.js, TIPOS_JUSTIFICATIVA). Em "Outro", a descrição
// por escrito é obrigatória; nos demais ela é opcional.
export const JUSTIFICATIVA_TIPOS = [
  { id: 'esquecimento', nome: 'Esquecimento de marcação' },
  { id: 'falha_registro', nome: 'Falha no sistema ou no aparelho de ponto' },
  { id: 'atraso', nome: 'Atraso' },
  { id: 'levantamento', nome: 'Levantamento' },
  { id: 'atestado', nome: 'Atestado médico' },
  { id: 'consulta', nome: 'Consulta ou exame médico (declaração de comparecimento)' },
  { id: 'falta_justificada', nome: 'Falta justificada (luto, casamento, doação de sangue...)' },
  { id: 'saida_autorizada', nome: 'Saída antecipada autorizada' },
  { id: 'compensacao', nome: 'Compensação de banco de horas' },
  { id: 'outro', nome: 'Outro' },
];

// Motivos que saíram da lista: só pra mostrar o nome em justificativas antigas.
const JUSTIFICATIVA_TIPOS_ANTIGOS = {
  trabalho_externo: 'Trabalho externo / em campo',
  atraso_transporte: 'Atraso por problema no transporte',
  hora_extra: 'Hora extra autorizada',
};

export const rotuloTipoJustificativa = (tipo) => JUSTIFICATIVA_TIPOS.find((item) => item.id === tipo)?.nome || JUSTIFICATIVA_TIPOS_ANTIGOS[tipo] || null;

// Prazo para justificar (horas depois do fim do período), até carregar do backend.
export const PRAZO_JUSTIFICATIVA_PADRAO_HORAS = 48;
