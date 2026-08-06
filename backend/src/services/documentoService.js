// src/services/documentoService.js
//
// Gera, a partir dos modelos em "Modelos/", os documentos preenchidos com os
// dados do Serviço vinculado (proprietário, imóvel, confrontantes). Cada
// modelo é o arquivo original, byte a byte, exceto pelos tokens "#Placeholder"
// substituídos — nada de layout, texto fixo ou formatação é alterado.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { prisma } from '../prisma.js';
import { docxTemplateEngine } from './docxTemplateEngine.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PASTA_MODELOS = path.join(__dirname, '../../Modelos');
// Mesma pasta onde a ficha em PDF e a imagem do mapa do serviço já são
// salvas (ver PASTA_SERVICOS em servicoService.js) — precisa ser a mesma
// variável de ambiente, senão os dois serviços gravam em lugares diferentes.
const PASTA_BASE_SERVICOS = process.env.PASTA_SERVICOS || path.join(__dirname, '../../servicos');

// autorizacao_realizacao_car.doc fica de fora: é .doc binário (Word 97-2003),
// não um .docx (zip) — o motor de substituição não consegue abrir esse
// formato. Precisa ser resalvo como .docx antes de entrar no catálogo.
const TEMPLATES = {
  retificacao_risbs: {
    nome: 'Requerimento de Retificação (RISBS)',
    arquivo: 'requerimento_de_retificacao_risbs.docx',
  },
  unificacao_risbs: {
    nome: 'Requerimento de Unificação (RISBS)',
    arquivo: 'requerimento_de_unificacao_risbs.docx',
  },
  unificacao_pmsbs: {
    nome: 'Requerimento de Unificação (PMSBS)',
    arquivo: 'requerimento_de_unificacao_pmsbs.docx',
  },
  retificacao_pmsbs: {
    nome: 'Requerimento de Retificação (PMSBS)',
    arquivo: 'requerimento_retificacao_pmsbs.docx',
  },
  parcelamento_solo_risbs: {
    nome: 'Requerimento de Parcelamento de Solo (RISBS)',
    arquivo: 'requerimento_de_parcelamento_de_solo_risbs.docx',
  },
  parcelamento_solo_pmsbs: {
    nome: 'Requerimento de Parcelamento do Solo (PMSBS)',
    arquivo: 'requerimento_de_parcelamento_do_solo_pmsbs.docx',
  },
  consulta_previa_pmsbs: {
    nome: 'Requerimento de Consulta Prévia (PMSBS)',
    arquivo: 'requerimento_de_consulta_previa_pmsbs.docx',
  },
  atualizacao_confrontacoes_risbs: {
    nome: 'Requerimento de Atualização de Confrontações (RISBS)',
    arquivo: 'requerimento_de_atualizacao_de_confrontacoes_risbs.docx',
  },
  averbacoes_risbs: {
    nome: 'Requerimento de Averbações (RISBS)',
    arquivo: 'requerimento_de_averbacoes_risbs.docx',
  },
  futura_regularizacao_benfeitoria_risbs: {
    nome: 'Requerimento de Futura Regularização de Benfeitoria (RISBS)',
    arquivo: 'requerimento_de_futura_regularizacao_de_benfeitoria_risbs.docx',
  },
  declaracao_diferencas_medidas: {
    nome: 'Declaração de Diferenças de Medidas',
    arquivo: 'declaracao_de_diferencas_medidas.docx',
  },
  declaracao_inexistencia_acao_judicial_risbs: {
    nome: 'Declaração de Inexistência de Ação Judicial (RISBS)',
    arquivo: 'declaracao_de_inexistencia_de_acao_judicial_risbs.docx',
  },
  declaracao_nao_invasao_area_vizinha_risbs: {
    nome: 'Declaração de Não Invasão de Área Vizinha (RISBS)',
    arquivo: 'declaracao_de_nao_invasao_de_area_vizinha_risbs.docx',
  },
  declaracao_nao_invasao_divisas_publicas_risbs: {
    nome: 'Declaração de Não Invasão de Divisas Públicas (RISBS)',
    arquivo: 'declaracao_de_nao_invasao_de_divisas_publicas_risbs.docx',
  },
  declaracao_responsabilidade_informacoes_risbs: {
    nome: 'Declaração de Responsabilidade pelas Informações (RISBS)',
    arquivo: 'declaracao_de_responsabilidade_pelas_informacoes_risbs.docx',
  },
  declaracao_rio: {
    nome: 'Declaração de Rio',
    arquivo: 'declaracao_de_rio.docx',
  },
  memorial_descritivo_retificacao: {
    nome: 'Memorial Descritivo de Retificação',
    arquivo: 'memorial_descritivo_retificacao.docx',
  },
  protocolo_entrega_servico: {
    nome: 'Protocolo de Entrega de Serviço',
    arquivo: 'protocolo_de_entrega_de_servico.docx',
  },
  informacao_mapa: {
    nome: 'Informação de Mapa',
    arquivo: 'informacao_mapa.docx',
  },
  dossie: {
    nome: 'Dossiê',
    arquivo: 'dossiê.docx',
  },
};

