import express from 'express';
import { exigirSetor } from '../middlewares/autenticar.js';
import { listarJustificativas, criarJustificativa, atualizarJustificativa, excluirJustificativa, listarPadroesHorario, atualizarPadraoHorario } from '../services/sisPontoService.js';
import { listarFuncionarios, atualizarFuncionario, sincronizar, registrarAvulso, listarMapaRegistros, listarParaRevisao, decidirPrevistas, remover } from '../services/ponto/batidaService.js';
import { interpretarPeriodo } from '../services/ponto/exportCsv.js';

const router = express.Router();

// Funcionário do ponto = User com "registra ponto" ligado. Criar, renomear e
// desligar é no cadastro de Usuários (Configurações → Usuários).
const CADASTRO_EM_USUARIOS = 'Funcionários agora são cadastrados em Configurações → Usuários (marque "Registra ponto").';

router.get('/funcionarios', async (_req, res) => {
  try {
    res.json(await listarFuncionarios());
  } catch (error) {
    res.status(500).json({ error: error.message || 'Erro ao listar funcionários.' });
  }
});

router.post('/funcionarios', (_req, res) => res.status(410).json({ error: CADASTRO_EM_USUARIOS }));
router.delete('/funcionarios/:id', (_req, res) => res.status(410).json({ error: CADASTRO_EM_USUARIOS }));

// Só jornada e horista/mensalista (aba Jornada do admin).
router.put('/funcionarios/:id', exigirSetor('ENG', 'DEV'), async (req, res) => {
  try {
    const funcionario = await atualizarFuncionario(req.params.id, req.body);
    if (!funcionario) return res.status(404).json({ error: 'Funcionário não encontrado.' });
    res.json(funcionario);
  } catch (error) {
    res.status(400).json({ error: error.message || 'Erro ao atualizar funcionário.' });
  }
});

router.get('/registros', async (_req, res) => {
  try {
    res.json(await listarMapaRegistros());
  } catch (error) {
    res.status(500).json({ error: error.message || 'Erro ao listar registros.' });
  }
});

// Fila offline do aparelho: { batidas: [...], dispositivo: { deviceId, pendentes } }.
// Responde item a item; "criado" e "duplicado" significam que o aparelho já
// pode marcar a batida como enviada.
router.post('/sync', async (req, res) => {
  try {
    const dispositivo = { ...(req.body?.dispositivo || {}), userAgent: req.headers['user-agent'] };
    res.json(await sincronizar(req.body?.batidas, req.usuario, dispositivo));
  } catch (error) {
    res.status(400).json({ error: error.message || 'Erro ao sincronizar pontos.' });
  }
});

// Compatibilidade com o front sem fila offline.
router.post('/registros', async (req, res) => {
  try {
    res.status(201).json(await registrarAvulso(req.body, req.usuario));
  } catch (error) {
    res.status(400).json({ error: error.message || 'Erro ao registrar ponto.' });
  }
});

router.delete('/registros', async (req, res) => {
  try {
    const resultado = await remover(req.body || {}, req.usuario);
    if (resultado === null) return res.status(404).json({ error: 'Registro não encontrado.' });
    res.json({ ok: true });
  } catch (error) {
    res.status(400).json({ error: error.message || 'Erro ao excluir registro.' });
  }
});

// Revisão do admin: { pares (sem saída/sem entrada/inconsistentes), previstas
// (horários em que a pessoa não bateu, para abonar ou marcar falta) }.
router.get('/revisao', exigirSetor('ENG', 'DEV'), async (req, res) => {
  try {
    const periodo = interpretarPeriodo(req.query);
    if (!periodo) return res.status(400).json({ error: 'Informe ?mes=YYYY-MM.' });
    res.json(await listarParaRevisao(periodo));
  } catch (error) {
    res.status(500).json({ error: error.message || 'Erro ao listar pontos para revisão.' });
  }
});

// { ids: [...], situacao: 'ABONADA' | 'FALTA' | 'PENDENTE' (desfaz) }
router.post('/previstas/decisao', exigirSetor('ENG', 'DEV'), async (req, res) => {
  try {
    res.json(await decidirPrevistas(req.body?.ids, req.body?.situacao, req.usuario));
  } catch (error) {
    res.status(400).json({ error: error.message || 'Erro ao registrar a decisão.' });
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
    const justificativa = await criarJustificativa(req.body, req.usuario);
    res.status(201).json(justificativa);
  } catch (error) {
    res.status(400).json({ error: error.message || 'Erro ao criar justificativa.' });
  }
});

router.put('/justificativas/:id', async (req, res) => {
  try {
    const justificativa = await atualizarJustificativa(req.params.id, req.body, req.usuario);
    if (!justificativa) return res.status(404).json({ error: 'Justificativa não encontrada.' });
    res.json(justificativa);
  } catch (error) {
    res.status(400).json({ error: error.message || 'Erro ao atualizar justificativa.' });
  }
});

router.delete('/justificativas/:id', async (req, res) => {
  try {
    const existia = await excluirJustificativa(req.params.id, req.usuario);
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
