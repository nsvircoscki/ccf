export const CAR_ETAPAS = [
  'Dados gerais',
  'Porte e vegetação',
  'Histórico, APP e PRA',
  'Relatório final',
];

export function converterHaParaM2(hectares) {
  const valor = String(hectares ?? '').trim().replace(',', '.');
  if (!valor) return '';

  const numero = Number(valor);
  return Number.isFinite(numero) && numero >= 0
    ? String(Number((numero * 10000).toFixed(2)))
    : '';
}

export function converterM2ParaHa(metrosQuadrados) {
  const valor = String(metrosQuadrados ?? '').trim().replace(',', '.');
  if (!valor) return '';

  const numero = Number(valor);
  return Number.isFinite(numero) && numero >= 0
    ? String(Number((numero / 10000).toFixed(6)))
    : '';
}

function parseNumero(valor) {
  const numero = Number(String(valor ?? '').trim().replace(',', '.'));
  return Number.isFinite(numero) ? numero : 0;
}

export function calcularQuantidadeMf(areaTotalHa, moduloFiscalHa) {
  const areaTotal = parseNumero(areaTotalHa);
  const moduloFiscal = parseNumero(moduloFiscalHa);

  if (!Number.isFinite(areaTotal) || !Number.isFinite(moduloFiscal) || moduloFiscal <= 0) {
    return 0;
  }

  return areaTotal / moduloFiscal;
}

export function diagnosticarCar(dados = {}) {
  const areaTotalHa = parseNumero(dados.areaTotalHa);
  const moduloFiscalHa = parseNumero(dados.moduloFiscalHa) || 14;
  const vegetacaoNativaHa = parseNumero(dados.areaVegetacaoNativaHa);
  const areaAppHa = parseNumero(dados.areaAppHa);
  const reservaLegalHa = parseNumero(dados.reservaLegalHa ?? areaTotalHa * 0.2) || 0;
  const quantidadeMf = calcularQuantidadeMf(areaTotalHa, moduloFiscalHa);
  const aoMenos4Mf = quantidadeMf <= 4;

  const areaConsolidada = String(dados.areaConsolidadaAntes2008 ?? 'Não') === 'Sim';
  const passivoReservaLegal = String(dados.passivoReservaLegal ?? 'Não') === 'Sim';
  const passivoApp = String(dados.passivoApp ?? 'Não') === 'Sim';
  const passivoUsoRestrito = String(dados.passivoUsoRestrito ?? 'Não') === 'Sim';
  const aderirPRA = String(dados.aderirPRA ?? 'Não') === 'Sim';

  const enquadramento = aoMenos4Mf
    ? 'Pequena Propriedade / Agricultura Familiar (<= 4 MF)'
    : 'Propriedade acima de 4 Módulos Fiscais';

  const percentualExigido = '20%';
  const regraAplicada = areaConsolidada
    ? 'Isenção de recomposição além do remanescente existente em 22/07/2008 (Art. 67 do Código Florestal).'
    : 'Regra padrão de reserva legal conforme a legislação vigente e o enquadramento do imóvel.';

  const diagnostico = {
    passivoDetectado: passivoReservaLegal || passivoApp || passivoUsoRestrito,
    reservaLegalExigidaHa: reservaLegalHa,
    percentualExigido,
    regraAplicada,
    comoPreencherNoCAR: areaConsolidada
      ? "Declarar a RL na aba 'Reserva Legal' selecionando a opção 'Pequena Propriedade - Área Consolidada'."
      : "Declarar a RL na aba 'Reserva Legal' conforme a situação do remanescente e da consolidação histórica.",
    appEAreasConsolidadas: {
      possuiAreaConsolidada: areaConsolidada,
      comoPreencherNoCAR: "Marcar na aba 'Uso Consolidado' a faixa antropizada pré-2008 ao longo dos cursos d'água.",
    },
  };

  const statusPra = diagnostico.passivoDetectado && aderirPRA
    ? 'Adesão Recomendada'
    : 'Sem necessidade de PRA indicada no diagnóstico';

  const recomendacao = diagnostico.passivoDetectado
    ? 'Foram identificados passivos ambientais. O relatório recomenda revisão estratégica antes do preenchimento no SICAR.'
    : 'Sem passivo detectado no diagnóstico. O preenchimento pode seguir em conformidade direta.';

  return {
    protocoloConsulta: `DIAG-CAR-${String(new Date().getFullYear())}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
    dataEmissao: new Date().toISOString().slice(0, 10),
    resumoImovel: {
      municipioUF: `${dados.municipio || 'Município'} / ${dados.uf || 'UF'}`,
      areaTotalHa: areaTotalHa,
      moduloFiscalHa: moduloFiscalHa,
      quantidadeMF: Number(quantidadeMf.toFixed(2)),
      enquadramento,
    },
    diagnosticoEInstrucoes: {
      reservaLegal: {
        percentualExigido,
        regraAplicada,
        comoPreencherNoCAR: diagnostico.comoPreencherNoCAR,
      },
      appEAreasConsolidadas: {
        possuiAreaConsolidada: areaConsolidada,
        comoPreencherNoCAR: diagnostico.appEAreasConsolidadas.comoPreencherNoCAR,
        areaVegetacaoNativaHa: vegetacaoNativaHa,
        areaAppHa: areaAppHa,
      },
      regularizacaoPRA: {
        status: statusPra,
        beneficios: 'Suspensão de sanções e multas por infrações anteriores a 22/07/2008.',
        proximosPassos: [
          '1. Realizar a inscrição no SICAR com os dados acima.',
          '2. Selecionar a opção “Desejo aderir ao PRA” no momento da transmissão.',
          '3. Aguardar a notificação do órgão ambiental estadual para assinatura do Termo de Compromisso.',
        ],
      },
    },
    recomendacao,
    passivoDetectado: diagnostico.passivoDetectado,
  };
}