const UF_PADRAO = 'SC';

function enderecoCompleto(pessoa) {
  return [pessoa.logradouro, pessoa.municipio, pessoa.cep ? `CEP ${pessoa.cep}` : null]
    .filter(Boolean)
    .join(', ');
}

// Redação padrão de mercado — o usuário revisa/ajusta depois de ver o
// resultado (decisão tomada na conversa: "monte um texto padrão agora").
function qualificacaoCompleta(pessoa) {
  if (!pessoa) return '';

  if (pessoa.tipo === 'Jurídica') {
    const partes = [
      pessoa.nome,
      'pessoa jurídica de direito privado',
      pessoa.documento ? `inscrita no CNPJ sob o nº ${pessoa.documento}` : null,
      pessoa.representanteLegalNome ? `neste ato representada por ${pessoa.representanteLegalNome}` : null,
      pessoa.representanteLegalCpf ? `CPF ${pessoa.representanteLegalCpf}` : null,
      pessoa.representanteLegalCargo ? `na qualidade de ${pessoa.representanteLegalCargo}` : null,
      enderecoCompleto(pessoa) ? `com sede em ${enderecoCompleto(pessoa)}` : null,
    ];
    return partes.filter(Boolean).join(', ');
  }

  const partes = [
    pessoa.nome,
    pessoa.nacionalidade || 'brasileiro(a)',
    pessoa.estadoCivil || null,
    pessoa.profissao || null,
    pessoa.rg ? `portador(a) da Cédula de Identidade RG nº ${pessoa.rg}` : null,
    pessoa.documento ? `inscrito(a) no CPF sob o nº ${pessoa.documento}` : null,
    enderecoCompleto(pessoa) ? `residente e domiciliado(a) em ${enderecoCompleto(pessoa)}` : null,
  ];
  return partes.filter(Boolean).join(', ');
}

function qualificacaoLista(pessoas) {
  return pessoas.filter(Boolean).map(qualificacaoCompleta).join('; ');
}

function assinaturaCompleta(pessoas) {
  return pessoas
    .filter(Boolean)
    .map((p) => {
      const rotuloDocumento = p.tipo === 'Jurídica' ? 'CNPJ' : 'CPF';
      const linhas = ['______________________________', p.nome];
      if (p.documento) linhas.push(`${rotuloDocumento}: ${p.documento}`);
      return linhas.join('\n');
    })
    .join('\n\n');
}

function municipioEData(municipio) {
  const hoje = new Date();
  const dataExtenso = hoje.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
  return `${municipio || ''}, ${dataExtenso}.`;
}

function numeroBr(valor, casas = 2) {
  if (valor === null || valor === undefined || valor === '') return '';
  return Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });
}

// "matriculado"/"transcrito" — forma conjugada usada no meio da frase quando
// o modelo já traz a preposição em volta (ex.: "no terreno #termoTituloCunjogado
// neste Cartório sob nº ..."), diferente de #termoTitulo que é usado como
// substantivo solto ("constante na matrícula ...").
function termoTituloConjugado(tipoTitulo) {
  return tipoTitulo === 'transcrição' ? 'transcrito' : 'matriculado';
}

// O modelo já traz sua própria tabela com colunas Fone/Fonte/Matrícula/
// WhatsApp/In loco (em branco, para preencher à mão durante o contato) — essa
// linha serve só para identificar de quem é a linha, daí só o nome.
function dossiePessoas(pessoas) {
  return pessoas
    .filter(Boolean)
    .map((p) => p.nome)
    .join('\n');
}

