import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';

// Histórico de navegação do app (telas da navbar e abas de dentro dos
// módulos). Cada troca empilha uma função que desfaz a troca, e também uma
// entrada no histórico do navegador — assim o botão "Voltar" da navbar, o
// voltar do navegador e o voltar do celular (Android) andam juntos.
//
// A pilha e o histórico do navegador ficam 1:1 pelo índice guardado em
// history.state.ccfNav (= tamanho da pilha depois daquele passo).
const pilha = []; // [{ restaurar: () => boolean }] — false = componente já saiu da tela
const ouvintes = new Set();
const avisar = () => ouvintes.forEach((fn) => fn());

function empilhar(restaurar) {
  pilha.push({ restaurar });
  window.history.pushState({ ...(window.history.state || {}), ccfNav: pilha.length }, '');
  avisar();
}

window.addEventListener('popstate', (evento) => {
  const alvo = evento.state?.ccfNav ?? 0;
  // "Avançar" do navegador: não há o que refazer — volta pra onde estava.
  if (alvo > pilha.length) {
    window.history.go(pilha.length - alvo);
    return;
  }
  let restaurouAlgo = false;
  while (pilha.length > alvo) {
    if (pilha.pop().restaurar()) restaurouAlgo = true;
  }
  avisar();
  // O passo era de uma aba que já não está na tela (ex.: módulo fechado):
  // pula direto pro anterior em vez de o clique não fazer nada.
  if (!restaurouAlgo && pilha.length > 0) window.history.back();
});

export function voltar() {
  if (pilha.length > 0) window.history.back();
}

// Login/logout e volta ao seletor de módulos começam um histórico novo.
export function limparHistorico() {
  pilha.length = 0;
  window.history.replaceState({ ...(window.history.state || {}), ccfNav: 0 }, '');
  avisar();
}

export function usePodeVoltar() {
  return useSyncExternalStore(
    (fn) => { ouvintes.add(fn); return () => ouvintes.delete(fn); },
    () => pilha.length > 0,
  );
}

// Igual a useState, mas cada troca de valor entra no histórico (o "Voltar"
// devolve o valor anterior). O terceiro item troca sem entrar no histórico —
// para mudanças que não são navegação da pessoa (ex.: redirecionamento).
export function useEstadoNavegavel(inicial) {
  const [valor, setValor] = useState(inicial);
  // Todas as trocas passam pelas funções abaixo, que mantêm o ref em dia.
  const valorRef = useRef(valor);
  const montado = useRef(true);
  useEffect(() => {
    montado.current = true;
    return () => { montado.current = false; };
  }, []);

  const navegar = useCallback((novo) => {
    const anterior = valorRef.current;
    const proximo = typeof novo === 'function' ? novo(anterior) : novo;
    if (Object.is(proximo, anterior)) return;
    empilhar(() => {
      if (!montado.current) return false;
      valorRef.current = anterior;
      setValor(anterior);
      return true;
    });
    valorRef.current = proximo;
    setValor(proximo);
  }, []);

  const definirSemHistorico = useCallback((novo) => {
    const proximo = typeof novo === 'function' ? novo(valorRef.current) : novo;
    valorRef.current = proximo;
    setValor(proximo);
  }, []);

  return [valor, navegar, definirSemHistorico];
}
