export const chaveData = (data) => `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;
export const hora = (data) => new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(data);
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
// do expediente, então se sobra algum horário "faltante" no dia, é sempre um
// bloco no final da lista — cobre tanto uma ausência total (nenhuma batida)
// quanto parcial (ex.: só faltou o segundo turno, mesmo tendo batido o primeiro).
// Não exige que o horário exato do slot caia dentro do período declarado na
// justificativa: uma justificativa decidida para o dia já é suficiente,
// mesmo que a pessoa não tenha trabalhado nenhum minuto daquele dia.
// Retorna 'Aceita', 'Inválida' (Aceita tem prioridade se houver as duas) ou null.
export function statusJustificativaSlotsFaltantes(justificativas = [], funcionarioId, chaveDia, expectativas = [], totalRegistros = 0) {
  if (totalRegistros >= expectativas.length) return null;

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
// Retorna um array do mesmo tamanho de `expectativas`, cada posição null ou
// a string 'HH:MM' vinda da justificativa.
export function horariosJustificadosFaltantes(totalRegistros = 0, expectativas = [], justificativas = [], funcionarioId, chaveDia) {
  const preenchidos = expectativas.map(() => null);
  if (totalRegistros >= expectativas.length) return preenchidos;

  const justificativaAceita = justificativas.find((justificativa) => justificativa.status === 'Aceita'
    && justificativa.funcionarioId === funcionarioId
    && justificativa.dia === chaveDia) || null;
  if (!justificativaAceita) return preenchidos;

  const primeiroIndice = totalRegistros;
  const ultimoIndice = expectativas.length - 1;

  if (primeiroIndice === ultimoIndice) {
    preenchidos[primeiroIndice] = expectativas[primeiroIndice][0] === 'Entrada' ? justificativaAceita.horaInicio : justificativaAceita.horaFim;
    return preenchidos;
  }

  preenchidos[primeiroIndice] = justificativaAceita.horaInicio;
  preenchidos[ultimoIndice] = justificativaAceita.horaFim;

  return preenchidos;
}

// Junta os cálculos de justificativa usados em toda célula do calendário
// (tela do funcionário e do admin usam exatamente a mesma lógica) para não
// duplicar essas contas em cada arquivo.
export function statusCalendarioDoDia(itens, statusItens, expectativas, justificativas, funcionarioId, chaveDia) {
  const temAtraso = statusItens.includes('Atrasado/Saída Antecipada');
  const statusJustificativaDia = statusJustificativaSlotsFaltantes(justificativas, funcionarioId, chaveDia, expectativas, itens.length);
  const temJustificado = statusItens.includes('Justificado') || Boolean(statusJustificativaDia);
  const temJustificadoPendente = !statusItens.includes('Justificado') && statusJustificativaDia === 'Inválida';
  const horariosPreenchidos = itens.length < expectativas.length
    ? horariosJustificadosFaltantes(itens.length, expectativas, justificativas, funcionarioId, chaveDia)
    : expectativas.map(() => null);
  return { temAtraso, temJustificado, temJustificadoPendente, horariosPreenchidos };
}

export const ehHorista = (funcionario) => Boolean(funcionario?.horista);

const NOME_DIA_CONFIG = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];

// Um funcionário aponta pra um dos padrões fixos (`padraoHorarioId`: 'integral'
// | 'manha' | 'tarde') — ou fica sem nenhum (não designado). `padroes` é o mapa
// vindo do backend: { integral: { dias: { segunda: [...], ... } }, manha: {...}, tarde: {...} }.
// Cada padrão tem os próprios turnos por dia útil (dá pra ter uma sexta mais
// curta, por exemplo); fins de semana não têm turnos definidos. Cada turno
// vira uma Entrada + Saída esperadas; um padrão com 2 turnos naquele dia (ex.:
// Integral, com almoço) gera 4 expectativas, um com 1 turno gera 2. Quem é
// horista ou não tem padrão designado não tem nenhuma expectativa (null) —
// não existe "atrasado" nem "saída antecipada" pra essas pessoas.
export function expectativasDoFuncionario(funcionario, padroes = {}, data = new Date()) {
  if (!funcionario || ehHorista(funcionario)) return null;
  const padrao = funcionario.padraoHorarioId && padroes[funcionario.padraoHorarioId];
  if (!padrao) return null;
  const turnos = padrao.dias?.[NOME_DIA_CONFIG[data.getDay()]];
  if (!Array.isArray(turnos) || !turnos.length) return null;
  return turnos.flatMap((turno) => [['Entrada', turno.entrada], ['Saída', turno.saida]]);
}

// Texto curto pro cabeçalho de cada coluna de padrão de horário na tela de
// Jornada, ex.: "08:00 - 18:00, 1h Almoço" (2 turnos) ou "07:00 - 13:00" (1 turno).
export function descreverTurnos(turnos = []) {
  if (turnos.length === 2) {
    const minutosAlmoco = minutoDoHorario(turnos[1].entrada) - minutoDoHorario(turnos[0].saida);
    const horasAlmoco = minutosAlmoco / 60;
    const textoAlmoco = Number.isInteger(horasAlmoco) ? horasAlmoco : horasAlmoco.toFixed(1);
    return `${turnos[0].entrada} - ${turnos[1].saida}, ${textoAlmoco}h Almoço`;
  }
  if (turnos.length === 1) return `${turnos[0].entrada} - ${turnos[0].saida}`;
  return '';
}

function minutosPrevistos(expectativas = []) {
  let total = 0;
  for (let indice = 0; indice < expectativas.length; indice += 2) {
    if (expectativas[indice + 1]) total += minutoDoHorario(expectativas[indice + 1][1]) - minutoDoHorario(expectativas[indice][1]);
  }
  return total;
}

// Mapeia os registros/expectativas (2 ou 4 posições, conforme 1 ou 2 turnos)
// pras 4 colunas fixas da tabela (Entrada/Intervalo/Retorno/Saída). Com 1
// turno só existe Entrada e Saída — as colunas do meio ficam vazias.
function mapearParaColunas(lista = [], numeroTurnos) {
  if (numeroTurnos >= 2) return [lista[0] ?? null, lista[1] ?? null, lista[2] ?? null, lista[3] ?? null];
  if (numeroTurnos === 1) return [lista[0] ?? null, null, null, lista[1] ?? null];
  return [null, null, null, null];
}

export function statusRegistroComExpectativa(registro, indice, expectativas, justificativas, funcionarioId, chaveDia) {
  if (!expectativas || !expectativas.length) return 'Normal';
  const [tipo, horarioStr] = expectativas[indice % expectativas.length];
  const [horaEsperada, minutoEsperado] = horarioStr.split(':').map(Number);
  const instante = new Date(registro);
  const diferenca = (instante.getHours() * 60 + instante.getMinutes()) - (horaEsperada * 60 + minutoEsperado);
  const foraDoHorario = (tipo === 'Entrada' && diferenca >= 5) || (tipo === 'Saída' && diferenca <= -5);
  if (!foraDoHorario) return 'Normal';
  if (encontrarJustificativaAceita(justificativas, funcionarioId, chaveDia, hora(instante))) return 'Justificado';
  return 'Atrasado/Saída Antecipada';
}

// Funcionário horista (recebe por hora, sem jornada fixa) ou ainda não
// designado a um padrão: não faz sentido comparar as batidas com um horário
// esperado, nem calcular saldo de banco de horas — só contamos o que a
// pessoa efetivamente bateu no dia.
function construirFuncionarioSemExpectativa(funcionario, registrosDia) {
  const [entrada, intervalo, retorno, saida] = registrosDia;
  const total = formatDuracaoEmHorasDePontos(registrosDia);
  let status = 'Ausente';
  if (entrada) status = registrosDia.length % 2 === 0 ? 'Finalizado' : 'Presente';

  return {
    id: funcionario.id,
    nome: funcionario.nome,
    setor: funcionario.setor || 'ENG',
    horista: ehHorista(funcionario),
    padraoHorarioId: null,
    entrada: entrada ? formatHorario(entrada) : '',
    intervalo: intervalo ? formatHorario(intervalo) : '',
    retorno: retorno ? formatHorario(retorno) : '',
    saida: saida ? formatHorario(saida) : '',
    preenchidoPorJustificativa: [false, false, false, false],
    total,
    status,
    atrasouEntrada: false,
    atrasado: false,
    saidaAntecipada: false,
    justificado: false,
    justificadoPendente: false,
    justificativa: 0,
    jornadaPrevista: ehHorista(funcionario) ? 'Horista' : 'Sem padrão',
    jornadaRealizada: total,
    jornadaTipo: 'Sem horário fixo',
    banco: '—',
  };
}

export function buildEngFuncionariosFromStorage(selectedDate = chaveData(new Date()), padroes = {}, cadastro = [], justificativas = [], registrosBackend = {}) {
  try {
    const funcionarios = Array.from(new Map(cadastro.filter((funcionario) => funcionario?.id).map((funcionario) => [funcionario.id, funcionario])).values());
    if (!funcionarios.length) return [];

    return funcionarios.map((funcionario) => {
      const perfil = funcionario.nome;
      const blob = extrairRegistrosFuncionario(registrosBackend, funcionario.id);
      const registrosDia = (blob[selectedDate] || []).map((iso) => new Date(iso)).sort((a, b) => a - b);
      const expectativas = expectativasDoFuncionario(funcionario, padroes, new Date(`${selectedDate}T12:00:00`));
      if (!expectativas) return construirFuncionarioSemExpectativa(funcionario, registrosDia);

      const numeroTurnos = expectativas.length / 2;
      const statusPorIndice = registrosDia.map((registro, indice) => statusRegistroComExpectativa(registro, indice, expectativas, justificativas, funcionario.id, selectedDate));
      const atrasouEntrada = statusPorIndice.some((statusItem, indice) => statusItem === 'Atrasado/Saída Antecipada' && expectativas[indice % expectativas.length][0] === 'Entrada');
      const saiuAntecipado = statusPorIndice.some((statusItem, indice) => statusItem === 'Atrasado/Saída Antecipada' && expectativas[indice % expectativas.length][0] === 'Saída');
      const atrasado = atrasouEntrada || saiuAntecipado;
      const justificadoPorPonto = statusPorIndice.includes('Justificado');
      const statusSlotsFaltantes = statusJustificativaSlotsFaltantes(justificativas, funcionario.id, selectedDate, expectativas, registrosDia.length);
      const foiJustificado = Boolean(justificadoPorPonto || statusSlotsFaltantes);

      // Quando a pessoa termina um turno (número par de batidas) mas o horário
      // do próximo turno já passou (com 30min de tolerância) sem que ela tenha
      // voltado a bater o ponto, tratamos como ausência do restante do dia —
      // do contrário ela ficaria "Presente" pra sempre depois de ir embora.
      const hoje = chaveData(new Date()) === selectedDate;
      const proximoIndice = registrosDia.length;
      const prazoDoProximoPassou = (horarioStr) => {
        if (!hoje) return true;
        const [h, m] = horarioStr.split(':').map(Number);
        return (new Date().getHours() * 60 + new Date().getMinutes()) >= (h * 60 + m + 30);
      };
      const aguardandoNovoTurno = proximoIndice > 0 && proximoIndice % 2 === 0 && proximoIndice < expectativas.length
        && prazoDoProximoPassou(expectativas[proximoIndice][1]);

      let status = 'Ausente';
      if (!registrosDia.length) {
        status = statusSlotsFaltantes ? 'Justificado' : 'Ausente';
      } else if (aguardandoNovoTurno) {
        status = statusSlotsFaltantes ? 'Justificado' : 'Ausente';
      } else if (atrasado) {
        status = 'Atrasado/Saída Antecipada';
      } else if (foiJustificado) {
        status = 'Justificado';
      } else if (registrosDia.length >= expectativas.length) {
        status = 'Finalizado';
      } else {
        status = 'Presente';
      }

      const horariosPreenchidos = horariosJustificadosFaltantes(registrosDia.length, expectativas, justificativas, funcionario.id, selectedDate);
      const [colEntrada, colIntervalo, colRetorno, colSaida] = mapearParaColunas(registrosDia, numeroTurnos);
      const [preenchidoEntrada, preenchidoIntervalo, preenchidoRetorno, preenchidoSaida] = mapearParaColunas(horariosPreenchidos, numeroTurnos);
      const total = formatDuracaoEmHorasDePontos(registrosDia);
      const totalMinutos = getTotalMinutosDePontos(registrosDia);
      // Horas de justificativas aceitas para o dia são creditadas no saldo do
      // banco de horas (a pessoa não perde as horas do período justificado),
      // mas o "Total de horas" continua mostrando apenas o que foi batido de fato.
      const minutosJustificados = justificativas
        .filter((justificativa) => justificativa.status === 'Aceita' && justificativa.funcionarioId === funcionario.id && justificativa.dia === selectedDate)
        .reduce((soma, justificativa) => soma + Math.max(0, minutoDoHorario(justificativa.horaFim) - minutoDoHorario(justificativa.horaInicio)), 0);
      const minutosDaJornada = minutosPrevistos(expectativas);
      const jornadaPrevista = formatMinutos(minutosDaJornada);
      const banco = formatSaldoBanco(totalMinutos + minutosJustificados, minutosDaJornada);

      return {
        id: funcionario.id,
        nome: perfil,
        setor: funcionario.setor || 'ENG',
        padraoHorarioId: funcionario.padraoHorarioId || null,
        entrada: colEntrada ? formatHorario(colEntrada) : (preenchidoEntrada || ''),
        intervalo: colIntervalo ? formatHorario(colIntervalo) : (preenchidoIntervalo || ''),
        retorno: colRetorno ? formatHorario(colRetorno) : (preenchidoRetorno || ''),
        saida: colSaida ? formatHorario(colSaida) : (preenchidoSaida || ''),
        preenchidoPorJustificativa: [!colEntrada && Boolean(preenchidoEntrada), !colIntervalo && Boolean(preenchidoIntervalo), !colRetorno && Boolean(preenchidoRetorno), !colSaida && Boolean(preenchidoSaida)],
        total,
        status,
        atrasouEntrada,
        atrasado,
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
