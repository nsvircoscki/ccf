import { tarefaService } from '../services/tarefaService.js';

export const tarefaController = {
  async listar(req, res) {
    try {
      const tarefas = await tarefaService.listar({
        setor: req.query.setor,
        servicoId: req.query.servicoId,
        status: req.query.status,
      });
      res.json(tarefas);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar tarefas.' });
    }
  },

  async criar(req, res) {
    try {
      const tarefa = await tarefaService.criar(req.body);
      res.status(201).json(tarefa);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async atualizarObservacao(req, res) {
    try {
      const tarefa = await tarefaService.atualizarObservacao(req.params.id, req.body.observacoes);
      res.status(200).json(tarefa);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async concluir(req, res) {
    try {
      const tarefa = await tarefaService.concluir(req.params.id, req.body.setor);
      res.status(200).json(tarefa);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async reabrir(req, res) {
    try {
      const tarefa = await tarefaService.reabrir(req.params.id);
      res.status(200).json(tarefa);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async excluir(req, res) {
    try {
      await tarefaService.excluir(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  },

  async abrirPasta(req, res) {
    try {
      const { caminho } = req.body;
      if (!caminho) return res.status(400).json({ error: 'Caminho não informado.' });

      const { exec } = await import('child_process');
      const command = process.platform === 'win32' ? `start "" "${caminho}"` : `open "${caminho}"`;

      exec(command, (err) => {
        if (err) {
          console.error('Erro ao abrir pasta:', err);
          return res.status(500).json({ error: 'Não foi possível abrir a pasta automaticamente.' });
        }
        res.json({ ok: true });
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erro interno ao abrir a pasta.' });
    }
  },
};
