// src/services/textoDocumento.js
// Ajusta o texto do cadastro para entrar no meio das frases dos documentos:
// no cadastro as pessoas digitam do jeito que vier ("JOÃO DA SILVA",
// "Brasileiro", "Agricultor"), mas no documento só o que é nome próprio leva
// inicial maiúscula — o resto segue a gramática da frase ("João da Silva,
// brasileiro, casado, agricultor, ..."). Não altera o que está gravado.

// Preposições/artigos que ficam minúsculos dentro de nomes ("Maria das Dores",
// "Rua Duque de Caxias"), exceto se forem a primeira palavra.
const PARTICULAS = new Set(['da', 'das', 'de', 'do', 'dos', 'e', 'di', 'du', 'del', 'della', 'van', 'von', 'y']);
// Algarismos romanos de endereço ("Rua XV de Novembro"), até XXXIX.
const ROMANO = /^(?=[ivx]+$)x{0,3}(ix|iv|v?i{0,3})$/i;

function palavraPropria(palavra, primeira) {
  if (!palavra) return palavra;
  // Siglas e códigos com número ficam como estão em maiúsculas ("BR-280", "SC-301", "XV").
  if (/\d/.test(palavra)) return palavra.toUpperCase();
  const minuscula = palavra.toLocaleLowerCase('pt-BR');
  if (!primeira && PARTICULAS.has(minuscula)) return minuscula;
  if (palavra.length > 1 && ROMANO.test(palavra)) return palavra.toUpperCase();
  // Partes ligadas por hífen ou apóstrofo também levam inicial maiúscula ("Ana-Maria", "D'Ávila").
  return minuscula.replace(/(^|[-'’])(\p{L})/gu, (_, sep, letra) => sep + letra.toLocaleUpperCase('pt-BR'));
}

// "JOÃO DA SILVA" / "joão da silva" -> "João da Silva".
export function nomeProprio(texto) {
  if (!texto) return texto;
  return String(texto).trim().split(/\s+/).map((p, i) => palavraPropria(p, i === 0)).join(' ');
}

// "Brasileiro" / "CASADO" -> "brasileiro" / "casado" (meio da frase).
export function minusculas(texto) {
  if (!texto) return texto;
  return String(texto).trim().toLocaleLowerCase('pt-BR');
}

// Pessoa (cliente) pronta para a qualificação dos documentos. Nome de pessoa
// jurídica fica como foi cadastrado (siglas como "LTDA", "S.A.", "CCF").
export function normalizarPessoa(pessoa) {
  if (!pessoa) return pessoa;
  return {
    ...pessoa,
    nome: pessoa.tipo === 'Jurídica' ? pessoa.nome : nomeProprio(pessoa.nome),
    nacionalidade: minusculas(pessoa.nacionalidade),
    estadoCivil: minusculas(pessoa.estadoCivil),
    profissao: minusculas(pessoa.profissao),
    representanteLegalNome: nomeProprio(pessoa.representanteLegalNome),
    representanteLegalCargo: minusculas(pessoa.representanteLegalCargo),
    logradouro: nomeProprio(pessoa.logradouro),
    bairro: nomeProprio(pessoa.bairro),
    cidade: nomeProprio(pessoa.cidade),
    estado: pessoa.estado ? String(pessoa.estado).trim().toUpperCase() : pessoa.estado,
    conjuge: pessoa.conjuge ? normalizarPessoa(pessoa.conjuge) : pessoa.conjuge,
    conjugeDe: pessoa.conjugeDe ? normalizarPessoa(pessoa.conjugeDe) : pessoa.conjugeDe,
  };
}
