// Em backend/src/services/servicoService.js
import { prisma } from '../prisma.js';
import { workflowService } from './workflowService.js';

export const servicoService = {
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
        
        // Passamos "tx" no 4º parâmetro para blindar tudo na mesma transação!
        const novoProjeto = await workflowService.fabricarProjeto(
          nomeProjeto,
          [tipoProcesso],
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