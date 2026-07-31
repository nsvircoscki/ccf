// Em backend/src/services/servicoService.js
import { prisma } from '../prisma.js';
import { workflowService } from './workflowService.js';

// Nomes abreviados usados no Cadastro de Serviço -> nomes completos do
// catálogo de processos (workflowService.js / CATALOGO_PROCESSOS). Sem essa
// tradução, aprovar um orçamento cria o projeto mas sem nenhuma tarefa.
const MAPA_TIPOS_ABREVIADOS = {
  'Ret': 'Retificação',
  'Desm': 'Desmembramento',
  'Uni': 'Unificação',
  'Usu': 'Usucapião',
  'At': 'Alteração de Divisas',
  'CAR': 'CAR',
  'Cert': 'Certificação INCRA',
  'Escritura': 'Escritura',
  'Conf': 'Conferência',
  'Cad': 'Cadastral',
  'Loc': 'Locação',
  'Mov de Terra': 'Movimentação de Terra',
  // 'Lev Topo' é a linha de cobrança do levantamento topográfico (tem
  // cálculo próprio de índice), não um tipo de projeto do Kanban.
  // 'Ext' (Extremação) ainda não tem entrada em CATALOGO_PROCESSOS —
  // adicione aqui quando o catálogo tiver essa chave.
};

function mapearTiposSolicitados(nomesAbreviados) {
  return (nomesAbreviados || [])
    .map((nome) => MAPA_TIPOS_ABREVIADOS[nome])
    .filter(Boolean);
}

function paraNumero(valor) {
  if (valor === undefined || valor === null || valor === '') return null;

  let texto = String(valor).trim().replace(/[^\d,.\-]/g, '');

  // Só existe vírgula quando o valor veio em formato brasileiro
  // ("1.234,56"). Nesse caso, o ponto é separador de milhar (remove)
  // e a vírgula é o decimal (vira ponto). Sem vírgula, o texto já
  // está em formato JS puro (ex.: "1234.56" vindo de um cálculo).
  if (texto.includes(',')) {
    texto = texto.replace(/\./g, '').replace(',', '.');
  }

  const numero = parseFloat(texto);
  return Number.isFinite(numero) ? numero : null;
}

export const servicoService = {
  async listar() {
    return prisma.servico.findMany({ orderBy: { created_at: 'desc' } });
  },

  async buscarPorId(id) {
    return prisma.servico.findUnique({ where: { id }, include: { workflows: true } });
  },

  async criar(dados) {
    const {
      numeroServico, nomeCliente, tipoCliente, contato,
      matricula, terreno, possuiCar, possuiCertificacao, confrontaCertificacao,
      codRespTecn, respTecn, notas,
      area, municipio, linhaSecaKm, rioKm,
      servicosSelecionados, valorTotal
    } = dados;

    if (!numeroServico || !nomeCliente || !municipio) {
      throw new Error("numeroServico, nomeCliente e municipio são obrigatórios.");
    }

    const tiposSolicitados = mapearTiposSolicitados(servicosSelecionados);

    return prisma.servico.create({
      data: {
        numeroServico,
        nomeCliente,
        tipoCliente: tipoCliente || 'Padrão',
        contato,
        matricula,
        terreno: terreno || 'Urbano',
        possuiCar,
        possuiCertificacao,
        confrontaCertificacao,
        codRespTecn,
        respTecn,
        notas,
        area: paraNumero(area),
        municipio,
        linhaSecaKm: paraNumero(linhaSecaKm),
        rioKm: paraNumero(rioKm),
        tiposSolicitados,
        valorTotal: paraNumero(valorTotal)
      }
    });
  },

  async aprovarOrcamentoEGerarProjetos(servicoId) {
    const servico = await prisma.servico.findUnique({ where: { id: servicoId } });

    if (!servico) throw new Error("Serviço não encontrado.");
    if (servico.statusOrcamento === "APROVADO") throw new Error("Este orçamento já foi aprovado.");

    return await prisma.$transaction(async (tx) => {
      const servicoAprovado = await tx.servico.update({
        where: { id: servicoId },
        data: { statusOrcamento: "APROVADO" }
      });

      const projetosGerados = [];

      for (const tipoProcesso of servico.tiposSolicitados) {
        const nomeProjeto = `${servico.numeroServico} - ${tipoProcesso}`;

        const novoProjeto = await workflowService.fabricarProjeto(
          nomeProjeto,
          [tipoProcesso],
          servico.terreno || 'Urbano',
          servico.id,
          tx
        );

        projetosGerados.push(novoProjeto);
      }

      return {
        message: `Orçamento aprovado! ${projetosGerados.length} projetos fabricados.`,
        servico: servicoAprovado,
        projetos: projetosGerados
      };
    });
  }
};
