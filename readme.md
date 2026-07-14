# Sistema de Workflow 

##  O Projeto
Sistema de gestão de projetos estilo Kanban. O objetivo do sistema é ajudar no controle dos processos, atualmente conta com relatórios e com dashboards e interação e controle das etapas.

##  Stack Tecnológica
* **Frontend:** React + Vite
* **Animações e Física:** Framer Motion
* **Estilização:** Inline CSS focado em performance e fidelidade ao design
* **Backend:** Node.js + Prisma ORM (PostgreSQL)

##  Como rodar o projeto localmente

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

##  (Sprint 1)
 Layout alinhado 100% com o Figma.
 Lógica de estado local (`useState`) e adição de novos projetos via botão `+` operantes.
 Física de drag-and-drop finalizada com troca de status baseada em coordenadas de tela.

##  (Sprint 2)
 Layout com alterações de usabilidade, novas cores inseridas no quadro kanban, dashboard incluído e relatórios em PDF.
 Física de drag-and-drop finalizada com troca de status baseada em coordenadas de tela.

##  Foco Atual
O frontend opera com dados *mockados* na memória. O próximo grande passo técnico é a criação do banco de dados e a substituição do estado local pelo consumo real de uma API.

https://gemini.google.com/share/8fe2e3a965a6
