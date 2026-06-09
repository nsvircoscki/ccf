# Sistema de Workflow Kanban

## 🎯 O Projeto
Sistema de gestão de projetos estilo Kanban. O objetivo atual é entregar um MVP funcional com a interface estritamente espelhada no nosso protótipo do Figma, rodando com física fluida de arrastar e soltar. 

## 🛠 Stack Tecnológica
* **Frontend:** React + Vite
* **Animações e Física:** Framer Motion
* **Estilização:** Inline CSS focado em performance e fidelidade ao design
* **Backend:** [A iniciar] Node.js + Prisma ORM (PostgreSQL)

## 🚀 Como rodar o projeto localmente

1. Clone o repositório:
\`\`\`bash
git clone [COLE_AQUI_O_SEU_LINK_DO_GITHUB]
\`\`\`

2. Entre na pasta do frontend:
\`\`\`bash
cd frontend
\`\`\`

3. Instale as dependências essenciais:
\`\`\`bash
npm install
\`\`\`

4. Inicie o servidor:
\`\`\`bash
npm run dev
\`\`\`

## 📌 Status Atual (Dia 1 da Sprint)
* ✅ Layout alinhado 100% com o Figma.
* ✅ Lógica de estado local (`useState`) e adição de novos projetos via botão `+` operantes.
* ✅ Física de drag-and-drop finalizada com troca de status baseada em coordenadas de tela.

## 🚧 Foco Atual
O frontend opera com dados *mockados* na memória. O próximo grande passo técnico é a criação do banco de dados e a substituição do estado local pelo consumo real de uma API.

https://gemini.google.com/share/8fe2e3a965a6