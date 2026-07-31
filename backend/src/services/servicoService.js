// Em backend/src/services/servicoService.js
import { prisma } from '../prisma.js';
import { workflowService } from './workflowService.js';


const Mapa_tipos_abreviados = {
  'Ret': ' Retificação',
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
  //Lev Topo é a linha de cobrança do levantamento topográfico, 
  //não tem tipo de projeto no kanban.
  //Ext precisa adicionar
};

function mapearTipos(nomesAbreviados) {
  return(nomesAbreviados || []
    .map((nome) => Mapa_tipos_abreviados[nome]))
    .filter(Boolean);
}

function paraNumero(valor) {
  if (valor === undefined || valor === null || valor === '') return null;

  let texto = String(valor).trim().replace(/[^\d,.\-]/g, '');

  // Só existe vírgula quando o valor veio em formato brasileiro
  // ("1.234,56"). Nesse caso, o ponto é separador de milhar (remove)
  // e a vírgula é o decimal (vira ponto). Sem vírgula, o texto já
  // está em formato JS puro.
  if (texto.includes(',')) {
    texto = texto.replace(/\./g, '').replace(',', '.');
  }

  const numero = parseFloat(texto);
  return Number.isFinite(numero) ? numero : null;
}




export const servicoService = {
  async listar() {
    return prisma.servico.findMany({ orderBy: [ created_at: 'desc'] });
  },

  async buscarPorId(id) {
    return prisma.servico.findUnique({ where: { id }, include: { workflows: true } });
  },

  async criar(dados) {
    const {
      numeroServico, nomeCliente, tipoCliente, contato, 
      matricula, terreno, possuiCAR, possuiCertificação, confrontaCertificação, 
      codRespTecn, RespTecn, notas,
      area, municipio, linhaSecaKm, rioKm,
      servicosSelecionados, valorTotal
    } = dados;
  

  if (!numeroServico || !nomeCliente || !municipio) {
    throw new Error("numeroServico, nomeCliente e municipio são obrigatórios.");
  }

  const tiposSolicitados = mapearTipos(servicosSelecionados);

  return prisma.servico.create({
    data: {
       numeroServico,
       nomeCliente,
       tipoCliente: tipoCliente || 'Padrão',
       contato,
       matricula,
       terreno: terreno || 'Urbano',
       possuiCar,
       possuiCertificação,
       confrontaCertificação,
       codRespTecn,
       RespTecn,
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
        
        //  "tx" no 5º parâmetro para blindar tudo na mesma transação
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