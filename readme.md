# Sistema CCF

## Sobre o projeto

Sistema web para apoio aos processos de cadastro, orçamento, documentação, emissão de boletos, notas fiscais, faturamento e acompanhamento de projetos em Kanban.

O projeto é dividido em frontend e backend, com persistência em PostgreSQL via Prisma ORM.

## Funcionalidades principais

- Login e navegação por módulos
- Dashboard de projetos
- Kanban com workflow, etapas, tickets, comentários e auditoria
- Cadastro de serviços e orçamento
- Cadastro de clientes
- Cadastro de imóveis
- Vinculação de dados cadastrais
- Configuração de etapas de processo
- Emissão e gestão de documentos
- Emissão de boletos
- Emissão de notas fiscais
- Faturamento
- Importação de pontos e apoio a mapas
- Impressão de relatórios do Kanban

## Arquitetura

### Frontend
- React
- Vite
- Framer Motion
- Leaflet / React Leaflet
- ExcelJS
- PDFKit

### Backend
- Node.js
- Express
- Prisma ORM
- PostgreSQL

## Estrutura do repositório

```text
backend/
  prisma/        schema e migrations do banco
  src/           server, controllers, services e rotas
  scripts/       utilitários e scripts administrativos
frontend/
  src/
    components/  telas e componentes principais
    hooks/       estado e regras do Kanban
    modals/      modais de edição, detalhe e exclusão
    page/        páginas do sistema
    services/    integração com a API
cadastro-ccf/
  Cadastros.tsx  tela autocontida de cadastros
  cadastros.css  estilos de apoio
```

## Como rodar localmente

### Banco de dados

Inicie o PostgreSQL com Docker a partir da pasta `backend/`:

```bash
docker-compose up -d
```

### Backend

Na pasta `backend/`:

```bash
npm install
npx prisma generate
npm run dev
```

Se necessário, aplique as migrations do Prisma:

```bash
npx prisma migrate dev
```

### Frontend

Na pasta `frontend/`:

```bash
npm install
npm run dev
```

## Variáveis de ambiente

O backend depende de variáveis como:

- `DATABASE_URL`
- `PORT`
- `GEMINI_API_KEY`
- `GEMINI_MATRICULA_MODEL`
- `INTER_CLIENT_ID`
- `INTER_CLIENT_SECRET`
- `PONTO_EXPORT_TOKENS`: token(s) do PC da folha para o export de pontos, separados por vírgula, com no mínimo 32 caracteres cada. Sem essa variável o export responde 503.
- `PONTO_TZ`: fuso dos pontos. O padrão é `America/Sao_Paulo`.

Crie um arquivo `.env` apenas para uso local e nunca o comite no repositório.

## SIS Ponto: batidas, modo offline e export para a folha

### O que fica onde

- **CCF (Postgres)** guarda só os **pontos**:
  - `PontoBatida`: um evento por batida (`ENTRADA`/`SAIDA`), com `batidoEm` (hora do aparelho) e `recebidoEm` (hora do servidor).
  - O funcionário é o `User` com "Registra ponto" ligado; o cadastro é feito em Configurações → Usuários.
  - Justificativas e jornadas continuam em `backend/data/sis-ponto.json`.
  - **Nenhum dado de salário** passa pelo CCF nem pelo celular.
- **PC da folha (Sistema Ponto, SQLite local)** guarda salário, descontos, férias, 13º, histórico e recibos. Ele **busca** os pontos no CCF; o CCF nunca acessa o PC.

### Como a batida offline funciona

1. Na tela de ponto, a batida é gravada **primeiro no IndexedDB do aparelho** (`frontend/src/services/pontoOffline.js`) com um `clientId` (UUID).
2. O envio vai para `POST /sis-ponto/sync`, disparado:
   - ao abrir o app;
   - quando a rede volta;
   - quando a aba volta a ficar visível;
   - a cada 60 s.
