// src/controllers/clienteController.js
import { clienteService } from '../services/clienteService.js';

export const clienteController = {
  async listar(req, res) {
    try {
      const clientes = await clienteService.listar();
      res.json(clientes);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar clientes.' });
    }
  },

  async buscarPorId(req, res) {
    try {
      const cliente = await clienteService.buscarPorId(req.params.id);
      if (!cliente) return res.status(404).json({ error: 'Cliente não encontrado.' });
      res.json(cliente);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar cliente.' });
    }
  },

  async criar(req, res) {
    try {
      const cliente = await clienteService.criar(req.body);
      res.status(201).json(cliente);
    } catch (error) {
      res.status(400).json({ error: mensagemDeErro(error) });
    }
  },

  async atualizar(req, res) {
    try {
      const cliente = await clienteService.atualizar(req.params.id, req.body);
      res.status(200).json(cliente);
    } catch (error) {
      res.status(400).json({ error: mensagemDeErro(error) });
    }
  },

  async remover(req, res) {
    try {
      await clienteService.remover(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ error: mensagemDeErro(error) });
    }
  },
};

// A constraint @unique de documento vira P2002 do Prisma, não uma mensagem
// legível — sem isso o usuário veria um erro genérico de banco de dados.
function mensagemDeErro(error) {
  if (error.code === 'P2002') return 'Já existe um cliente cadastrado com este CPF/CNPJ.';
  return error.message;
}
