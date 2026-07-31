# Restaurar funcionalidades removidas na refatoração (branch orcamento)

## Contexto

A branch orcamento (baseada em refact/arquitetura-sistema) quebrou o antigo App.jsx monolítico em hooks/, services/, components/ e modals/ — uma refatoração intencional e bem-vinda. No processo, 6 funcionalidades que existiam no App.jsx da main ficaram pelo caminho (confirmado lendo o código atual, não só pelo diff):

1. Adicionar tarefa a uma coluna do Kanban (AddCard)
2. Editar a descrição do cartão inline (no TicketDetailModal)
3. Modal "Informações do Projeto" (matrícula / endereço / notas)
4. Campo terreno (Urbano/Rural) ao criar/editar projeto
5. Busca por etapa dentro do Kanban (não só busca por nome de projeto)
6. Impressão do quadro de um projeto específico

O usuário confirmou que as remoções foram intencionais na época, mas agora quer os 6 itens de volta — *preservando a arquitetura nova* (hooks/services/components/modals), não voltando ao monólito.

Fora de escopo (não pedido, não vou mexer): trocar o <select> nativo de volta pro AnimatedDropdown, e o hardcode do IP em services/api.js além do necessário para os itens acima.

## Descoberta bloqueante: schema.prisma está quebrado

Antes de mexer em qualquer campo novo, o schema atual (backend/prisma/schema.prisma) tem 3 erros que impedem prisma generate/migrate de rodar:
- Workflow declara servicoId duas vezes (uma String?, outra Servico? com o mesmo nome de campo) — linhas 34-35.
- Servico.workflows está tipado como workflow[] (minúsculo) em vez de Workflow[].
- Servico.created_at/updated_at usam o tipo Datetime (não existe no Prisma; é DateTime).

Isso precisa ser corrigido como pré-requisito (Passo 0), senão nenhuma migração nova consegue ser gerada.

Também notei que Ticket.sequence (usado em KanbanView.jsx para travar etapas fora de ordem) não existe no schema nem na migration 20260605131240_init — ou seja, o bloqueio de "etapa pulada" hoje é um no-op silencioso (t.sequence sempre undefined). Não está nos 6 itens pedidos, então não vou tocar nisso agora — só deixando registrado.

---

## Passo 0 — Corrigir o schema.prisma (pré-requisito)

Arquivo: backend/prisma/schema.prisma
- Remover a linha duplicada de servicoId no model Workflow, mantendo o escalar e adicionando a relação nomeada corretamente (servico Servico? @relation(fields: [servicoId], references: [id])).
- Corrigir Servico.workflows para Workflow[].
- Corrigir Datetime → DateTime (2 ocorrências no model Servico).

## Passo 1 — Novos campos no schema + migration única

No mesmo arquivo, adicionar:
- Ticket.description String? (item 2)
- Workflow.matricula String?, Workflow.endereco String?, Workflow.details String?, Workflow.terreno String? @default("Urbano") (itens 3 e 4)

Rodar npx prisma migrate dev --name add_ticket_description_and_workflow_details (preciso do Postgres local de pé via docker-compose up -d em backend/) para gerar a migration e o client novo.

## Passo 2 — Backend: criar/editar ticket com descrição (item 1 e 2)

- backend/src/services/ticketService.js: adicionar criarTicket({ title, description, workflowId, currentStepId }) e atualizarTicket(id, { description }), seguindo o padrão dos métodos existentes (moverTicket, excluirTicket).
- backend/src/controllers/ticketController.js: adicionar criar e atualizar, mesmo padrão try/catch dos outros.
- backend/src/routes/ticketRoutes.js: adicionar router.post('/', ticketController.criar) e router.put('/:id', ticketController.atualizar).

## Passo 3 — Backend: terreno + detalhes do projeto (itens 3 e 4)

- backend/src/services/workflowService.js:
  - fabricarProjeto(name, types, terreno, servicoId, tx) passa a gravar terreno no create.
  - editarProjeto(id, types, terreno) grava terreno no update junto com description.
  - Novo método atualizarDetalhes(id, { matricula, endereco, details }).
- backend/src/controllers/workflowController.js: criar/editar passam a ler req.body.terreno; novo método detalhes chamando atualizarDetalhes.
- backend/src/routes/workflowRoutes.js: adicionar router.put('/:id/details', workflowController.detalhes).

## Passo 4 — Frontend: services/api.js

