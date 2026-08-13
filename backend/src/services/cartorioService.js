import {prisma} from '../prisma.js';

export const cartorioService = {
    async buscarPorCns(cns) {
        if (!cns?.trim()) return null;
        return prisma.cartorioCns.findUnique({ where: { cns: cns.trim() } });
    },

    async salvar(cns, { cartorio, comarca }) {
        if (!cns?.trim() || (!cartorio && !comarca)) return;
        await prisma.cartorioCns.upsert({
            where: { cns: cns.trim() },
            update: { cartorio: cartorio || undefined, comarca: comarca || undefined },
            create: { cns: cns.trim(), cartorio: cartorio || null, comarca: comarca || null}
        });
    },
};