3. Só o que o servidor confirma (`criado` ou `duplicado`) sai da fila. Reenviar o mesmo `clientId` não duplica nada.
4. A tela mostra quantos pontos ainda estão pendentes de envio.
5. Uma sequência inválida (por exemplo, duas entradas seguidas) **não é descartada**: fica marcada como inconsistente e aparece na aba **Pontos a revisar** do admin.
6. **Cada pessoa bate só o próprio ponto.** O servidor recusa batida para outra pessoa. Quem é do ENG alterna entre "Painel do ENG" e "Meu ponto".

### Esquecimento de batida

Isto vale para quem tem jornada definida (não horista). Quando um horário da jornada de um dia já encerrado fica sem batida, o servidor registra o **horário previsto** (origem `PREVISTA`, situação `PENDENTE`).
- Os previstos são gerados ao subir o backend, a cada 30 min e antes da revisão e do export.
- Na aba **Pontos a revisar**, o ENG vê os esquecimentos e as justificativas do dia, e decide:
  - **Abonar:** conta as horas.
  - **Falta:** desconta as horas e sai no CSV com 0 h e código `6` (falta).
- Enquanto não há decisão, o horário sai com 0 h e aparece como pendência na conferência da folha.
- Se a batida real chegar depois (aparelho estava offline), o previsto pendente some sozinho.
- Nada é gerado para dias anteriores a `User.pontoDesde`, que recebe a data em que a pessoa passou a registrar ponto.

A justificativa tem um campo **Motivo** com opções padrão (esquecimento, atestado, trabalho externo, etc.). A explicação por escrito só é obrigatória em "Outro".

### Export para o PC da folha

Há duas formas de levar os pontos para o Sistema Ponto. As duas geram o mesmo CSV.
- **Pela tela:** Painel do ENG → Relatórios → **Baixar CSV para a folha**, escolhendo o mês. No Sistema Ponto, use `FONTE_PONTOS=arquivo` e o botão "Importar CSV". A rota é `GET /sis-ponto/folha.csv?mes=YYYY-MM`, com a sessão do ENG/DEV.
- **Automático:** o Sistema Ponto busca sozinho o `export.csv` com o token de máquina (`FONTE_PONTOS=ccf`), como descrito abaixo.

O botão **"Exportar relatório do dia"** do Dashboard gera só o resumo de um dia e **não** é aceito pelo Sistema Ponto.

```
GET /sis-ponto/export.csv?mes=YYYY-MM        (ou ?ano=YYYY)
GET /sis-ponto/export-pendencias.json?mes=YYYY-MM
Authorization: Bearer <um dos PONTO_EXPORT_TOKENS>
```

**Colunas do CSV:** `O,Name,Time In,Time Out,Total Hours,Hourly Wage,Total Wages,CCF ID,Observacao`
- `Name` é o e-mail do usuário.
- `CCF ID` é o `User.id`.
- As datas vêm em `M/D/YYYY H:mm:ss`, no fuso `PONTO_TZ`.
- `Hourly Wage` vem vazio.
- `Total Wages` vem como `0`. No Sistema Ponto essa coluna é o **código de ocorrência**, não dinheiro.
- Ponto sem saída ou inconsistente sai **com o horário faltante vazio** e a `Observacao` preenchida. Nunca é omitido.

**Para trocar o token sem interrupção:**
1. Acrescente o novo token em `PONTO_EXPORT_TOKENS` e reinicie o backend.
2. Troque o token no PC da folha.
3. Remova o antigo e reinicie de novo.

Para gerar um token: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.

### Migração dos dados antigos (uma vez)

Com o **backend parado**, na pasta `backend/`:

```bash
npx prisma migrate deploy                 # cria PontoBatida/PontoDispositivo e User.padraoHorarioId
node scripts/migrarSisPontoJson.js        # dry-run: mostra como cada funcionário do JSON casa com um User
node scripts/migrarSisPontoJson.js --aplicar
```

Quem não casar pelo nome (mesmo setor) precisa ser criado em Usuários ou mapeado com `--mapa mapa.json` (`{ "ENG-1727...": "<id do User>" }`). Antes de gravar, o script faz backup do JSON.

### Verificação