Adicionar createTicket, updateTicket, updateWorkflowDetails; createWorkflow e updateWorkflow passam a aceitar/enviar terreno. De quebra, corrigir BASE_URL para http://192.168.1.2:3000 (mesmo IP de LAN que a main usava) já que sem isso os itens novos também não vão funcionar fora da máquina do backend.

## Passo 5 — Frontend: hooks/useKanban.js

Adicionar criarTicketLocal e atualizarDescricaoLocal (mesmo padrão otimista de adicionarComentarioLocal/excluirCartaoLocal), e atualizarDetalhesProjeto para o item 4.

## Passo 6 — Frontend: restaurar AddCard (item 1)

- Novo arquivo frontend/src/components/AddCard.jsx, portado do AddCard da main mas usando kanban.criarTicketLocal em vez de fetch direto.
- KanbanView.jsx: renderizar <AddCard column={colunaNome} .../> ao final de cada coluna (mesma posição de antes), passando projeto, workflowAtivo, usuarioLogado, usuarios.
- TicketCard.jsx: exibir t.description (bloco de texto) quando presente, igual ao main.

## Passo 7 — Frontend: editar descrição inline (item 2)

TicketDetailModal.jsx: adicionar estado editandoDescricao/descricaoEditada e o bloco clicável (igual ao main), chamando kanban.atualizarDescricaoLocal.

## Passo 8 — Frontend: terreno na criação/edição (item 4)

NovoProjetoModal.jsx e EditarProjetoModal.jsx: adicionar os dois botões Urbano/Rural (estado terreno/terrenoEditando) e repassar no api.createWorkflow/api.updateWorkflow.

## Passo 9 — Frontend: modal Informações do Projeto (item 3)

- Novo arquivo frontend/src/modals/DetalhesProjetoModal.jsx, portado do bloco modalDetalhesAberto do main, usando kanban.atualizarDetalhesProjeto.
- KanbanView.jsx: chips "Mat:"/"End:" + botão "Editar Informações"/"+ Informações" no header (igual ao main), controlando abertura via um novo onAbrirDetalhes vindo do App.jsx (seguindo o padrão do objeto modais já existente).
- App.jsx: adicionar detalhesProjeto: false ao objeto modais e renderizar o novo modal.

## Passo 10 — Frontend: busca por etapa no Kanban (item 5)

KanbanView.jsx: adicionar um segundo campo de busca (buscaEtapaKanban) ao lado do existente, e incluir no filtro de tickets exibidos por coluna (etapa e título), replicando a lógica normalize() + etapaMatch do main.

## Passo 11 — Frontend: impressão do projeto no Kanban (item 6)

Aqui achei um bug extra: no App.jsx atual, tudo fica dentro de <div className="no-print"> e não sobrou nenhum elemento .print-only em lugar nenhum do código — ou seja, o botão "Imprimir A4" do Dashboard hoje imprime página em branco. Vou restaurar isso junto:
- KanbanView.jsx: reintroduzir o modal "Imprimir Etapas" (seleção de projeto) e o estado de qual workflow está marcado para impressão.
- App.jsx: reintroduzir o bloco .print-only com a tabela print-table (fora da div.no-print), igual ao main, alimentado pelo projeto marcado para impressão.

---

## Arquivos tocados (resumo)

*Backend:* prisma/schema.prisma, services/ticketService.js, services/workflowService.js, controllers/ticketController.js, controllers/workflowController.js, routes/ticketRoutes.js, routes/workflowRoutes.js

*Frontend:* services/api.js, hooks/useKanban.js, components/KanbanView.jsx, components/TicketCard.jsx, components/AddCard.jsx (novo), modals/TicketDetailModal.jsx, modals/NovoProjetoModal.jsx, modals/EditarProjetoModal.jsx, modals/DetalhesProjetoModal.jsx (novo), App.jsx

## Verificação

1. docker-compose up -d em backend/, depois npx prisma migrate dev — confirma que o Passo 0 destravou o schema e a migration nova aplica sem erro.
2. Subir backend (npm run dev ou equivalente) e frontend (npm run dev no Vite).
3. No navegador: criar projeto novo escolhendo Urbano/Rural → conferir no banco (npx prisma studio) que terreno foi gravado.
4. No Kanban: adicionar uma tarefa avulsa numa coluna, abrir o cartão e editar a descrição, conferir que persiste após reload.
5. Abrir "+ Informações" no header do Kanban, preencher matrícula/endereço/notas, salvar, conferir os chips aparecendo.
6. Testar a busca por etapa filtrando os cartões do board.
7. Clicar em "Imprimir Etapas" no Kanban, escolher um projeto, confirmar que o window.print() mostra a tabela por etapas (e não uma página em branco).