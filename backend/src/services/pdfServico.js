// Gera a ficha em PDF do serviço, salva dentro da pasta do próprio serviço.
// O layout replica a ficha usada pela empresa: paisagem, com a imagem do mapa
// ocupando a esquerda e a tabela de dados à direita.
import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';

const ESCURO = '#0F172A';
const TEXTO = '#1E293B';
const CINZA = '#64748B';
const GRADE = '#94A3B8';
const FUNDO_ROTULO = '#F1F5F9';
const FUNDO_DESTAQUE = '#E8EEF9';
const BRANCO = '#FFFFFF';

const MARGEM = 28;
const TABELA_W = 300;
const LINHA_H = 16;
const LINHA_AREA_H = 24;
const CABECALHO_H = 30;

// Larguras das colunas dentro da tabela (somam TABELA_W). Perímetros e grade de
// serviços usam a mesma divisão para as bordas verticais se alinharem.
const COL_ROTULO = 90;
const COL_VALOR = 60;

// Grade de serviços da ficha impressa: é um checklist fixo da empresa, por isso
// aparece inteiro mesmo quando o cadastro selecionou poucos itens. Só entram
// aqui os processos que de fato existem no sistema (mesmas chaves de
// MAPA_TIPOS_ABREVIADOS em servicoService.js) — nada de item decorativo sem
// equivalente cadastrado.
const GRADE_SERVICOS = [
  [['RET', '1,5', 'Retificação'], ['UNI', '1,0', 'Unificação']],
  [['DESM', '1,0', 'Desmembramento'], ['USU', '1,0', 'Usucapião']],
  [['ALT DIV', '1,0', 'Alteração de Divisas'], ['CAR', '0,5', 'CAR']],
  [['CERT', '1,0', 'Certificação INCRA'], ['ESCR', '1,0', 'Escritura']],
  [['CONF', '1,0', 'Conferência'], ['CAD', '1,0', 'Cadastral']],
  [['LOC', '1,0', 'Locação'], ['MOV TERRA', '1,0', 'Movimentação de Terra']],
  [['OUTROS', null, 'Outros'], ['EXT', null, 'Extremação']],
];

const SIGLAS = {
  'Retificação': 'RET',
  'Desmembramento': 'DESM',
  'Unificação': 'UNI',
  'Usucapião': 'USU',
  'Alteração de Divisas': 'ALT DIV',
  'CAR': 'CAR',
  'Certificação INCRA': 'CERT',
  'Escritura': 'ESCR',
  'Conferência': 'CONF',
  'Cadastral': 'CAD',
  'Locação': 'LOC',
  'Movimentação de Terra': 'MOV TERRA',
  'Outros': 'OUTROS',
  'Extremação': 'EXT',
};

function numeroBr(valor, casas = 2) {
  if (valor === null || valor === undefined || valor === '') return '';
  return Number(valor).toLocaleString('pt-BR', {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  });
}

function moeda(valor) {
  if (valor === null || valor === undefined || valor === '') return '';
  return `R$ ${numeroBr(valor)}`;
}

