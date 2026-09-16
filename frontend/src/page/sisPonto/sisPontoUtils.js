import { HORARIOS_PADRAO } from './sisPontoData.js';

export const chaveData = (data) => `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;
export const hora = (data) => new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(data);
export const nomeDiaConfig = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
export const horariosDoDia = (data, configuracao = HORARIOS_PADRAO) => {
  const dia = configuracao[nomeDiaConfig[data.getDay()]] || configuracao.segunda;
  return [['Entrada', dia.entradaManha], ['Saída', dia.saidaManha], ['Entrada', dia.entradaTarde], ['Saída', dia.saidaTarde]];
};
export const minutoDoHorario = (valor) => { const [horaValor, minuto] = valor.split(':').map(Number); return horaValor * 60 + minuto; };

export function formatHorario(data) {
  if (!data) return '';
  return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(data);
}

export function formatDuracaoEmHoras(inicio, fim) {
  if (!inicio || !fim) return '00h00';
  const diffMin = Math.max(0, Math.round((fim - inicio) / 60000));
  const horas = Math.floor(diffMin / 60);
  const minutos = diffMin % 60;
  return `${String(horas).padStart(2, '0')}h${String(minutos).padStart(2, '0')}`;
}

export function getTotalMinutosDePontos(registrosDia = []) {
  if (!registrosDia.length) return 0;

  return registrosDia.reduce((acumulado, _registro, indice, lista) => {
    if (indice % 2 === 0 && lista[indice + 1]) {
      const inicio = new Date(lista[indice]);
      const fim = new Date(lista[indice + 1]);
      const diff = Math.max(0, Math.round((fim - inicio) / 60000));
      return acumulado + diff;
    }
    return acumulado;
  }, 0);
}

export function formatDuracaoEmHorasDePontos(registrosDia = []) {
  const totalMinutos = getTotalMinutosDePontos(registrosDia);
  if (!totalMinutos) return '00h00';

  const horas = Math.floor(totalMinutos / 60);
  const minutos = totalMinutos % 60;
  return `${String(horas).padStart(2, '0')}h${String(minutos).padStart(2, '0')}`;
}

export function jornadaPrevistaTexto(selectedDate = chaveData(new Date())) {
  const data = new Date(`${selectedDate}T12:00:00`);
  const dia = data.getDay();
  if (dia === 5) return '08h40';
  if (dia >= 1 && dia <= 5) return '08h50';
  return '00h00';
}

export function jornadaPrevistaMinutos(selectedDate = chaveData(new Date())) {
  const data = new Date(`${selectedDate}T12:00:00`);
  const dia = data.getDay();
  if (dia === 5) return 8 * 60 + 40;
  if (dia >= 1 && dia <= 5) return 8 * 60 + 50;
  return 0;
}

export function formatSaldoBanco(totalMinutos, jornadaMinutos) {
  const diff = totalMinutos - jornadaMinutos;
  const absoluto = Math.abs(diff);
  const horas = Math.floor(absoluto / 60);
  const minutos = absoluto % 60;
  const sinal = diff >= 0 ? '+' : '-';
  return `${sinal}${String(horas).padStart(2, '0')}h${String(minutos).padStart(2, '0')}`;
}

export function formatMinutos(totalMinutos = 0) {
  const horas = Math.floor(totalMinutos / 60);
  const minutos = totalMinutos % 60;
  return `${String(horas).padStart(2, '0')}h${String(minutos).padStart(2, '0')}`;
}

// Os registros de ponto vêm do backend no formato { "yyyy-mm-dd": { funcionarioId: [iso, iso, ...] } }.
// Esta função recorta apenas os registros de um funcionário específico, no
// mesmo formato de "blob" ({ "yyyy-mm-dd": [iso, iso, ...] }) usado pelo resto da tela.
export function extrairRegistrosFuncionario(registrosBackend = {}, funcionarioId) {
  const blob = {};
  Object.entries(registrosBackend).forEach(([chave, porFuncionario]) => {
    const lista = porFuncionario?.[funcionarioId];
    if (Array.isArray(lista) && lista.length) blob[chave] = lista;
  });
  return blob;
}

// Agrupa os minutos trabalhados do mês em blocos de 7 dias corridos (Semana 01,
// Semana 02...) para exibir no histórico do painel de detalhe do admin.
export function calcularHistoricoSemanal(registrosBlob = {}, mesRef = new Date()) {
  const ano = mesRef.getFullYear();
  const mesIndice = mesRef.getMonth();
  const ultimoDia = new Date(ano, mesIndice + 1, 0).getDate();
  const semanas = [];
  for (let inicio = 1; inicio <= ultimoDia; inicio += 7) {
    const fim = Math.min(inicio + 6, ultimoDia);
    let minutos = 0;
    for (let dia = inicio; dia <= fim; dia += 1) {
      const chave = chaveData(new Date(ano, mesIndice, dia));
      minutos += getTotalMinutosDePontos(registrosBlob[chave] || []);
    }
    semanas.push({
      label: `Semana ${String(semanas.length + 1).padStart(2, '0')} (${String(inicio).padStart(2, '0')}-${String(fim).padStart(2, '0')})`,
      minutos,
      texto: formatMinutos(minutos),
    });
  }
  return semanas;
}

// Uma justificativa "Aceita" (validada) ou "Inválida" (aguardando o
// funcionário refazê-la, mas que continua valendo enquanto isso) cobre um
// registro de ponto quando é do mesmo funcionário, do mesmo dia, e o horário
// do registro cai dentro do período (horaInicio-horaFim) que foi justificado.
// Uma "Recusada" não cobre nada — o dia volta a aparecer normalmente.
export function encontrarJustificativaAceita(justificativas = [], funcionarioId, chaveDia, horaHHMM) {
  if (!horaHHMM) return null;
  const minutos = minutoDoHorario(horaHHMM.slice(0, 5));
  return justificativas.find((justificativa) => (justificativa.status === 'Aceita' || justificativa.status === 'Inválida')
    && justificativa.funcionarioId === funcionarioId
    && justificativa.dia === chaveDia
    && minutos >= minutoDoHorario(justificativa.horaInicio)
    && minutos <= minutoDoHorario(justificativa.horaFim)) || null;
}

// Os registros de ponto de um dia são sempre sequenciais a partir do início
// do expediente (entrada manhã, saída manhã, entrada tarde, saída tarde), então
// se sobra algum horário "faltante" no dia, é sempre um bloco no final da
// lista — cobre tanto uma ausência total (nenhuma batida) quanto parcial
// (ex.: só faltou a tarde, mesmo tendo batido o ponto de manhã).
// Não exige que o horário exato do slot caia dentro do período declarado na
// justificativa: uma justificativa decidida para o dia já é suficiente,
// mesmo que a pessoa não tenha trabalhado nenhum minuto daquele dia.
// Retorna 'Aceita', 'Inválida' (Aceita tem prioridade se houver as duas) ou null.
export function statusJustificativaSlotsFaltantes(justificativas = [], funcionarioId, chaveDia, horariosDia = [], totalRegistros = 0) {
  if (totalRegistros >= horariosDia.length) return null;

  const doDia = justificativas.filter((justificativa) => (justificativa.status === 'Aceita' || justificativa.status === 'Inválida')
    && justificativa.funcionarioId === funcionarioId
    && justificativa.dia === chaveDia);
  if (!doDia.length) return null;
  return doDia.some((justificativa) => justificativa.status === 'Aceita') ? 'Aceita' : 'Inválida';
}

// Quando um trecho do dia não tem batida mas está coberto por uma justificativa
// JÁ APROVADA ("Aceita"), o dashboard e o calendário devem preencher esse
// trecho com o horário definido na própria justificativa, não com um rótulo
// genérico — mesmo que a pessoa não tenha trabalhado nenhum minuto do dia.
// Como os registros de um dia são sempre sequenciais, o trecho sem batida é
// sempre um bloco no final da lista — só as pontas desse bloco (o primeiro e
// o último horário esperado sem batida) recebem o valor da justificativa
// (horaInicio na ponta de entrada, horaFim na de saída); horários no meio de
// um dia inteiro sem nenhuma batida ficam em branco, já que a justificativa
// só define um único intervalo contínuo.
// Retorna um array de 4 posições (uma por horário esperado do dia), cada uma
// null ou a string 'HH:MM' vinda da justificativa.
export function horariosJustificadosFaltantes(totalRegistros = 0, horariosDia = [], justificativas = [], funcionarioId, chaveDia) {
  const preenchidos = [null, null, null, null];
  if (totalRegistros >= horariosDia.length) return preenchidos;

  const justificativaAceita = justificativas.find((justificativa) => justificativa.status === 'Aceita'
    && justificativa.funcionarioId === funcionarioId
    && justificativa.dia === chaveDia) || null;
  if (!justificativaAceita) return preenchidos;

  const primeiroIndice = totalRegistros;
  const ultimoIndice = horariosDia.length - 1;

  if (primeiroIndice === ultimoIndice) {
    preenchidos[primeiroIndice] = horariosDia[primeiroIndice][0] === 'Entrada' ? justificativaAceita.horaInicio : justificativaAceita.horaFim;
    return preenchidos;
  }

  preenchidos[primeiroIndice] = justificativaAceita.horaInicio;
  preenchidos[ultimoIndice] = justificativaAceita.horaFim;

  return preenchidos;
}

// Junta os cálculos de justificativa usados em toda célula do calendário
// (tela do funcionário e do admin usam exatamente a mesma lógica) para não
// duplicar essas contas em cada arquivo.
export function statusCalendarioDoDia(itens, statusItens, horariosDia, justificativas, funcionarioId, chaveDia) {
  const temAtraso = statusItens.includes('Atrasado/Saída Antecipada');
  const statusJustificativaDia = statusJustificativaSlotsFaltantes(justificativas, funcionarioId, chaveDia, horariosDia, itens.length);
  const temJustificado = statusItens.includes('Justificado') || Boolean(statusJustificativaDia);
  const temJustificadoPendente = !statusItens.includes('Justificado') && statusJustificativaDia === 'Inválida';
  const horariosPreenchidos = itens.length < horariosDia.length
    ? horariosJustificadosFaltantes(itens.length, horariosDia, justificativas, funcionarioId, chaveDia)
    : horariosDia.map(() => null);
  return { temAtraso, temJustificado, temJustificadoPendente, horariosPreenchidos };
}

export function buildEngFuncionariosFromStorage(selectedDate = chaveData(new Date()), configuracao = HORARIOS_PADRAO, cadastro = [], justificativas = [], registrosBackend = {}) {
  try {
    const funcionarios = Array.from(new Map(cadastro.filter((funcionario) => funcionario?.id).map((funcionario) => [funcionario.id, funcionario])).values());
    if (!funcionarios.length) return [];

    return funcionarios.map((funcionario) => {
      const perfil = funcionario.nome;
      const blob = extrairRegistrosFuncionario(registrosBackend, funcionario.id);
      const registrosDia = (blob[selectedDate] || []).map((iso) => new Date(iso)).sort((a, b) => a - b);

      const entrada = registrosDia[0] ?? null;
      const intervalo = registrosDia[1] ?? null;
      const retorno = registrosDia[2] ?? null;
      const saida = registrosDia[3] ?? null;
      const horarioDoDia = horariosDoDia(new Date(`${selectedDate}T12:00:00`), configuracao);
      const entradaEsperada = minutoDoHorario(horarioDoDia[0][1]);
      const saidaManhaEsperada = minutoDoHorario(horarioDoDia[1][1]);
      const entradaTardeEsperada = minutoDoHorario(horarioDoDia[2][1]);
      const saidaTardeEsperada = minutoDoHorario(horarioDoDia[3][1]);
      const minutosEntrada = entrada ? entrada.getHours() * 60 + entrada.getMinutes() : null;
      const minutosIntervalo = intervalo ? intervalo.getHours() * 60 + intervalo.getMinutes() : null;
      const minutosRetorno = retorno ? retorno.getHours() * 60 + retorno.getMinutes() : null;
      const minutosSaida = saida ? saida.getHours() * 60 + saida.getMinutes() : null;
      const coberto = (registro) => registro && encontrarJustificativaAceita(justificativas, funcionario.id, selectedDate, formatHorario(registro));
      const entradaJustificada = coberto(entrada);
      const intervaloOuSaidaJustificada = coberto(intervalo) || coberto(saida);
      const retornoJustificado = coberto(retorno);
      const statusSlotsFaltantes = statusJustificativaSlotsFaltantes(justificativas, funcionario.id, selectedDate, horarioDoDia, registrosDia.length);
      const atrasouEntrada = minutosEntrada !== null && minutosEntrada - entradaEsperada >= 5 && !entradaJustificada;
      const saiuAntecipado = (minutosIntervalo !== null && minutosIntervalo - saidaManhaEsperada <= -5 && !coberto(intervalo)) || (minutosSaida !== null && minutosSaida - saidaTardeEsperada <= -5 && !coberto(saida));
      const retornouAtrasado = minutosRetorno !== null && minutosRetorno - entradaTardeEsperada >= 5 && !retornoJustificado;
      const foiJustificado = Boolean(entradaJustificada || intervaloOuSaidaJustificada || retornoJustificado || statusSlotsFaltantes);
      const hoje = chaveData(new Date()) === selectedDate;
      const prazoTardePassou = !hoje || (new Date().getHours() * 60 + new Date().getMinutes() >= entradaTardeEsperada + 30);
      const naoBateuRetornoDaTarde = registrosDia.length >= 2 && !retorno && prazoTardePassou;
      const temSaida = Boolean(saida);

      let status = 'Ausente';
      if (!entrada) {
        status = statusSlotsFaltantes ? 'Justificado' : 'Ausente';
      } else if (naoBateuRetornoDaTarde) {
        status = statusSlotsFaltantes ? 'Justificado' : 'Ausente';
      } else if (atrasouEntrada || saiuAntecipado || retornouAtrasado) {
        status = 'Atrasado/Saída Antecipada';
      } else if (foiJustificado) {
        status = 'Justificado';
      } else if (temSaida) {
        status = 'Finalizado';
      } else {
        status = 'Presente';
      }

      const horariosPreenchidos = horariosJustificadosFaltantes(registrosDia.length, horarioDoDia, justificativas, funcionario.id, selectedDate);
      const total = formatDuracaoEmHorasDePontos(registrosDia);
      const totalMinutos = getTotalMinutosDePontos(registrosDia);
      // Horas de justificativas aceitas para o dia são creditadas no saldo do
      // banco de horas (a pessoa não perde as horas do período justificado),
      // mas o "Total de horas" continua mostrando apenas o que foi batido de fato.
      const minutosJustificados = justificativas
        .filter((justificativa) => justificativa.status === 'Aceita' && justificativa.funcionarioId === funcionario.id && justificativa.dia === selectedDate)
        .reduce((soma, justificativa) => soma + Math.max(0, minutoDoHorario(justificativa.horaFim) - minutoDoHorario(justificativa.horaInicio)), 0);
      const jornadaPrevista = jornadaPrevistaTexto(selectedDate);
      const banco = formatSaldoBanco(totalMinutos + minutosJustificados, jornadaPrevistaMinutos(selectedDate));

      return {
        id: funcionario.id,
        nome: perfil,
        setor: funcionario.setor || 'ENG',
        entrada: entrada ? formatHorario(entrada) : (horariosPreenchidos[0] || ''),
        intervalo: intervalo ? formatHorario(intervalo) : (horariosPreenchidos[1] || ''),
        retorno: retorno ? formatHorario(retorno) : (horariosPreenchidos[2] || ''),
        saida: saida ? formatHorario(saida) : (horariosPreenchidos[3] || ''),
        preenchidoPorJustificativa: [!entrada && Boolean(horariosPreenchidos[0]), !intervalo && Boolean(horariosPreenchidos[1]), !retorno && Boolean(horariosPreenchidos[2]), !saida && Boolean(horariosPreenchidos[3])],
        total,
        status,
        atrasouEntrada,
        atrasado: atrasouEntrada || retornouAtrasado,
        saidaAntecipada: saiuAntecipado,
        justificado: foiJustificado,
        justificadoPendente: statusSlotsFaltantes === 'Inválida',
        justificativa: 0,
        jornadaPrevista,
        jornadaRealizada: total,
        jornadaTipo: 'Jornada prevista',
        banco,
      };
    });
  } catch {
    return [];
  }
}
