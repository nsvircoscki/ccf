// src/controllers/servicoController.js
import { servicoService } from '../services/servicoService.js';

export const servicoController = {
  async listar(req, res) {
    try {
      const servicos = await servicoService.listar();
      res.json(servicos);
    } catch (error) {
      res.status(500).json({ error: "Erro ao buscar serviços." });
    }
  },

  async buscarPorId(req, res) {
    try {
      const servico = await servicoService.buscarPorId(req.params.id);
      if (!servico) return res.status(404).json({ error: "Serviço não encontrado." });
      res.json(servico);
    } catch (error) {
      res.status(500).json({ error: "Erro ao buscar serviço." });
    }
  },

  async criar(req, res) {
    try {
      const servico = await servicoService.criar(req.body);
      res.status(201).json(servico);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async atualizar(req, res) {
    try {
      const servico = await servicoService.atualizar(req.params.id, req.body);
      res.status(200).json(servico);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // Prévia ao vivo do Orçamento: devolve o PDF montado em memória, sem gravar.
  async previaPdf(req, res) {
    try {
      const buffer = await servicoService.previaPdf(req.params.id, req.body);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Cache-Control', 'no-store');
      res.send(buffer);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // O Content-Type sai da extensão do arquivo (.jpg ou .png) pelo próprio
  // sendFile, então serve tanto JPEG quanto PNG sem tratamento extra.
  async imagem(req, res) {
    try {
      const caminho = await servicoService.caminhoImagem(req.params.id);
      res.sendFile(caminho);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  },

  // "inline" para o navegador abrir a ficha numa aba em vez de baixá-la.
  async pdf(req, res) {
    try {
      const { caminho, nome } = await servicoService.caminhoPdf(req.params.id);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${nome}"`);
      res.sendFile(caminho);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  },

  async atualizarVinculacao(req, res) {
    try {
      const servico = await servicoService.atualizarVinculacao(req.params.id, req.body);
      res.status(200).json(servico);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async salvarOrcamento(req, res) {
    try {
      const servico = await servicoService.salvarOrcamento(req.params.id, req.body);
      res.status(200).json(servico);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // decisao: 'APROVADO' | 'REPROVADO'. Mantém o padrão 'APROVADO' quando o
  // corpo vem vazio, para não quebrar quem ainda chame sem o campo.
  async aprovarOrcamento(req, res) {
    try {
      const decisao = req.body?.decisao === 'REPROVADO' ? 'REPROVADO' : 'APROVADO';
      const resultado = await servicoService.decidirOrcamento(req.params.id, decisao);
      res.status(200).json(resultado);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
};
