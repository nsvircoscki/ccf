import municipiosFmp from './municipiosModuloFiscal.json' with { type: 'json' };

export const UFS_BRASIL = [
  { value: 'AC', label: 'Acre' },
  { value: 'AL', label: 'Alagoas' },
  { value: 'AP', label: 'Amapá' },
  { value: 'AM', label: 'Amazonas' },
  { value: 'BA', label: 'Bahia' },
  { value: 'CE', label: 'Ceará' },
  { value: 'DF', label: 'Distrito Federal' },
  { value: 'ES', label: 'Espírito Santo' },
  { value: 'GO', label: 'Goiás' },
  { value: 'MA', label: 'Maranhão' },
  { value: 'MT', label: 'Mato Grosso' },
  { value: 'MS', label: 'Mato Grosso do Sul' },
  { value: 'MG', label: 'Minas Gerais' },
  { value: 'PA', label: 'Pará' },
  { value: 'PB', label: 'Paraíba' },
  { value: 'PR', label: 'Paraná' },
  { value: 'PE', label: 'Pernambuco' },
  { value: 'PI', label: 'Piauí' },
  { value: 'RJ', label: 'Rio de Janeiro' },
  { value: 'RN', label: 'Rio Grande do Norte' },
  { value: 'RS', label: 'Rio Grande do Sul' },
  { value: 'RO', label: 'Rondônia' },
  { value: 'RR', label: 'Roraima' },
  { value: 'SC', label: 'Santa Catarina' },
  { value: 'SP', label: 'São Paulo' },
  { value: 'SE', label: 'Sergipe' },
  { value: 'TO', label: 'Tocantins' },
].map((uf) => ({
  ...uf,
  keywords: `${uf.value} ${normalizarTexto(uf.label)}`,
}));

function normalizarTexto(valor) {
  return String(valor || '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR');
}

export function normalizarUf(valor) {
  const texto = normalizarTexto(valor);
  return UFS_BRASIL.find(
    (uf) => uf.value.toLowerCase() === texto || normalizarTexto(uf.label) === texto,
  )?.value || '';
}

export function listarMunicipiosPorUf(uf) {
  const sigla = normalizarUf(uf);
  if (!sigla) return [];

  return municipiosFmp
    .filter(([codigoUf]) => codigoUf === sigla)
    .map(([, municipio, moduloFiscalHa]) => ({
      value: municipio,
      label: municipio,
      moduloFiscalHa,
    }));
}

export function buscarMunicipioPorNome(uf, nome) {
  const nomeNormalizado = normalizarTexto(nome);
  if (!nomeNormalizado) return null;

  return listarMunicipiosPorUf(uf).find(
    (municipio) => normalizarTexto(municipio.value) === nomeNormalizado,
  ) || null;
}

export function buscarModuloFiscal(uf, municipio) {
  return buscarMunicipioPorNome(uf, municipio)?.moduloFiscalHa ?? null;
}
