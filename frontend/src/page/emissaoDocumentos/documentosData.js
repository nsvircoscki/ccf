export const clientesDocumentos = [
  {
    id: 1,
    nome: 'Mauro Engler',
    matricula: '44.918',
    area: '67.890,00 m2',
    municipio: 'Sao Bento do Sul - SC',
    servicos: ['Retificacao', 'Desmembramento'],
    valorGlobal: '1.412,00',
  },
  {
    id: 2,
    nome: 'Hermes',
    matricula: 'MT-1001',
    area: '24.200,00 m2',
    municipio: 'Rio Negrinho - SC',
    servicos: ['Levantamento Topografico'],
    valorGlobal: '3.242,00',
  },
  {
    id: 3,
    nome: 'Lucia',
    matricula: 'MT-1002',
    area: '13.450,00 m2',
    municipio: 'Campo Alegre - SC',
    servicos: ['Retificacao'],
    valorGlobal: '2.431,50',
  },
];

export const municipiosSugeridos = ['Sao Bento do Sul - SC', 'Campo Alegre - SC', 'Rio Negrinho - SC', 'Corupa - SC'];

export const catalogoServicos = [
  { id: 1, nome: 'Levantamento Topografico', detalhe: 'L.Seca + Rio', indice: 4.0, ativo: true },
  { id: 2, nome: 'Retificacao', detalhe: 'x1.5', indice: 1.5, ativo: true },
  { id: 3, nome: 'Desmembramento', detalhe: 'x1.0', indice: 1.0, ativo: true },
  { id: 4, nome: 'Unificacao', detalhe: 'x1.0', indice: 1.0, ativo: true },
  { id: 5, nome: 'Usucapiao', detalhe: 'x1.0', indice: 1.0, ativo: true },
  { id: 6, nome: 'Certificacao', detalhe: 'x1.0', indice: 1.0, ativo: true },
  { id: 7, nome: 'CAR', detalhe: 'x0.5', indice: 0.5, ativo: true },
  { id: 8, nome: 'Escritura', detalhe: 'x1.0', indice: 1.0, ativo: true },
  { id: 9, nome: 'Cadastral', detalhe: 'x1.0', indice: 1.0, ativo: true },
  { id: 10, nome: 'Conferencia', detalhe: 'x1.0', indice: 1.0, ativo: true },
  { id: 11, nome: 'Movimentacao de Terra', detalhe: 'x1.0', indice: 1.0, ativo: true },
  { id: 12, nome: 'Locacao', detalhe: 'x1.0', indice: 1.0, ativo: true },
  { id: 13, nome: 'Atualizacao', detalhe: 'x1.0', indice: 1.0, ativo: true },
];
