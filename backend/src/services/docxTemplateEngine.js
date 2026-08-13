// src/services/docxTemplateEngine.js
//
// Substitui tokens "#Placeholder" dentro de um .docx preservando toda a
// formatação original. Não usamos uma lib de template (docxtemplater etc.)
// porque os modelos usam "#Token" solto no meio do texto, sem um delimitador
// de fechamento — e porque o Word frequentemente quebra uma mesma palavra em
// várias tags <w:t> (ex.: revisão de ortografia), então um simples
// str.replace() por <w:t> corromperia tokens divididos no meio.
//
// Estratégia: concatena o texto de todas as tags <w:t> do documento como se
// fosse uma string só, localiza os tokens nessa string "achatada", e escreve
// o valor de volta nos runs originais (podendo abranger vários <w:t> ao mesmo
// tempo), sem tocar em mais nada do XML.
import JSZip from 'jszip';

// "w:t" precisa vir seguido de espaço (atributos) ou ">" — sem essa âncora,
// a regex também casava com <w:tabs>, <w:tbl>, <w:tc>, <w:tr>, <w:top> etc.
// (qualquer tag "w:t*"), consumindo tudo até o próximo "</w:t>" real e
// corrompendo a estrutura do documento (Word recusava o arquivo inteiro).
const REGEX_RUN = /<w:t(\s[^>]*)?>([\s\S]*?)<\/w:t>/g;

function escaparXml(texto) {
  return String(texto)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function desescaparXml(texto) {
  return texto
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

// Substitui, em uma única passada por token (do mais longo pro mais curto —
// necessário porque "#termoTitulo" é prefixo de "#termoTituloCunjogado"),
// todas as ocorrências de um token nos runs de texto do XML.
function substituirTokenNosRuns(runs, token, valor) {
  let alterado = true;
  while (alterado) {
    alterado = false;

    const textoAchatado = runs.map((r) => r.texto).join('');
    const posicao = textoAchatado.indexOf(token);
    if (posicao === -1) break;

    // Descobre em quais runs [inicio..fim] a ocorrência cai.
    let acumulado = 0;
    let runInicio = -1;
    let offsetInicio = 0;
    let runFim = -1;
    let offsetFim = 0;

    for (let i = 0; i < runs.length; i++) {
      const tamanho = runs[i].texto.length;
      const inicioRun = acumulado;
      const fimRun = acumulado + tamanho;

      if (runInicio === -1 && posicao < fimRun) {
        runInicio = i;
        offsetInicio = posicao - inicioRun;
      }
      if (posicao + token.length <= fimRun) {
        runFim = i;
        offsetFim = posicao + token.length - inicioRun;
        break;
      }
      acumulado = fimRun;
    }

    if (runInicio === -1 || runFim === -1) break;

    const prefixo = runs[runInicio].texto.slice(0, offsetInicio);
    const sufixo = runs[runFim].texto.slice(offsetFim);

    if (runInicio === runFim) {
      runs[runInicio].texto = prefixo + valor + sufixo;
    } else {
      runs[runInicio].texto = prefixo + valor;
      for (let i = runInicio + 1; i < runFim; i++) runs[i].texto = '';
      runs[runFim].texto = sufixo;
    }

    alterado = true;
  }
}

// valores: objeto { NomeDoPlaceholder: valorString } — sem o "#" na chave.
function substituirPlaceholders(xml, valores) {
  const runs = [];
  const matches = [...xml.matchAll(REGEX_RUN)];
  for (const m of matches) {
    runs.push({ attrs: m[1] || '', texto: desescaparXml(m[2]) });
  }

  const tokens = Object.keys(valores).sort((a, b) => b.length - a.length);
  for (const chave of tokens) {
    const valor = valores[chave] == null ? '' : String(valores[chave]);
    substituirTokenNosRuns(runs, `#${chave}`, valor);
  }

  let i = 0;
  const novoXml = xml.replace(REGEX_RUN, () => {
    const run = runs[i++];
    return serializarRun(run.attrs, run.texto);
  });

  return novoXml;
}

// Um "\n" dentro do texto substituído não vira quebra de linha no Word — ele
// só entende a tag própria <w:br/>. Por isso cada linha vira seu próprio
// <w:t>, separado por <w:br/>; como só trocamos o miolo <w:t>...</w:t>, tudo
// continua dentro do mesmo <w:r> original (estrutura válida do OOXML).
function serializarRun(attrsOriginais, texto) {
  // Runs já podem trazer xml:space="preserve" nos atributos originais —
  // repeti-lo geraria um atributo duplicado (XML inválido) e o Word recusa
  // o arquivo inteiro. Só adiciona quando ainda não está lá.
  const attrs = /xml:space\s*=/.test(attrsOriginais) ? attrsOriginais : `${attrsOriginais} xml:space="preserve"`;
  return texto
    .split('\n')
    .map((linha) => `<w:t${attrs}>${escaparXml(linha)}</w:t>`)
    .join('<w:br/>');
}

// Lê o .docx de `caminhoTemplate`, substitui os placeholders e devolve o novo
// .docx como Buffer, pronto para download — nada é gravado em disco.
async function gerarDocx(caminhoTemplateBuffer, valores) {
  const zip = await JSZip.loadAsync(caminhoTemplateBuffer);
  const arquivoXml = zip.file('word/document.xml');
  if (!arquivoXml) throw new Error('Modelo inválido: word/document.xml não encontrado.');

  const xmlOriginal = await arquivoXml.async('string');
  const xmlFinal = substituirPlaceholders(xmlOriginal, valores);
  zip.file('word/document.xml', xmlFinal);

  return zip.generateAsync({ type: 'nodebuffer' });
}

export const docxTemplateEngine = { gerarDocx };
