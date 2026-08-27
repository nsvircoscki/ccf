export function formatarTelefone(valor) {
    const digitos = String(valor || '').replace(/\D/g, '').slice(0,11);

    if (digitos.length <= 2) return digitos;
    if (digitos.length <= 6) return `(${digitos.slice(0,2)}) ${digitos.slice(2)}`;

    if (digitos.length <= 10) {
        return `(${digitos.slice(0,2)}) ${digitos.slice(2,6)}-${digitos.slice(6)}`;
    }

    return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`;

}

export function formatarMatricula(valor) {
  const digitos = String(valor || '').replace(/\D/g, '');
  return digitos.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export function formatarCPF(valor) {
  const digitos = String(valor || '').replace(/\D/g, '').slice(0, 11);

  if (digitos.length <= 3) return digitos;
  if (digitos.length <= 6) return `${digitos.slice(0, 3)}.${digitos.slice(3)}`;
  if (digitos.length <= 9) return `${digitos.slice(0, 3)}.${digitos.slice(3, 6)}.${digitos.slice(6)}`;

  return `${digitos.slice(0, 3)}.${digitos.slice(3, 6)}.${digitos.slice(6, 9)}-${digitos.slice(9)}`;
}

export function formatarCNPJ(valor) {
  const digitos = String(valor || '').replace(/\D/g, '').slice(0, 14);

  if (digitos.length <= 2) return digitos;
  if (digitos.length <= 5) return `${digitos.slice(0, 2)}.${digitos.slice(2)}`;
  if (digitos.length <= 8) return `${digitos.slice(0, 2)}.${digitos.slice(2, 5)}.${digitos.slice(5)}`;
  if (digitos.length <= 12) {
    return `${digitos.slice(0, 2)}.${digitos.slice(2, 5)}.${digitos.slice(5, 8)}/${digitos.slice(8)}`;
  }

  return `${digitos.slice(0, 2)}.${digitos.slice(2, 5)}.${digitos.slice(5, 8)}/${digitos.slice(8, 12)}-${digitos.slice(12)}`;
}

export function formatarCEP(valor) {
  const digitos = String(valor || '').replace(/\D/g, '').slice(0, 8);
  if (digitos.length <= 5) return digitos;
  return `${digitos.slice(0, 5)}-${digitos.slice(5)}`;
}

// Formata a área enquanto a pessoa digita: milhar com ponto, decimal com
// vírgula (até 2 casas), sempre terminando em "m²" — ex.: "12345,6" -> "12.345,6 m²".
export function formatarArea(valor) {
  const limpo = String(valor || '').replace(/[^\d,]/g, '');
  if (!limpo) return '';

  const [parteInteira, ...resto] = limpo.split(',');
  const inteiro = parteInteira.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  if (resto.length === 0) return `${inteiro} m²`;

  const decimal = resto.join('').slice(0, 2);
  return `${inteiro || '0'},${decimal} m²`;
}

// Reverte a formatação de formatarArea() para um número puro (string com
// ponto decimal), pronto pra virar Float no backend.
export function desformatarArea(valor) {
  return String(valor || '')
    .replace(/m²/gi, '')
    .trim()
    .replace(/\./g, '')
    .replace(',', '.');
}

// Máscara de dinheiro estilo "caixa eletrônico": os dígitos digitados
// preenchem da direita pra esquerda (os 2 últimos são sempre os centavos) —
// o usuário nunca digita a vírgula, e o campo nunca trava, porque o valor
// exibido é sempre recalculado a partir dos dígitos brutos que já estão na
// tela, nunca de um número já arredondado guardado à parte.
export function formatarMoeda(valor) {
  const digitos = String(valor ?? '').replace(/\D/g, '');
  if (!digitos) return '';

  const centavos = parseInt(digitos, 10);
  const [inteiro, decimal] = (centavos / 100).toFixed(2).split('.');
  const inteiroComPontos = inteiro.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${inteiroComPontos},${decimal}`;
}

// Reverte formatarMoeda() para um número puro, pronto pra virar Float no
// backend.
export function desformatarMoeda(valorFormatado) {
  const digitos = String(valorFormatado ?? '').replace(/\D/g, '');
  if (!digitos) return 0;
  return parseInt(digitos, 10) / 100;
}

// Converte um número (ex.: vindo do banco) direto pro texto já mascarado,
// pra inicializar um campo desses com um valor existente.
export function numeroParaMoeda(numero) {
  return formatarMoeda(String(Math.round(Number(numero || 0) * 100)));
}