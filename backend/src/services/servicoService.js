// Em backend/src/services/servicoService.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'node:crypto';
import { prisma } from '../prisma.js';
import { workflowService } from './workflowService.js';
import { gerarPdfServico, gerarPdfServicoBuffer } from './pdfServico.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Em produção, aponta pra pasta de rede do servidor (ver PASTA_SERVICOS no
// .env). Sem essa variável, cai no padrão local de desenvolvimento.
const PASTA_BASE_SERVICOS = process.env.PASTA_SERVICOS || path.join(__dirname, '../../servicos');

// Cônjuge pode estar gravado em qualquer um dos dois lados da relação — ver
// resolverConjuge em clienteService.js.
const INCLUDE_CONJUGE = { conjuge: true, conjugeDe: true };

// Nomes abreviados usados no Cadastro de Serviço -> nomes completos do
// catálogo de processos (tabela TipoProcessoEtapa, ver workflowService.js).
// Sem essa tradução, aprovar um orçamento cria o projeto mas sem nenhuma tarefa.
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
  // Mapeia para si mesmo: precisa entrar em tiposSolicitados para aparecer na
  // ficha em PDF, mesmo sem virar projeto no Kanban (não há tipo "Outros"
  // cadastrado em TipoProcessoEtapa — ver o filtro antes de fabricarProjeto,
  // em criar() e atualizar()).
  'Outros': 'Outros',
  'Ext': 'Extremação',
  // Mapeia para si mesmo pelo mesmo motivo de 'Outros': precisa entrar em
  // tiposSolicitados para a tela de Orçamento marcar a caixa sozinha ao abrir
  // o serviço, mesmo não virando projeto no Kanban (sem tipo "Lev Topo"
  // cadastrado em TipoProcessoEtapa — o filtro antes de fabricarProjeto já exclui).
  'Lev Topo': 'Lev Topo',
};

function mapearTiposSolicitados(nomesAbreviados) {
  return (nomesAbreviados || [])
    .map((nome) => MAPA_TIPOS_ABREVIADOS[nome])
    .filter(Boolean);
}

function paraNumero(valor) {
  if (valor === undefined || valor === null || valor === '') return null;

  let texto = String(valor).trim().replace(/[^\d,.\-]/g, '');

  if (texto.includes(',')) {
    texto = texto.replace(/\./g, '').replace(',', '.');
  }

  const numero = parseFloat(texto);
  return Number.isFinite(numero) ? numero : null;
}

function criarPastaServico(numeroServico) {
  const caminho = path.join(PASTA_BASE_SERVICOS, numeroServico);
  fs.mkdirSync(caminho, { recursive: true });
  return caminho;
}

// A imagem foi salva no cadastro com o mesmo nome do serviço; devolve o caminho
// se ela existir, para reaproveitá-la ao regerar a ficha.
const EXTENSOES_IMAGEM = ['jpg', 'png'];

function caminhoImagemDoServico(servico) {
  if (!servico?.caminhoPasta) return null;

  for (const extensao of EXTENSOES_IMAGEM) {
    const caminho = path.join(servico.caminhoPasta, `${servico.numeroServico}.${extensao}`);
    if (fs.existsSync(caminho)) return caminho;
  }
  return null;
}

// A imagem do mapa chega embutida como data URL ("data:image/jpeg;base64,...").
// Salva na pasta do serviço e devolve o caminho, ou null se não veio nada.
function salvarImagemServico(imagemBase64, caminhoPasta, numeroServico) {
  if (!imagemBase64) return null;

  const texto = String(imagemBase64);
  const tipo = texto.match(/^data:image\/(\w+);base64,/);
  const extensao = tipo && tipo[1].toLowerCase() === 'png' ? 'png' : 'jpg';
  const conteudo = texto.replace(/^data:image\/\w+;base64,/, '');
  const caminhoImagem = path.join(caminhoPasta, `${numeroServico}.${extensao}`);

  try {
    // Apaga a imagem anterior antes de gravar: trocar um JPG por um PNG numa
    // edição deixaria os dois na pasta e a busca acharia o antigo primeiro.
    for (const anterior of EXTENSOES_IMAGEM) {
      const caminhoAnterior = path.join(caminhoPasta, `${numeroServico}.${anterior}`);
      if (fs.existsSync(caminhoAnterior)) fs.rmSync(caminhoAnterior);
    }

    fs.writeFileSync(caminhoImagem, Buffer.from(conteudo, 'base64'));
    return caminhoImagem;
  } catch (erro) {
    console.error(`Falha ao salvar a imagem do serviço ${numeroServico}:`, erro);
    return null;
  }
}