// Formata em UTC de propósito: as datas são gravadas como meia-noite UTC e, no
// fuso local (UTC-3), a conversão jogaria todo vencimento para o dia anterior.
function data(valor) {
  if (!valor) return '';
  return new Date(valor).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

function moldura(doc, x, y, w, h, fundo) {
  if (fundo) doc.rect(x, y, w, h).fillColor(fundo).fill();
  doc.rect(x, y, w, h).strokeColor(GRADE).lineWidth(0.5).stroke();
}

// Texto centralizado verticalmente na célula. lineBreak:false é essencial: sem
// ele um texto longo quebra linha, estoura a célula e o pdfkit cria uma página.
function texto(doc, conteudo, x, y, w, h, opcoes = {}) {
  const { tamanho = 8, negrito = false, cor = TEXTO, align = 'left' } = opcoes;
  doc.font(negrito ? 'Helvetica-Bold' : 'Helvetica').fontSize(tamanho).fillColor(cor);
  const alturaLinha = doc.currentLineHeight();
  doc.text(String(conteudo ?? ''), x + 5, y + (h - alturaLinha) / 2, {
    width: w - 10,
    align,
    lineBreak: false,
    ellipsis: true,
  });
}

// Célula "Rótulo: valor" numa linha só, com o rótulo em negrito.
function linhaRotulada(doc, rotulo, valor, x, y, w, h) {
  moldura(doc, x, y, w, h);
  doc.font('Helvetica-Bold').fontSize(8).fillColor(CINZA);
  const alturaLinha = doc.currentLineHeight();
  const topo = y + (h - alturaLinha) / 2;
  const larguraRotulo = doc.widthOfString(`${rotulo} `);
  doc.text(rotulo, x + 5, topo, { lineBreak: false });
  doc.font('Helvetica-Bold').fillColor(ESCURO).text(String(valor ?? ''), x + 5 + larguraRotulo, topo, {
    width: w - 10 - larguraRotulo,
    lineBreak: false,
    ellipsis: true,
  });
}

// Sigla do serviço com o índice em subscrito, como "RET(1,5)".
function siglaComIndice(doc, sigla, indice, x, y, w, h) {
  doc.font('Helvetica-Bold').fontSize(8).fillColor(TEXTO);
  const alturaLinha = doc.currentLineHeight();
  const topo = y + (h - alturaLinha) / 2;
  doc.text(sigla, x + 5, topo, { lineBreak: false });

  if (indice) {
    const larguraSigla = doc.widthOfString(sigla);
    doc.font('Helvetica').fontSize(5.5).fillColor(CINZA)
      .text(`(${indice})`, x + 5 + larguraSigla + 0.5, topo + 3, { lineBreak: false });
  }
}

// A imagem preenche todo o painel: escala para cobrir a caixa e o excedente é
// recortado pelo clip. O clip explícito garante que nada vaze sobre a tabela.
function desenharImagem(doc, caminhoImagem, x, y, w, h) {
  if (caminhoImagem && fs.existsSync(caminhoImagem)) {
    try {
      doc.save();
      doc.rect(x, y, w, h).clip();
      doc.image(caminhoImagem, x, y, { cover: [w, h], align: 'center', valign: 'center' });
      doc.restore();
      return;
    } catch (erro) {
      // Formato não suportado pelo pdfkit (só JPEG e PNG): cai no aviso abaixo
      // em vez de derrubar a ficha inteira.
      doc.restore();
      console.error('Não foi possível embutir a imagem no PDF:', erro.message);
    }
  }

  doc.rect(x, y, w, h).fillColor('#F8FAFC').fill();
  doc.font('Helvetica').fontSize(10).fillColor(GRADE);
  doc.text('Nenhuma imagem anexada ao serviço.', x, y + h / 2 - 6, { width: w, align: 'center' });
}

// Resumo do parcelamento em uma linha, para não competir com a tabela.
function resumoPagamento(servico) {
  const partes = [];
  if (servico.entradaValor) {
    partes.push(`entrada de ${moeda(servico.entradaValor)}${servico.entradaData ? ` em ${data(servico.entradaData)}` : ''}`);
  }
  if (servico.numeroParcelas && servico.parcelas?.length) {
    const primeira = servico.parcelas[0];
    partes.push(`${servico.numeroParcelas}x de ${moeda(primeira.valorFinal)}`);
  }
  if (servico.jurosAtivo && servico.taxaJuros) {
    partes.push(`juros ${numeroBr(servico.taxaJuros, 1)}% ${servico.tipoJuros || ''}`.trim());
  }
  return partes.length ? `Pagamento: ${partes.join(' + ')}.` : null;
}

function criarDocumento(servico) {
  return new PDFDocument({
    size: 'A4',
    layout: 'landscape',
    margin: MARGEM,
    info: {
      Title: `Ficha do Serviço ${servico.numeroServico}`,
      Author: 'CCF Consultores',
      Subject: `Cadastro de serviço — ${servico.nomeCliente}`,
    },
  });
}

// Todo o desenho fica aqui para servir tanto à ficha gravada em disco quanto à
// prévia em memória, sem duplicar layout entre os dois caminhos.
function desenharFicha(doc, servico, caminhoImagem) {
  const alturaTotal = doc.page.height - MARGEM * 2;
  const tabelaX = doc.page.width - MARGEM - TABELA_W;
  const imagemW = tabelaX - MARGEM;

  desenharImagem(doc, caminhoImagem, MARGEM, MARGEM, imagemW, alturaTotal);

  const selecionados = servico.tiposSolicitados || [];
  const siglas = selecionados.map((tipo) => SIGLAS[tipo] || tipo);

  let y = MARGEM;

  // Cabeçalho escuro com o número do serviço em destaque.
  doc.rect(tabelaX, y, TABELA_W, CABECALHO_H).fillColor(ESCURO).fill();
  doc.font('Helvetica').fontSize(6).fillColor('#94A3B8')
    .text('Nº DO SERVIÇO', tabelaX + 8, y + 6, { characterSpacing: 0.8, lineBreak: false });
  doc.font('Helvetica-Bold').fontSize(11).fillColor(BRANCO)
    .text(servico.numeroServico, tabelaX + 8, y + 15, { width: TABELA_W - 16, lineBreak: false, ellipsis: true });
  y += CABECALHO_H;

  linhaRotulada(doc, 'Serviços:', siglas.join(', '), tabelaX, y, TABELA_W, LINHA_H);
  y += LINHA_H;
  linhaRotulada(doc, 'Interessado:', servico.nomeCliente, tabelaX, y, TABELA_W, LINHA_H);
  y += LINHA_H;
  linhaRotulada(doc, 'Contato:', servico.contato, tabelaX, y, TABELA_W, LINHA_H);
  y += LINHA_H;

  // Área
  moldura(doc, tabelaX, y, COL_ROTULO, LINHA_AREA_H, FUNDO_ROTULO);
  texto(doc, 'ÁREA', tabelaX, y, COL_ROTULO, LINHA_AREA_H, { align: 'center', tamanho: 7, cor: CINZA, negrito: true });
  moldura(doc, tabelaX + COL_ROTULO, y, TABELA_W - COL_ROTULO, LINHA_AREA_H);
  texto(doc, servico.area ? `${numeroBr(servico.area)} m²` : '', tabelaX + COL_ROTULO, y, TABELA_W - COL_ROTULO, LINHA_AREA_H, {
    align: 'center', negrito: true, tamanho: 10, cor: ESCURO,
  });
  y += LINHA_AREA_H;

  // Perímetros
  for (const [rotulo, indice, valor] of [
    ['L. Seca', '2,0', servico.linhaSecaKm],
    ['Rio', '2,0', servico.rioKm],
  ]) {
    let x = tabelaX;
    moldura(doc, x, y, COL_ROTULO, LINHA_H, FUNDO_ROTULO);
    siglaComIndice(doc, rotulo, indice, x, y, COL_ROTULO, LINHA_H);
    x += COL_ROTULO;

    moldura(doc, x, y, COL_VALOR, LINHA_H);
    texto(doc, valor ? numeroBr(valor) : '', x, y, COL_VALOR, LINHA_H, { align: 'center', negrito: true });
    x += COL_VALOR;

    moldura(doc, x, y, COL_ROTULO, LINHA_H);
    texto(doc, 'km =', x, y, COL_ROTULO, LINHA_H, { cor: CINZA });
    x += COL_ROTULO;

    moldura(doc, x, y, COL_VALOR, LINHA_H);
    y += LINHA_H;
  }

  // Checklist de serviços
  for (const linha of GRADE_SERVICOS) {
    let x = tabelaX;

    for (const [sigla, indice, nomeCompleto] of linha) {
      moldura(doc, x, y, COL_ROTULO, LINHA_H, sigla ? FUNDO_ROTULO : null);
      if (sigla) siglaComIndice(doc, sigla, indice, x, y, COL_ROTULO, LINHA_H);
      x += COL_ROTULO;

      const marcado = nomeCompleto && selecionados.includes(nomeCompleto);
      moldura(doc, x, y, COL_VALOR, LINHA_H, marcado ? FUNDO_DESTAQUE : null);
      if (marcado) {
        texto(doc, 'X', x, y, COL_VALOR, LINHA_H, { negrito: true, align: 'center', tamanho: 9, cor: '#1D4ED8' });
      }
      x += COL_VALOR;
    }

    y += LINHA_H;
  }

  // Valores. O final ganha destaque: é o número que importa na ficha.
  for (const [rotulo, valor, destaque] of [
    ['Valor Total', moeda(servico.valorTotal), false],
    ['Desconto', servico.descontoValor
      ? `${moeda(servico.descontoValor)}${servico.descontoPercentual ? ` (${numeroBr(servico.descontoPercentual, 1)}%)` : ''}`
      : '', false],
    ['Valor Final', moeda(servico.valorFinal), true],
  ]) {
    const fundo = destaque ? FUNDO_DESTAQUE : FUNDO_ROTULO;
    moldura(doc, tabelaX, y, COL_ROTULO, LINHA_H, fundo);
    texto(doc, rotulo.toUpperCase(), tabelaX, y, COL_ROTULO, LINHA_H, {
      negrito: true, tamanho: 7, cor: destaque ? '#1D4ED8' : CINZA,
    });
    moldura(doc, tabelaX + COL_ROTULO, y, TABELA_W - COL_ROTULO, LINHA_H, destaque ? FUNDO_DESTAQUE : null);
    texto(doc, valor, tabelaX + COL_ROTULO, y, TABELA_W - COL_ROTULO, LINHA_H, {
      align: 'center', negrito: true, tamanho: destaque ? 10 : 8, cor: destaque ? '#1D4ED8' : ESCURO,
    });
    y += LINHA_H;
  }

  // Observações ocupam toda a altura restante da tabela.
  const alturaNotas = MARGEM + alturaTotal - y;
  moldura(doc, tabelaX, y, TABELA_W, alturaNotas);

  doc.font('Helvetica-Bold').fontSize(6).fillColor(CINZA)
    .text('OBSERVAÇÕES', tabelaX + 5, y + 6, { characterSpacing: 0.8, lineBreak: false });

  const pagamento = resumoPagamento(servico);
  const partes = [
    `Matrícula: ${servico.matricula || '—'}`,
    `Terreno: ${servico.terreno || '—'}   |   Município: ${servico.municipio || '—'}`,
    servico.possuiCar ? `Possui CAR: ${servico.possuiCar}` : null,
    servico.possuiCertificacao ? `Possui certificação: ${servico.possuiCertificacao}` : null,
    servico.possuiCertificacao && (servico.respTecnPossui || servico.codRespTecnPossui)
      ? `Resp. técnico da certificação: ${servico.respTecnPossui || 's/ nome'} (${servico.codRespTecnPossui || 's/ código'})`
      : null,
    servico.confrontaCertificacao ? `Confronta com certificação: ${servico.confrontaCertificacao}` : null,
    servico.confrontaCertificacao && (servico.respTecn || servico.codRespTecn)
      ? `Resp. técnico do confronto: ${servico.respTecn || 's/ nome'} (${servico.codRespTecn || 's/ código'})`
      : null,
    pagamento,
    '',
    servico.notas || 'Sem observações registradas.',
  ].filter((parte) => parte !== null);

  doc.font('Helvetica').fontSize(8).fillColor(TEXTO);
  doc.text(partes.join('\n'), tabelaX + 5, y + 18, {
    width: TABELA_W - 10,
    height: alturaNotas - 24,
    lineGap: 2,
    ellipsis: true,
  });

  // Molduras externas por cima da grade: separam os dois painéis com um traço
  // mais firme do que as linhas internas da tabela.
  doc.rect(MARGEM, MARGEM, imagemW, alturaTotal).strokeColor(ESCURO).lineWidth(1).stroke();
  doc.rect(tabelaX, MARGEM, TABELA_W, alturaTotal).strokeColor(ESCURO).lineWidth(1).stroke();
}

export async function gerarPdfServico(servico, caminhoImagem = null) {
  if (!servico?.caminhoPasta) {
    throw new Error('Serviço sem caminhoPasta — não há onde salvar o PDF.');
  }

  const caminhoPdf = path.join(servico.caminhoPasta, `${servico.numeroServico}.pdf`);
  const doc = criarDocumento(servico);
  const stream = fs.createWriteStream(caminhoPdf);
  doc.pipe(stream);

  desenharFicha(doc, servico, caminhoImagem);
  doc.end();

  await new Promise((resolve, reject) => {
    stream.on('finish', resolve);
    stream.on('error', reject);
  });

  return caminhoPdf;
}

// Mesma ficha, devolvida em memória: usada pela prévia do Orçamento, que muda a
// cada tecla e não deve tocar no arquivo definitivo do serviço.
export async function gerarPdfServicoBuffer(servico, caminhoImagem = null) {
  const doc = criarDocumento(servico);
  const pedacos = [];

  doc.on('data', (pedaco) => pedacos.push(pedaco));
  const pronto = new Promise((resolve, reject) => {
    doc.on('end', resolve);
    doc.on('error', reject);
  });

  desenharFicha(doc, servico, caminhoImagem);
  doc.end();
  await pronto;

  return Buffer.concat(pedacos);
}
