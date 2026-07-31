import { servicoService } from '../services/servicoService.js';


export const servicoController = {
    async listar(req, res) {
        try {
            const servicos = await servicoService.listar();
            res.json(servicos);
        } catch (error) {
            res.status(500).json({ error: "Erro ao buscar serviços." });
        }
    }
}
