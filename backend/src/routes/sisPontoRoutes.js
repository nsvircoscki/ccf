import express from 'express';
import { listarFuncionarios, listarRegistros, criarFuncionario, atualizarFuncionario, excluirFuncionario, registrarPonto, excluirRegistro, listarJustificativas, criarJustificativa, atualizarJustificativa, excluirJustificativa, listarPadroesHorario, atualizarPadraoHorario } from '../services/sisPontoService.js';

const router = express.Router();

router.get('/funcionarios', async (_req, res) => {
  try {
    const funcionarios = await listarFuncionarios();
    res.json(funcionarios);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Erro ao listar funcionários.' });
  }
});

router.get('/registros', async (_req, res) => {
  try {
    const registros = await listarRegistros();
    res.json(registros);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Erro ao listar registros.' });
  }
});

router.post('/funcionarios', async (req, res) => {
  try {
    const funcionario = await criarFuncionario(req.body);
    res.status(201).json(funcionario);
  } catch (error) {
    res.status(400).json({ error: error.message || 'Erro ao criar funcionário.' });
  }
});

router.put('/funcionarios/:id', async (req, res) => {
  try {
    const funcionario = await atualizarFuncionario(req.params.id, req.body);
    if (!funcionario) return res.status(404).json({ error: 'Funcionário não encontrado.' });
    res.json(funcionario);
  } catch (error) {
    res.status(400).json({ error: error.message || 'Erro ao atualizar funcionário.' });
  }
});

router.delete('/funcionarios/:id', async (req, res) => {
  try {
    await excluirFuncionario(req.params.id);
    res.json({ ok: true });
  } catch (error) {
    res.status(400).json({ error: error.message || 'Erro ao excluir funcionário.' });
  }
});

router.post('/registros', async (req, res) => {
  try {
    const result = await registrarPonto(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message || 'Erro ao registrar ponto.' });
  }
});

router.delete('/registros', async (req, res) => {
  try {
    const { funcionarioId, data, tempo } = req.body;
    const resultado = await excluirRegistro(funcionarioId, data, tempo);
    if (resultado === null) return res.status(404).json({ error: 'Registro não encontrado.' });
    res.json({ ok: true });
  } catch (error) {
    res.status(400).json({ error: error.message || 'Erro ao excluir registro.' });
  }
});

router.get('/justificativas', async (_req, res) => {
  try {
    const justificativas = await listarJustificativas();
    res.json(justificativas);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Erro ao listar justificativas.' });
  }
});

router.post('/justificativas', async (req, res) => {
  try {
    const justificativa = await criarJustificativa(req.body);
    res.status(201).json(justificativa);
  } catch (error) {
    res.status(400).json({ error: error.message || 'Erro ao criar justificativa.' });
  }
});

router.put('/justificativas/:id', async (req, res) => {
  try {
    const justificativa = await atualizarJustificativa(req.params.id, req.body);
    if (!justificativa) return res.status(404).json({ error: 'Justificativa não encontrada.' });
    res.json(justificativa);
  } catch (error) {
    res.status(400).json({ error: error.message || 'Erro ao atualizar justificativa.' });
  }
});

router.delete('/justificativas/:id', async (req, res) => {
  try {
    const existia = await excluirJustificativa(req.params.id);
    if (!existia) return res.status(404).json({ error: 'Justificativa não encontrada.' });
    res.json({ ok: true });
  } catch (error) {
    res.status(400).json({ error: error.message || 'Erro ao excluir justificativa.' });
  }
});

router.get('/padroes-horario', async (_req, res) => {
  try {
    const padroes = await listarPadroesHorario();
    res.json(padroes);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Erro ao listar padrões de horário.' });
  }
});

router.put('/padroes-horario/:id', async (req, res) => {
  try {
    const padrao = await atualizarPadraoHorario(req.params.id, req.body.dias);
    res.json(padrao);
  } catch (error) {
    res.status(400).json({ error: error.message || 'Erro ao atualizar padrão de horário.' });
  }
});

export default router;
