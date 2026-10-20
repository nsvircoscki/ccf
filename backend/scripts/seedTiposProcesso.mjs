// Semeia TipoProcessoEtapa com o catálogo de etapas que antes vivia fixo em
// workflowService.js (CATALOGO_PROCESSOS/MAPEAMENTO_SETORES). Rodar uma vez
// em qualquer banco (local ou produção) depois de aplicar a migração
// add_tipo_processo_etapa — idempotente: não faz nada se a tabela já tiver
// dados, então é seguro rodar mais de uma vez.
//
// Uso: node scripts/seedTiposProcesso.mjs
import { prisma } from '../src/prisma.js';

const MAPEAMENTO_SETORES = {
  "Aprovação do Orçamento": "ENG",
  "Emissão Contrato": "CRD", "Assinatura Contrato": "CRD", "Conferência Dossiê": "CRD",
  "Envio Faturamento": "CRD", "Agendamento Levantamento": "CRD", "Conferência Pré-Projeto": "CRD",
  "Aprovação do Proprietário": "CRD", "Conferência Projeto": "CRD", "ART / Assinatura Digital": "CRD",
  "Assinatura do Proprietário": "CRD", "Processo Prefeitura": "CRD", "Assinaturas dos Confrontantes": "CRD",
  "Reconhecimento de Assinaturas": "CRD", "Processo Cartório": "CRD", "SIGEF": "CRD",
  "Montagem do Processo para Cartório": "CRD", "Processo RI": "CRD", "Recebimento Taxas": "CRD", "Escritura": "CRD",
  "Nota de Exigências": "CRD", "Entrega do Serviço": "CRD", "Solicitação de Taxas": "CRD",
  "Solicitação de Documentos": "CRD", "Dossiê": "DES", "Pré-aprovação no Sigef": "DES",
  "Faturamento": "DES", "Preparação do Material de Campo": "DES", "Pré-projeto": "DES", "Monografia": "DES", "Confecção de Escritura": "DES",
  "Execução do Projeto": "DES", "Impressão": "DES", "Orgãos Governamentais": "DES", "Montagem do Processo para Prefeitura": "DES", "Atualização IPTU": "DES",
  "Montagem do processo para SIGEF": "DES", "CAR": "DES",
  "Levantamento": "TOPO", "Processamento da Base": "TOPO", "Croqui": "TOPO", "Locação": "TOPO",
  "Revisão Processo": "ENG",
};