// Reúne os campos comuns à maioria dos modelos (proprietário, imóvel, datas).
// Cada montador específico parte disso e sobrepõe/acrescenta só o que muda.
function valoresComuns(servico) {
  const proprietario = servico.proprietario;
  const imovel = servico.imovel;
  const confrontantes = imovel?.confrontantes || [];
  const proprietarios = proprietario ? [proprietario] : [];
  const municipio = imovel?.municipio || servico.municipio;

  return {
    NumeroTitulo: imovel?.matricula || '',
    termoTitulo: imovel?.tipoTitulo || 'matrícula',
    termoTituloCunjogado: termoTituloConjugado(imovel?.tipoTitulo),
    QualificacaoCompletaProprietarios: qualificacaoLista(proprietarios),
    QualificacaoCompletaConfrontantes: qualificacaoLista(confrontantes),
    AssinaturaCompletaProprietarios: assinaturaCompleta(proprietarios),
    NomeCompletoProprietarios: proprietarios.map((p) => p.nome).join(' e '),
    CPFCNPJPrimeiroProprietario: proprietario?.documento || '',
    NomePrimeiroProprietario: proprietario?.nome || '',
    EnderecoPrimeiroProprietario: proprietario ? enderecoCompleto(proprietario) : '',
    EnderecoImovel: imovel ? [imovel.logradouro, imovel.municipio].filter(Boolean).join(', ') : '',
    CodigoDeCadastro: imovel?.cib || '',
    Comarca: imovel?.comarca || '',
    Zoneamento: imovel?.zoneamento || '',
    MunicipioEUF: municipio ? `${municipio} - ${UF_PADRAO}` : '',
    AreaMedida: servico.area != null ? `${numeroBr(servico.area)} m²` : '',
    MunicipioEData: municipioEData(municipio),
  };
}

function exigirProprietarioEImovel(servico) {
  if (!servico.proprietario) throw new Error('Vincule um proprietário ao serviço antes de gerar o documento.');
  if (!servico.imovel) throw new Error('Vincule um imóvel ao serviço antes de gerar o documento.');
}

// --- Montadores específicos por modelo -------------------------------------

function montarRetificacaoRisbs(servico) {
  exigirProprietarioEImovel(servico);
  return {
    ...valoresComuns(servico),
    DescricaoAtualDoImovel: servico.descricaoAtualImovel || '',
    MemorialDescritivoRetificacao: servico.memorialDescritivoRetificacao || '',
    SuperiorOuInferior: servico.superiorOuInferior || 'superior',
  };
}

function montarComQualificacaoEConjugacao(servico) {
  exigirProprietarioEImovel(servico);
  return valoresComuns(servico);
}

function montarRetificacaoPmsbs(servico) {
  exigirProprietarioEImovel(servico);
  return valoresComuns(servico);
}

function montarParcelamentoSoloPmsbs(servico) {
  exigirProprietarioEImovel(servico);
  return {
    ...valoresComuns(servico),
    Req_PMSBS_DESM_Áreas: servico.areasDesmembramento || '',
  };
}

function montarConsultaPreviaPmsbs(servico) {
  exigirProprietarioEImovel(servico);
  return {
    ...valoresComuns(servico),
    Total_de_Lotes: servico.totalLotes != null ? String(servico.totalLotes) : '',
  };
}

function montarAverbacoesRisbs(servico) {
  exigirProprietarioEImovel(servico);
  return {
    ...valoresComuns(servico),
    'Averbações': servico.averbacoes || '',
  };
}

function montarDiferencasMedidas(servico) {
  if (!servico.imovel) throw new Error('Vincule um imóvel ao serviço antes de gerar o documento.');
  return valoresComuns(servico);
}

function montarMemorialDescritivoRetificacao(servico) {
  if (!servico.imovel) throw new Error('Vincule um imóvel ao serviço antes de gerar o documento.');
  return {
    ...valoresComuns(servico),
    MemorialDescritivoRetificacao: servico.memorialDescritivoRetificacao || '',
  };
}

function montarProtocoloEntregaServico(servico) {
  exigirProprietarioEImovel(servico);
  return {
    ...valoresComuns(servico),
    ListaProtocoloDeEntrega: servico.listaProtocoloEntrega || '',
  };
}

