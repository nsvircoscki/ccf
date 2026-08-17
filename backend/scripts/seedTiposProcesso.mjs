// Semeia TipoProcessoEtapa com o catálogo de etapas que antes vivia fixo em
// workflowService.js (CATALOGO_PROCESSOS/MAPEAMENTO_SETORES). Rodar uma vez
// em qualquer banco (local ou produção) depois de aplicar a migração
// add_tipo_processo_etapa — idempotente: não faz nada se a tabela já tiver
// dados, então é seguro rodar mais de uma vez.
//
// Uso: node scripts/seedTiposProcesso.mjs
import { prisma } from '../src/prisma.js';

const MAPEAMENTO_SETORES = {
  "Aprovação do Orçamento": "Charles",
  "Emissão Contrato": "Coordenação", "Assinatura Contrato": "Coordenação", "Conferência Dossiê": "Coordenação",
  "Envio Faturamento": "Coordenação", "Agendamento Levantamento": "Coordenação", "Conferência Pré-Projeto": "Coordenação",
  "Aprovação do Proprietário": "Coordenação", "Conferência Projeto": "Coordenação", "ART / Assinatura Digital": "Coordenação",
  "Assinatura do Proprietário": "Coordenação", "Processo Prefeitura": "Coordenação", "Assinaturas dos Confrontantes": "Coordenação",
  "Reconhecimento de Assinaturas": "Coordenação", "Processo Cartório": "Coordenação", "SIGEF": "Coordenação",
  "Montagem do Processo para Cartório": "Coordenação", "Processo RI": "Coordenação", "Recebimento Taxas": "Coordenação", "Escritura": "Coordenação",
  "Nota de Exigências": "Coordenação", "Entrega do Serviço": "Coordenação", "Solicitação de Taxas": "Coordenação",
  "Solicitação de Documentos": "Coordenação", "Dossiê": "Desenho", "Pré-aprovação no Sigef": "Desenho",
  "Faturamento": "Desenho", "Preparação do Material de Campo": "Desenho", "Pré-projeto": "Desenho", "Monografia": "Desenho", "Confecção de Escritura": "Desenho",
  "Execução do Projeto": "Desenho", "Impressão": "Desenho", "Orgãos Governamentais": "Desenho", "Montagem do Processo para Prefeitura": "Desenho", "Atualização IPTU": "Desenho",
  "Montagem do processo para SIGEF": "Desenho", "CAR": "Desenho",
  "Levantamento": "Topografia", "Processamento da Base": "Topografia", "Croqui": "Topografia", "Locação": "Topografia",
  "Revisão Processo": "Charles",
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
  "Danc": ["Aprovação do Orçamento", "Recebimento Taxas", "Faturamento", "Croqui", "Pré-projeto", "Conferência Pré-Projeto", "Execução do Projeto", "Conferência Projeto", "Revisão Processo", "ART / Assinatura Digital", "Orgãos Governamentais", "Entrega do Serviço"],
};
CATALOGO_PROCESSOS["Outros"] = [...CATALOGO_PROCESSOS["Cadastral"]];
CATALOGO_PROCESSOS["Extremação"] = [...CATALOGO_PROCESSOS["Retificação"]];

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
      linhas.push({ tipoProcesso: tipo, nome, setor: MAPEAMENTO_SETORES[nome] || 'Coordenação', ordem: indice + 1 });
    });
  }

  await prisma.tipoProcessoEtapa.createMany({ data: linhas });
  console.log(`Semeadas ${linhas.length} linhas em ${Object.keys(CATALOGO_PROCESSOS).length} tipos de processo.`);
  await prisma.$disconnect();
}

main();