// KML chega como texto puro (nome + conteúdo XML), diferente da imagem que
// vem em base64 — salva cada um do jeito que veio, sem transformação, e
// devolve os nomes salvos (juntos numa string) pra registrar em arquivoKml.
function salvarKmlServico(arquivosKml, caminhoPasta) {
  if (!Array.isArray(arquivosKml) || arquivosKml.length === 0) return null;

  const nomesSalvos = [];
  for (const arquivo of arquivosKml) {
    if (!arquivo?.nome || !arquivo?.conteudo) continue;
    const nomeSeguro = path.basename(arquivo.nome);
    try {
      fs.writeFileSync(path.join(caminhoPasta, nomeSeguro), arquivo.conteudo, 'utf8');
      nomesSalvos.push(nomeSeguro);
    } catch (erro) {
      console.error(`Falha ao salvar o KML "${nomeSeguro}":`, erro.message);
    }
  }
  return nomesSalvos.length > 0 ? nomesSalvos.join(', ') : null;
}

export const servicoService = {
  // temImagem sai calculado do disco: a imagem é localizada por convenção de
  // nome dentro da pasta do serviço, não há coluna para ela no banco.
  async listar() {
    const servicos = await prisma.servico.findMany({ orderBy: { created_at: 'desc' } });
    return servicos.map((servico) => ({
      ...servico,
      temImagem: Boolean(caminhoImagemDoServico(servico)),
    }));
  },

  async caminhoImagem(id) {
    const servico = await prisma.servico.findUnique({ where: { id } });
    if (!servico) throw new Error('Serviço não encontrado.');

    const caminho = caminhoImagemDoServico(servico);
    if (!caminho) throw new Error('Este serviço não tem imagem anexada.');

    return caminho;
  },

  async buscarPorId(id) {
    const servico = await prisma.servico.findUnique({
      where: { id },
      include: {
        workflows: true,
        itensOrcamento: true,
        parcelas: { orderBy: { numero: 'asc' } },
        proprietarios: { include: INCLUDE_CONJUGE },
        imovel: { include: { proprietarios: true, usufrutuarios: true } },
        confrontantes: { include: { proprietarios: { include: INCLUDE_CONJUGE } } },
        procurador: true,
      },
    });
    if (!servico) return null;

    return { ...servico, temImagem: Boolean(caminhoImagemDoServico(servico)) };
  },

  // Vinculação: liga o serviço já cadastrado a Clientes (proprietários) e um
  // Imovel já cadastrados, e grava os dados específicos deste serviço usados
  // na geração de documentos (retificação por ex.). Separado de atualizar()
  // de propósito — não mexe em nada do cadastro original.
  async atualizarVinculacao(id, dados) {
    const servico = await prisma.servico.findUnique({ where: { id } });
    if (!servico) throw new Error('Serviço não encontrado.');

    const {
      proprietarioIds, situacaoProprietario, imovelId, procuradorId, descricaoAtualImovel, memorialDescritivoRetificacao,
      superiorOuInferior, totalLotes, averbacoes, areasDesmembramento, listaProtocoloEntrega, confrontanteIds,
    } = dados;

    const idsProprietarios = Array.isArray(proprietarioIds) ? [...new Set(proprietarioIds.filter(Boolean))] : [];
    if (idsProprietarios.length > 0) {
      const encontrados = await prisma.cliente.findMany({ where: { id: { in: idsProprietarios } } });
      if (encontrados.length !== idsProprietarios.length) throw new Error('Um ou mais clientes proprietários não foram encontrados.');
    }
    if (imovelId) {
      const imovel = await prisma.imovel.findUnique({ where: { id: imovelId } });
      if (!imovel) throw new Error('Imóvel não encontrado.');
    }
    if (procuradorId) {
      const procurador = await prisma.cliente.findUnique({ where: { id: procuradorId } });
      if (!procurador) throw new Error('Procurador não encontrado.');
    }

    return prisma.servico.update({
      where: { id },
      data: {
        situacaoProprietario: situacaoProprietario || null,
        imovelId: imovelId || null,
        procuradorId: procuradorId || null,
        descricaoAtualImovel: descricaoAtualImovel || null,
        memorialDescritivoRetificacao: memorialDescritivoRetificacao || null,
        superiorOuInferior: superiorOuInferior || null,
        totalLotes: totalLotes === '' || totalLotes == null ? null : Number(totalLotes),
        averbacoes: averbacoes || null,
        areasDesmembramento: areasDesmembramento || null,
        listaProtocoloEntrega: listaProtocoloEntrega || null,
        // "set" troca a lista inteira pela enviada — mais simples que
        // calcular o diff de connect/disconnect a cada vinculação salva.
        proprietarios: { set: idsProprietarios.map((clienteId) => ({ id: clienteId })) },
        ...(Array.isArray(confrontanteIds)
          ? { confrontantes: { set: confrontanteIds.map((idImovel) => ({ id: idImovel })) } }
          : {}),
      },
      include: {
        proprietarios: { include: INCLUDE_CONJUGE },
        imovel: { include: { proprietarios: true, usufrutuarios: true } },
        confrontantes: { include: { proprietarios: { include: INCLUDE_CONJUGE } } },
        procurador: true,
      },
    });
  },

  // Edição de um serviço já cadastrado. numeroServico, sequencial e caminhoPasta
  // ficam intocados de propósito: eles já batizam a pasta em disco e os projetos
  // no Kanban, então renomeá-los quebraria as duas referências.
  async atualizar(id, dados) {
    const servico = await prisma.servico.findUnique({ where: { id } });
    if (!servico) throw new Error('Serviço não encontrado.');

    const {
      nomeCliente, tipoCliente, contato,
      matricula, terreno, possuiCar, possuiCertificacao, confrontaCertificacao,
      codRespTecnPossui, respTecnPossui, codRespTecn, respTecn, notas,
      area, municipio, linhaSecaKm, rioKm,
      servicosSelecionados, imagemBase64, arquivosKml,
    } = dados;

    const tiposSolicitados = Array.isArray(servicosSelecionados)
      ? mapearTiposSolicitados(servicosSelecionados)
      : servico.tiposSolicitados;

    const atualizado = await prisma.$transaction(async (tx) => {
      const salvo = await tx.servico.update({
        where: { id },
        data: {
          nomeCliente: nomeCliente || servico.nomeCliente,
          tipoCliente: tipoCliente || servico.tipoCliente,
          contato,
          matricula,
          terreno: terreno || 'Urbano',
          possuiCar,
          possuiCertificacao,
          confrontaCertificacao,
          codRespTecnPossui,
          respTecnPossui,
          codRespTecn,
          respTecn,
          notas,
          area: paraNumero(area),
          municipio: municipio || servico.municipio,
          linhaSecaKm: paraNumero(linhaSecaKm),
          rioKm: paraNumero(rioKm),
          tiposSolicitados,
        },
      });

      // O projeto no Kanban não nasce mais aqui: só é fabricado quando o
      // orçamento é aprovado (ver decidirOrcamento). Editar o cadastro antes
      // da aprovação só atualiza os dados do serviço.
      return salvo;
    });

    try {
      const caminhoImagem = imagemBase64
        ? salvarImagemServico(imagemBase64, atualizado.caminhoPasta, atualizado.numeroServico)
        : caminhoImagemDoServico(atualizado);
      const arquivoKml = salvarKmlServico(arquivosKml, atualizado.caminhoPasta);
      if (arquivoKml) {
        await prisma.servico.update({ where: { id: atualizado.id }, data: { arquivoKml } });
        atualizado.arquivoKml = arquivoKml;
      }
      await gerarPdfServico(atualizado, caminhoImagem);
    } catch (erro) {
      console.error(`Falha ao regerar o PDF do serviço ${atualizado.numeroServico}:`, erro);
    }

    return atualizado;
  },

  // Gera a ficha com os dados que o Orçamento tem na tela agora, sem persistir
  // nada. Cada campo cai para o valor gravado quando não veio na requisição,
  // então a prévia funciona mesmo com a tela parcialmente preenchida.
  async previaPdf(servicoId, dados = {}) {
    const servico = await prisma.servico.findUnique({ where: { id: servicoId } });
    if (!servico) throw new Error('Serviço não encontrado.');

    const ouSalvo = (novo, salvo) => (novo === undefined || novo === null || novo === '' ? salvo : novo);
    const numeroOuSalvo = (novo, salvo) => {
      const convertido = paraNumero(novo);
      return convertido === null ? salvo : convertido;
    };

    const previa = {
      ...servico,
      nomeCliente: ouSalvo(dados.nomeCliente, servico.nomeCliente),
      contato: ouSalvo(dados.contato, servico.contato),
      matricula: ouSalvo(dados.matricula, servico.matricula),
      terreno: ouSalvo(dados.terreno, servico.terreno),
      municipio: ouSalvo(dados.municipio, servico.municipio),
      possuiCar: ouSalvo(dados.possuiCar, servico.possuiCar),
      possuiCertificacao: ouSalvo(dados.possuiCertificacao, servico.possuiCertificacao),
      confrontaCertificacao: ouSalvo(dados.confrontaCertificacao, servico.confrontaCertificacao),
      codRespTecnPossui: ouSalvo(dados.codRespTecnPossui, servico.codRespTecnPossui),
      respTecnPossui: ouSalvo(dados.respTecnPossui, servico.respTecnPossui),
      codRespTecn: ouSalvo(dados.codRespTecn, servico.codRespTecn),
      respTecn: ouSalvo(dados.respTecn, servico.respTecn),
      notas: ouSalvo(dados.notas, servico.notas),
      area: numeroOuSalvo(dados.area, servico.area),
      linhaSecaKm: numeroOuSalvo(dados.linhaSecaKm, servico.linhaSecaKm),
      rioKm: numeroOuSalvo(dados.rioKm, servico.rioKm),

      tiposSolicitados: Array.isArray(dados.servicosSelecionados)
        ? mapearTiposSolicitados(dados.servicosSelecionados)
        : servico.tiposSolicitados,

      valorTotal: numeroOuSalvo(dados.valorTotal, servico.valorTotal),
      descontoValor: paraNumero(dados.descontoValor),
      descontoPercentual: paraNumero(dados.descontoPercentual),
      valorFinal: numeroOuSalvo(dados.valorFinal, servico.valorFinal),
      entradaValor: paraNumero(dados.entradaValor),
      entradaData: dados.entradaData || null,
      numeroParcelas: dados.numeroParcelas ? Number(dados.numeroParcelas) : null,
      jurosAtivo: Boolean(dados.jurosAtivo),
      taxaJuros: paraNumero(dados.taxaJuros),
      tipoJuros: dados.tipoJuros || null,
      parcelas: Array.isArray(dados.parcelas) ? dados.parcelas : [],
    };

    return gerarPdfServicoBuffer(previa, caminhoImagemDoServico(servico));
  },

  // Devolve o caminho da ficha em PDF para a rota poder servi-la ao navegador.
  async caminhoPdf(id) {
    const servico = await prisma.servico.findUnique({ where: { id } });
    if (!servico) throw new Error('Serviço não encontrado.');
    if (!servico.caminhoPasta) throw new Error('Este serviço não tem pasta.');

    const caminho = path.join(servico.caminhoPasta, `${servico.numeroServico}.pdf`);
    if (!fs.existsSync(caminho)) throw new Error('A ficha em PDF ainda não foi gerada para este serviço.');

    return { caminho, nome: `${servico.numeroServico}.pdf` };
  },

  // Grava o orçamento inteiro: valores, itens (um por serviço da tela, com o
  // índice editado) e as parcelas. Itens e parcelas são substituídos em bloco
  // porque a tela sempre envia o conjunto completo — reconciliar item a item
  // deixaria resíduo de serviços que foram desmarcados.
  async salvarOrcamento(servicoId, dados) {
    const servico = await prisma.servico.findUnique({ where: { id: servicoId } });
    if (!servico) throw new Error('Serviço não encontrado.');

    const {
      valorReferencia, valorTotal, descontoValor, descontoPercentual, valorFinal,
      entradaValor, entradaData, numeroParcelas,
      jurosAtivo, taxaJuros, tipoJuros, baseJuros,
      itens, parcelas,
    } = dados;

    const atualizado = await prisma.$transaction(async (tx) => {
      await tx.servico.update({
        where: { id: servicoId },
        data: {
          valorReferencia: paraNumero(valorReferencia),
          valorTotal: paraNumero(valorTotal),
          descontoValor: paraNumero(descontoValor),
          descontoPercentual: paraNumero(descontoPercentual),
          valorFinal: paraNumero(valorFinal),
          entradaValor: paraNumero(entradaValor),
          entradaData: entradaData ? new Date(entradaData) : null,
          numeroParcelas: numeroParcelas ? Number(numeroParcelas) : null,
          jurosAtivo: Boolean(jurosAtivo),
          taxaJuros: paraNumero(taxaJuros),
          tipoJuros: tipoJuros || null,
          baseJuros: baseJuros || null,
        },
      });

      if (Array.isArray(itens)) {
        await tx.orcamentoItem.deleteMany({ where: { servicoId } });
        if (itens.length > 0) {
          await tx.orcamentoItem.createMany({
            data: itens.map((item) => ({
              servicoId,
              nome: item.nome,
              indice: paraNumero(item.indice) ?? 0,
              valor: paraNumero(item.valor) ?? 0,
              selecionado: Boolean(item.selecionado),
            })),
          });
        }
      }

      if (Array.isArray(parcelas)) {
        await tx.parcelaOrcamento.deleteMany({ where: { servicoId } });
        if (parcelas.length > 0) {
          await tx.parcelaOrcamento.createMany({
            data: parcelas.map((parcela) => ({
              servicoId,
              numero: Number(parcela.numero),
              valorBase: paraNumero(parcela.valorBase) ?? 0,
              juros: paraNumero(parcela.juros) ?? 0,
              valorFinal: paraNumero(parcela.valorFinal) ?? 0,
              vencimento: parcela.vencimento ? new Date(parcela.vencimento) : null,
            })),
          });
        }
      }

      return tx.servico.findUnique({
        where: { id: servicoId },
        include: { itensOrcamento: true, parcelas: { orderBy: { numero: 'asc' } } },
      });
    }, { timeout: 30000 });

    // A ficha em PDF é refeita para refletir desconto e valor final, que só
    // existem depois que o orçamento foi fechado.
    try {
      await gerarPdfServico(atualizado, caminhoImagemDoServico(atualizado));
    } catch (erro) {
      console.error(`Falha ao regerar o PDF do serviço ${atualizado.numeroServico}:`, erro);
    }

    return atualizado;
  },

  async criar(dados) {
    const {
      nomeCliente, tipoCliente, contato,
      matricula, terreno, possuiCar, possuiCertificacao, confrontaCertificacao,
      codRespTecnPossui, respTecnPossui, codRespTecn, respTecn, notas,
      area, municipio, linhaSecaKm, rioKm,
      servicosSelecionados, valorTotal, imagemBase64, arquivosKml
    } = dados;

    if (!nomeCliente || !municipio) {
      throw new Error("nomeCliente e municipio são obrigatórios.");
    }

    const tiposSolicitados = mapearTiposSolicitados(servicosSelecionados);
    const ano = new Date().getFullYear();

    const servico = await prisma.$transaction(async (tx) => {
      // 1) Cria com um numeroServico provisório só para reservar o
      // "sequencial" (gerado pelo Postgres via autoincrement, atômico e
      // sem risco de colisão mesmo com cadastros simultâneos). Esse valor
      // provisório nunca fica visível fora desta transação.
      const criado = await tx.servico.create({
        data: {
          numeroServico: `provisorio-${crypto.randomUUID()}`,
          nomeCliente,
          tipoCliente: tipoCliente || 'Padrão',
          contato,
          matricula,
          terreno: terreno || 'Urbano',
          possuiCar,
          possuiCertificacao,
          confrontaCertificacao,
          codRespTecnPossui,
          respTecnPossui,
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

      // 2) Com o sequencial real em mãos, monta o número definitivo e
      // cria a pasta do serviço com esse nome. Só ano-sequencial: o nome do
      // cliente não entra aqui, fica só como dado de busca (nomeCliente no
      // próprio Servico) — ver decidirOrcamento para a mesma regra no nome
      // do projeto do Kanban.
      const numeroServico = `${ano}-${String(criado.sequencial).padStart(3, '0')}`;
      const caminhoPasta = criarPastaServico(numeroServico);

      // O projeto no Kanban só nasce quando o orçamento é aprovado (ver
      // decidirOrcamento) — o cadastro em si não fabrica mais nada no Kanban.
      return tx.servico.update({
        where: { id: criado.id },
        data: { numeroServico, caminhoPasta }
      });
    });

    // 4) A ficha em PDF é gerada só depois do commit: escrever arquivo dentro
    // da transação deixaria um PDF órfão em disco se ela desse rollback. E uma
    // falha aqui não invalida o cadastro, que já está salvo — por isso o erro
    // é registrado em vez de derrubar a requisição.
    try {
      const caminhoImagem = salvarImagemServico(imagemBase64, servico.caminhoPasta, servico.numeroServico);
      const arquivoKml = salvarKmlServico(arquivosKml, servico.caminhoPasta);
      if (arquivoKml) {
        await prisma.servico.update({ where: { id: servico.id }, data: { arquivoKml } });
        servico.arquivoKml = arquivoKml;
      }
      await gerarPdfServico(servico, caminhoImagem);
    } catch (erro) {
      console.error(`Falha ao gerar o PDF do serviço ${servico.numeroServico}:`, erro);
    }

    return servico;
  },

  // Decide o orçamento: reprova só muda o status; aprova fabrica um projeto no
  // Kanban por tipo solicitado. O nome do projeto reaproveita ano+sequencial do
  // próprio numeroServico e insere no fim um número local a ESTE serviço (1, 2,
  // 3...), na ordem dos tipos aprovados — ex.: "2026-052-2" é o 2º processo
  // aprovado do serviço 2026-052 (não um contador global do tipo). Como o
  // sequencial do serviço já é único, isso já garante nomes sem colisão, sem
  // precisar de sigla nem de um contador global por tipo.
  async decidirOrcamento(servicoId, decisao) {
    const servico = await prisma.servico.findUnique({
      where: { id: servicoId },
      include: { workflows: true, itensOrcamento: true }
    });

    if (!servico) throw new Error("Serviço não encontrado.");

    if (decisao === 'REPROVADO') {
      const servicoAtualizado = await prisma.servico.update({
        where: { id: servicoId },
        data: { statusOrcamento: "REPROVADO" }
      });
      return {
        message: "Orçamento marcado como não aprovado.",
        servico: servicoAtualizado,
        projetos: []
      };
    }

    if (servico.statusOrcamento === "APROVADO") throw new Error("Este orçamento já foi aprovado.");

    // Os tipos que viram projeto vêm do orçamento (itensOrcamento.selecionado),
    // não de tiposSolicitados — esse último fica travado no que foi marcado no
    // cadastro e não acompanha o que o usuário de fato selecionou/ajustou na
    // tela de Orçamento. Mantém a ordem em que os itens foram registrados
    // (não reordena por ordem alfabética).
    const tiposDisponiveis = await workflowService.listarTiposDisponiveis();
    const tiposParaFabricar = servico.itensOrcamento
      .filter((item) => item.selecionado)
      .map((item) => MAPA_TIPOS_ABREVIADOS[item.nome])
      .filter((tipo) => tipo && tiposDisponiveis.includes(tipo));

    const [ano, sequencialGlobal] = servico.numeroServico.split('-');

    const { servicoAprovado, projetosGerados } = await prisma.$transaction(async (tx) => {
      const gerados = [];

      for (let i = 0; i < tiposParaFabricar.length; i++) {
        const tipoProcesso = tiposParaFabricar[i];
        const numeroDoProcesso = i + 1;
        const nomeProjeto = `${ano}-${sequencialGlobal}-${numeroDoProcesso}`;
        const projeto = await workflowService.fabricarProjeto(
          nomeProjeto, [tipoProcesso], servico.terreno || 'Urbano', servico.id, servico.matricula, tx,
        );
        gerados.push(projeto);
      }

      const atualizado = await tx.servico.update({
        where: { id: servicoId },
        data: { statusOrcamento: "APROVADO" }
      });

      return { servicoAprovado: atualizado, projetosGerados: gerados };
    }, { timeout: 30000 });

    return {
      message: `Orçamento aprovado! ${projetosGerados.length} projeto(s) no Kanban.`,
      servico: servicoAprovado,
      projetos: projetosGerados
    };
  }
};
