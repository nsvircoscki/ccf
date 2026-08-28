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

Crie um arquivo `.env` apenas para uso local e nunca o comite no repositório.

## Observações

- O sistema usa Prisma com PostgreSQL no backend.
- O frontend consome a API do backend para operar o Kanban, cadastros e módulos administrativos.
- Existe uma tela autocontida em `cadastro-ccf/` com documentação própria.