```bash
npm test                                          # regras de sequência/pares, formato do CSV, token do export
node scripts/verificarSyncPonto.js <userId>      # idempotência do sync no banco de dev (apaga o que cria)
node scripts/seedPontoFalso.js                   # 6 usuários falsos (@exemplo.test, senha teste123) com ~5 semanas de ponto
node scripts/seedPontoFalso.js --remover         # apaga os usuários falsos, as batidas e as justificativas deles
```

O seed cria um perfil de cada tipo:
- pontual;
- atrasa;
- esquece a saída;
- falta;
- faz hora extra;
- horista.

Isso gera horários previstos para a revisão do ENG, saldo positivo e negativo no banco de horas e algumas batidas que chegaram "offline".

### Banco de horas

O banco de horas é acumulado no mês e só conta dias já encerrados. Para cada dia:

`saldo = trabalhado + justificativas aceitas − jornada prevista`

- **Justificativa aceita** só completa a jornada, não gera hora extra.
- **Horário previsto** abonado pelo ENG conta como trabalhado. Pendente ou falta não conta.
- **Dia sem jornada** (fim de semana) com trabalho vira crédito.
- **Horista** não tem banco.
- O banco só conta a partir de `User.pontoDesde`.

**Só o ENG corrige batidas**, pelo botão "Corrigir" em cada dia do calendário do painel: exclui batidas erradas e inclui as que faltaram, sempre com **motivo obrigatório** (gravado em `motivoAjuste` / `motivoRemocao`). As incluídas ficam com origem `AJUSTE`, com o registro de qual ENG incluiu, e aparecem em roxo com `*` no calendário do ENG e do funcionário (o motivo aparece ao passar o mouse e no detalhe do dia). Incluir uma batida no horário de um previsto pendente resolve o previsto. O funcionário que errou envia uma justificativa.

## Deploy com HTTPS (necessário para o ponto offline)

O service worker (PWA) **só funciona em HTTPS** (ou em `localhost`). E, se o site estiver em HTTPS, a API também precisa estar, senão o navegador bloqueia as chamadas (mixed content).

Configuração sugerida: um proxy reverso (nginx ou Caddy) na frente, com o pm2 cuidando só do backend.

```bash
# backend: o cwd precisa ser backend/ (o sis-ponto.json é resolvido a partir dele)
pm2 start src/server.js --name ccf-backend --cwd /caminho/ccf/backend
pm2 save

# frontend: build com a API atrás do mesmo domínio
cd frontend && VITE_API_URL=https://ccf.seudominio.com.br/api npm run build
```

nginx (o equivalente no Caddy é um `reverse_proxy` + `file_server`, e ele obtém o certificado sozinho):

```nginx
server {
    listen 443 ssl;
    server_name ccf.seudominio.com.br;
    ssl_certificate     /etc/letsencrypt/live/ccf.seudominio.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ccf.seudominio.com.br/privkey.pem;

    root /caminho/ccf/frontend/dist;
    location / { try_files $uri /index.html; }
    # sw.js nunca em cache longo, senão a atualização do app demora a chegar
    location = /sw.js { add_header Cache-Control "no-cache"; }

    location /api/ {
        proxy_pass http://127.0.0.1:3000/;   # a barra final remove o /api
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        client_max_body_size 25m;
    }
}
server { listen 80; server_name ccf.seudominio.com.br; return 301 https://$host$request_uri; }
```

**Certificado:**
- **Domínio público:** Let's Encrypt (`certbot --nginx`, ou automático no Caddy).
- **Só rede interna:** um certificado de CA interna (mkcert, por exemplo) precisa ser **instalado como confiável em cada celular**. Isso é trabalhoso. Alternativas: Cloudflare Tunnel ou Tailscale (HTTPS sem abrir porta).
- Feche a porta 3000 para fora do servidor: só o proxy fala com o backend.
- Restrinja o CORS do backend ao domínio final; hoje ele está aberto.

Externamente, os endpoints ficam em `https://<dominio>/api/sis-ponto/...` (por exemplo, `/api/sis-ponto/export.csv`).

## Observações

- O sistema usa Prisma com PostgreSQL no backend.
- O frontend consome a API do backend para operar o Kanban, cadastros e módulos administrativos.
- Existe uma tela autocontida em `cadastro-ccf/` com documentação própria.