// Sem placeholder explícito de qualificação — a Assinatura já reaproveita o
// nome do proprietário/confrontantes vindo de valoresComuns.
function montarInformacaoMapa(servico) {
  exigirProprietarioEImovel(servico);
  const proprietarios = [servico.proprietario];
  const confrontantes = servico.imovel.confrontantes || [];
  return {
    ...valoresComuns(servico),
    AssinaturaMapaProprietario: assinaturaCompleta(proprietarios),
    AssinaturaMapaConfrontante: assinaturaCompleta(confrontantes),
    InformacaoMapaConfrontate: qualificacaoLista(confrontantes),
  };
}

function montarDossie(servico) {
  exigirProprietarioEImovel(servico);
  const proprietarios = [servico.proprietario];
  const confrontantes = servico.imovel.confrontantes || [];
  return {
    DossieProprietario: dossiePessoas(proprietarios),
    DossieConfrontante: dossiePessoas(confrontantes),
  };
}

const MONTADORES = {
  retificacao_risbs: montarRetificacaoRisbs,
  unificacao_risbs: montarComQualificacaoEConjugacao,
  unificacao_pmsbs: montarComQualificacaoEConjugacao,
  retificacao_pmsbs: montarRetificacaoPmsbs,
  parcelamento_solo_risbs: montarComQualificacaoEConjugacao,
  parcelamento_solo_pmsbs: montarParcelamentoSoloPmsbs,
  consulta_previa_pmsbs: montarConsultaPreviaPmsbs,
  atualizacao_confrontacoes_risbs: montarComQualificacaoEConjugacao,
  averbacoes_risbs: montarAverbacoesRisbs,
  futura_regularizacao_benfeitoria_risbs: montarComQualificacaoEConjugacao,
  declaracao_diferencas_medidas: montarDiferencasMedidas,
  declaracao_inexistencia_acao_judicial_risbs: montarComQualificacaoEConjugacao,
  declaracao_nao_invasao_area_vizinha_risbs: montarComQualificacaoEConjugacao,
  declaracao_nao_invasao_divisas_publicas_risbs: montarDiferencasMedidas,
  declaracao_responsabilidade_informacoes_risbs: montarComQualificacaoEConjugacao,
  declaracao_rio: montarDiferencasMedidas,
  memorial_descritivo_retificacao: montarMemorialDescritivoRetificacao,
  protocolo_entrega_servico: montarProtocoloEntregaServico,
  informacao_mapa: montarInformacaoMapa,
  dossie: montarDossie,
};

export const documentoService = {
  listarTemplates() {
    return Object.entries(TEMPLATES).map(([chave, { nome }]) => ({ chave, nome }));
  },

  async gerar(servicoId, templateKey) {
    const template = TEMPLATES[templateKey];
    if (!template) throw new Error('Modelo de documento não encontrado.');

    const servico = await prisma.servico.findUnique({
      where: { id: servicoId },
      include: {
        proprietario: true,
        imovel: { include: { confrontantes: true } },
      },
    });
    if (!servico) throw new Error('Serviço não encontrado.');

    const valores = MONTADORES[templateKey](servico);

    const caminhoTemplate = path.join(PASTA_MODELOS, template.arquivo);
    const templateBuffer = fs.readFileSync(caminhoTemplate);
    const docxGerado = await docxTemplateEngine.gerarDocx(templateBuffer, valores);
    const nomeArquivo = `${template.nome} - ${servico.numeroServico}.docx`;

    // Salva na pasta do próprio serviço, do mesmo jeito que a ficha em PDF —
    // se o serviço ainda não tem pasta (caminhoPasta nulo), cria uma agora
    // seguindo a mesma convenção de nome (backend/servicos/<numeroServico>).
    const pastaServico = servico.caminhoPasta || path.join(PASTA_BASE_SERVICOS, servico.numeroServico);
    fs.mkdirSync(pastaServico, { recursive: true });
    try {
      fs.writeFileSync(path.join(pastaServico, nomeArquivo), docxGerado);
    } catch (erro) {
      // Não deixa uma cópia aberta no Word (arquivo travado pelo Windows)
      // impedir o download — o usuário ainda recebe o documento atualizado,
      // só não substitui o arquivo em disco desta vez.
      console.error(`Não foi possível salvar "${nomeArquivo}" na pasta do serviço:`, erro.message);
    }

    return { buffer: docxGerado, nomeArquivo };
  },
};
