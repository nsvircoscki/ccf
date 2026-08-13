export const clientesDocumentos = [
  {
    id: 1,
    nome: 'Mauro Engler',
    matricula: '44.918',
    area: '67.890,00 m2',
    municipio: 'São Bento do Sul - SC',
    servicos: ['Retificação', 'Desmembramento'],
    valorGlobal: '1.412,00',
  },
  {
    id: 2,
    nome: 'Hermes',
    matricula: 'MT-1001',
    area: '24.200,00 m2',
    municipio: 'Rio Negrinho - SC',
    servicos: ['Levantamento Topográfico'],
    valorGlobal: '3.242,00',
  },
  {
    id: 3,
    nome: 'Lucia',
    matricula: 'MT-1002',
    area: '13.450,00 m2',
    municipio: 'Campo Alegre - SC',
    servicos: ['Retificação'],
    valorGlobal: '2.431,50',
  },
];

export const municipiosSugeridos = ['São Bento do Sul - SC', 'Campo Alegre - SC', 'Rio Negrinho - SC', 'Corupá - SC'];

export const catalogoServicos = [
  { id: 1, nome: 'Levantamento Topográfico', detalhe: 'L.Seca + Rio', indice: 4.0, ativo: true },
  { id: 2, nome: 'Retificação', detalhe: 'x1.5', indice: 1.5, ativo: true },
  { id: 3, nome: 'Desmembramento', detalhe: 'x1.0', indice: 1.0, ativo: true },
  { id: 4, nome: 'Unificação', detalhe: 'x1.0', indice: 1.0, ativo: true },
  { id: 5, nome: 'Usucapião', detalhe: 'x1.0', indice: 1.0, ativo: true },
  { id: 6, nome: 'Certificação', detalhe: 'x1.0', indice: 1.0, ativo: true },
  { id: 7, nome: 'CAR', detalhe: 'x0.5', indice: 0.5, ativo: true },
  { id: 8, nome: 'Escritura', detalhe: 'x1.0', indice: 1.0, ativo: true },
  { id: 9, nome: 'Cadastral', detalhe: 'x1.0', indice: 1.0, ativo: true },
  { id: 10, nome: 'Conferência', detalhe: 'x1.0', indice: 1.0, ativo: true },
  { id: 11, nome: 'Movimentação de Terra', detalhe: 'x1.0', indice: 1.0, ativo: true },
  { id: 12, nome: 'Locação', detalhe: 'x1.0', indice: 1.0, ativo: true },
  { id: 13, nome: 'Atualização', detalhe: 'x1.0', indice: 1.0, ativo: true },
];
