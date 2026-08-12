# CCF — Tela de Cadastros

Componente autocontido com as três telas: **Cliente**, **Imóvel** e **Vinculação**.

## Arquivos
- `Cadastros.tsx` — componente principal (React + inline styles, sem dependências além do React).
- `cadastros.css` — trecho de CSS necessário (fontes + keyframe de animação).

## Como integrar

1. Copie `Cadastros.tsx` para o seu `src/`.

2. Garanta que o CSS de `cadastros.css` esteja no seu CSS global (ou já tenha equivalente):
   - `@import` das fontes **Montserrat** (700/900) e **Open Sans** (400/600).
   - O keyframe **`fadeUp`** (usado nas animações de entrada e nos dropdowns).

3. Use o componente:

   ```tsx
   import Cadastros from './Cadastros'

   <Cadastros
     user="Ana"                 // iniciais do usuário no cabeçalho
     initial="cliente"          // 'cliente' | 'imovel' | 'vinculacao'
     onBack={() => { /* voltar */ }}
   />
   ```

## Onde ligar seus dados
Substitua os arrays de exemplo no topo de `Cadastros.tsx`:
- `PEOPLE` — pessoas cadastradas (cônjuge, proprietário, usufrutuário…)
- `IMOVEIS` — imóveis (dropdown de imóvel e confrontantes)
- `SERVICOS` — serviços (seletor da tela de Vinculação)

O CEP usa a API pública **ViaCEP** para autopreencher endereço.