const CATALOGO_PROCESSOS = {
  "Retificação": ["Aprovação do Orçamento", "Solicitação de Documentos", "Solicitação de Taxas", "Emissão Contrato", "Assinatura Contrato", "Recebimento Taxas", "Dossiê", "Conferência Dossiê", "Faturamento", "Envio Faturamento", "Preparação do Material de Campo", "Agendamento Levantamento", "Levantamento", "Processamento da Base", "Croqui", "Pré-projeto", "Conferência Pré-Projeto", "Monografia", "Aprovação do Proprietário", "Execução do Projeto", "Conferência Projeto", "Revisão Processo", "ART / Assinatura Digital", "Impressão", "Assinatura do Proprietário", "Orgãos Governamentais", "Montagem do Processo para Prefeitura", "Processo Prefeitura", "Assinaturas dos Confrontantes", "Reconhecimento de Assinaturas", "Montagem do Processo para Cartório", "Processo RI", "Nota de Exigências", "Entrega do Serviço"],
  "Desmembramento": ["Aprovação do Orçamento", "Solicitação de Documentos", "Solicitação de Taxas", "Emissão Contrato", "Assinatura Contrato", "Recebimento Taxas", "Dossiê", "Conferência Dossiê", "Faturamento", "Envio Faturamento", "Preparação do Material de Campo", "Agendamento Levantamento", "Levantamento", "Processamento da Base", "Croqui", "Pré-projeto", "Conferência Pré-Projeto", "Monografia", "Aprovação do Proprietário", "Locação", "Execução do Projeto", "Conferência Projeto", "Revisão Processo", "ART / Assinatura Digital", "Impressão", "Assinatura do Proprietário", "Orgãos Governamentais", "Montagem do Processo para Prefeitura", "Processo Prefeitura", "Reconhecimento de Assinaturas", "Confecção de Escritura", "Montagem do Processo para Cartório", "Processo RI", "Nota de Exigências", "Entrega do Serviço"],
  "Unificação": ["Aprovação do Orçamento", "Solicitação de Documentos", "Solicitação de Taxas", "Emissão Contrato", "Assinatura Contrato", "Recebimento Taxas", "Dossiê", "Conferência Dossiê", "Faturamento", "Envio Faturamento", "Preparação do Material de Campo", "Agendamento Levantamento", "Levantamento", "Processamento da Base", "Croqui", "Pré-projeto", "Conferência Pré-Projeto", "Monografia", "Aprovação do Proprietário", "Execução do Projeto", "Conferência Projeto", "Revisão Processo", "ART / Assinatura Digital", "Impressão", "Assinatura do Proprietário", "Orgãos Governamentais", "Montagem do Processo para Prefeitura", "Processo Prefeitura", "Reconhecimento de Assinaturas", "Montagem do Processo para Cartório", "Processo RI", "Nota de Exigências", "Entrega do Serviço"],
  "Usucapião": ["Aprovação do Orçamento", "Solicitação de Documentos", "Solicitação de Taxas", "Emissão Contrato", "Assinatura Contrato", "Recebimento Taxas", "Dossiê", "Conferência Dossiê", "Faturamento", "Envio Faturamento", "Preparação do Material de Campo", "Agendamento Levantamento", "Levantamento", "Processamento da Base", "Croqui", "Pré-projeto", "Conferência Pré-Projeto", "Monografia", "Aprovação do Proprietário", "Execução do Projeto", "Conferência Projeto", "Revisão Processo", "ART / Assinatura Digital", "Impressão", "Assinatura do Proprietário", "Orgãos Governamentais", "Montagem do Processo para Prefeitura", "Processo Prefeitura", "Reconhecimento de Assinaturas", "Montagem do Processo para Cartório", "Processo RI", "Nota de Exigências", "Entrega do Serviço"],
  "Alteração de Divisas": ["Aprovação do Orçamento", "Solicitação de Documentos", "Solicitação de Taxas", "Emissão Contrato", "Assinatura Contrato", "Recebimento Taxas", "Dossiê", "Conferência Dossiê", "Faturamento", "Envio Faturamento", "Preparação do Material de Campo", "Agendamento Levantamento", "Levantamento", "Processamento da Base", "Croqui", "Pré-projeto", "Conferência Pré-Projeto", "Monografia", "Aprovação do Proprietário", "Locação", "Execução do Projeto", "Conferência Projeto", "Revisão Processo", "ART / Assinatura Digital", "Impressão", "Assinatura do Proprietário", "Orgãos Governamentais", "Montagem do Processo para Prefeitura", "Processo Prefeitura", "Reconhecimento de Assinaturas", "Confecção de Escritura", "Montagem do Processo para Cartório", "Processo RI", "Nota de Exigências", "Entrega do Serviço"],
  "CAR": ["Aprovação do Orçamento", "Solicitação de Documentos", "Emissão Contrato", "Assinatura Contrato", "Recebimento Taxas", "Faturamento", "Envio Faturamento", "Aprovação do Proprietário", "Execução do Projeto", "CAR", "Entrega do Serviço"],
  "Certificação INCRA": ["Aprovação do Orçamento", "Solicitação de Documentos", "Solicitação de Taxas", "Emissão Contrato", "Assinatura Contrato", "Recebimento Taxas", "Dossiê", "Conferência Dossiê", "Faturamento", "Envio Faturamento", "Execução do Projeto", "ART / Assinatura Digital", "Montagem do processo para SIGEF", "SIGEF", "Entrega do Serviço"],
  "Escritura": ["Aprovação do Orçamento", "Solicitação de Documentos", "Solicitação de Taxas", "Emissão Contrato", "Assinatura Contrato", "Recebimento Taxas", "Faturamento", "Envio Faturamento", "Escritura", "Montagem do Processo para Cartório", "Processo RI", "Processo Cartório", "Nota de Exigências", "Entrega do Serviço"],
  "Conferência": ["Aprovação do Orçamento", "Solicitação de Documentos", "Emissão Contrato", "Assinatura Contrato", "Recebimento Taxas", "Faturamento", "Envio Faturamento", "Preparação do Material de Campo", "Agendamento Levantamento", "Levantamento", "Processamento da Base", "Croqui", "Pré-projeto", "Conferência Pré-Projeto", "Execução do Projeto", "Conferência Projeto", "Entrega do Serviço"],
  "Cadastral": ["Aprovação do Orçamento", "Solicitação de Documentos", "Emissão Contrato", "Assinatura Contrato", "Recebimento Taxas", "Faturamento", "Envio Faturamento", "Preparação do Material de Campo", "Agendamento Levantamento", "Levantamento", "Processamento da Base", "Croqui", "Pré-projeto", "Conferência Pré-Projeto", "Execução do Projeto", "Conferência Projeto", "Entrega do Serviço"],
  "Locação": ["Aprovação do Orçamento", "Solicitação de Documentos", "Emissão Contrato", "Assinatura Contrato", "Recebimento Taxas", "Faturamento", "Envio Faturamento", "Preparação do Material de Campo", "Agendamento Levantamento", "Levantamento", "Processamento da Base", "Croqui", "Pré-projeto", "Conferência Pré-Projeto", "Locação", "Execução do Projeto", "Conferência Projeto", "Entrega do Serviço"],
  "Movimentação de Terra": ["Aprovação do Orçamento", "Solicitação de Documentos", "Emissão Contrato", "Assinatura Contrato", "Recebimento Taxas", "Faturamento", "Envio Faturamento", "Preparação do Material de Campo", "Agendamento Levantamento", "Levantamento", "Processamento da Base", "Croqui", "Pré-projeto", "Conferência Pré-Projeto", "Execução do Projeto", "Conferência Projeto", "Revisão Processo", "ART / Assinatura Digital", "Entrega do Serviço"],
  "DANC": ["Aprovação do Orçamento", "Recebimento Taxas", "Faturamento", "Croqui", "Pré-projeto", "Conferência Pré-Projeto", "Execução do Projeto", "Conferência Projeto", "Revisão Processo", "ART / Assinatura Digital", "Orgãos Governamentais", "Entrega do Serviço"],
  "CCIR/ITR": ["Aprovação do Orçamento", "Solicitação de Documentos", "Recebimento Taxas", "Execução do Projeto", "Entrega do Serviço"],
};
CATALOGO_PROCESSOS["Altimetria"] = [...CATALOGO_PROCESSOS["Locação"]];
CATALOGO_PROCESSOS["Outros"] = [...CATALOGO_PROCESSOS["Cadastral"]];
CATALOGO_PROCESSOS["Extremação"] = [...CATALOGO_PROCESSOS["Retificação"]];
CATALOGO_PROCESSOS["Relatório de Usucapião"] = [...CATALOGO_PROCESSOS["Outros"]];

async function main() {
  const existentes = await prisma.tipoProcessoEtapa.count();
  if (existentes > 0) {
    console.log(`TipoProcessoEtapa já tem ${existentes} linha(s) — nada a fazer.`);
    await prisma.$disconnect();
    return;
  }

  const linhas = [];
  for (const [tipo, etapas] of Object.entries(CATALOGO_PROCESSOS)) {
    etapas.forEach((nome, indice) => {
      linhas.push({ tipoProcesso: tipo, nome, setor: MAPEAMENTO_SETORES[nome] || 'CRD', ordem: indice + 1 });
    });
  }

  await prisma.tipoProcessoEtapa.createMany({ data: linhas });
  console.log(`Semeadas ${linhas.length} linhas em ${Object.keys(CATALOGO_PROCESSOS).length} tipos de processo.`);
  await prisma.$disconnect();
}

main();
