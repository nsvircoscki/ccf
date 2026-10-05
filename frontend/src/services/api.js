const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// ---- SESSÃO ----
// O token vem do login (ver authService no backend) e vai em toda requisição.
// Fica em localStorage pra sessão sobreviver a um recarregar de página.
const CHAVE_TOKEN = 'ccf:token';
let tokenAtual = localStorage.getItem(CHAVE_TOKEN);
let aoPerderSessao = null;

export function definirToken(token) {
    tokenAtual = token || null;
    if (tokenAtual) localStorage.setItem(CHAVE_TOKEN, tokenAtual);
    else localStorage.removeItem(CHAVE_TOKEN);
}

export const temToken = () => Boolean(tokenAtual);

// O App registra aqui o que fazer quando o backend recusa a sessão (token
// expirado, usuário desativado): voltar pra tela de login.
export function aoExpirarSessao(callback) {
    aoPerderSessao = callback;
}

// Toda chamada ao backend passa por aqui — é o único lugar que põe o token.
// Antes eram dezenas de fetch montando os próprios headers, e um header
// esquecido já custou caro (o antigo typo "hearder" em reordenarTarefas).
async function req(url, opts = {}) {
    const headers = { ...(opts.headers || {}) };
    if (tokenAtual) headers.Authorization = `Bearer ${tokenAtual}`;
    const res = await fetch(url, { ...opts, headers });
    if (res.status === 401 && tokenAtual && aoPerderSessao) aoPerderSessao();
    return res;
}

// <img src>, <a href> e window.open não mandam header, então pros recursos
// abertos assim o token vai na própria URL (o backend só aceita isso em GET).
function comToken(url) {
    if (!tokenAtual) return url;
    return `${url}${url.includes('?') ? '&' : '?'}token=${encodeURIComponent(tokenAtual)}`;
}

export const api = {
    getWorkflows: async() => {
        const res = await req(`${BASE_URL}/workflows`);
        return res.json();
    },

    getTickets: async () => {
        const res = await req(`${BASE_URL}/tickets`);
        return res.json();
    },

    createWorkflow: async(name, types, terreno = 'Urbano') => {
        const res = await req(`${BASE_URL}/workflows`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, types, terreno })
        });
        return { data: await res.json(), ok: res.ok };
    },

    alterarStatusProcesso: async(id, status) => {
        const res = await req(`${BASE_URL}/workflows/${id}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        return { data: await res.json(), ok: res.ok };
    },

    updateWorkflow: async (id, types, terreno) => {
        await req(`${BASE_URL}/workflows/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ types, terreno })
        });
    },

    updateWorkflowDetails: async (id, { matricula, endereco, details }) => {
        const res = await req(`${BASE_URL}/workflows/${id}/details`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ matricula, endereco, details })
        });
        return res.json();
    },

    deleteWorkflow: async(id) => {
        await req(`${BASE_URL}/workflows/${id}`, { method: 'DELETE' });
    },

    createTicket: async ({ title, description, workflowId, currentStepId }) => {
        const res = await req(`${BASE_URL}/tickets`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, description, workflowId, currentStepId })
        });
        if (!res.ok) {
            const erro = await res.json().catch(() => ({}));
            throw new Error(erro.error || 'Erro ao criar tarefa.');
        }
        return res.json();
    },

    updateTicket: async (id, { description }) => {
        const res = await req(`${BASE_URL}/tickets/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ description })
        });
        return res.json();
    },

    deleteTicket: async (id) => {
        await req(`${BASE_URL}/tickets/${id}`, { method: 'DELETE' });
    },

    moveTicket: async (ticketId, toStepId, userId) => {
        await req(`${BASE_URL}/tickets/move`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ticketId, toStepId, userId })
        });
    },

    addComment: async (ticketId, userId, text) => {
        const res = await req(`${BASE_URL}/tickets/${ticketId}/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ticketId, userId, text })
        });
        return res.json();
    },

    // ---- NOVOS MÉTODOS PARA O FLUXO DE SERVIÇOS ----
    getSispontoFuncionarios: async () => {
        const res = await req(`${BASE_URL}/sis-ponto/funcionarios`);
        return res.json();
    },

    getSispontoRegistros: async () => {
        const res = await req(`${BASE_URL}/sis-ponto/registros`);
        return res.json();
    },

    createSispontoFuncionario: async (dados) => {
        const res = await req(`${BASE_URL}/sis-ponto/funcionarios`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });
        return res.json();
    },

    updateSispontoFuncionario: async (id, dados) => {
        const res = await req(`${BASE_URL}/sis-ponto/funcionarios/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });
        return res.json();
    },

    deleteSispontoFuncionario: async (id) => {
        const res = await req(`${BASE_URL}/sis-ponto/funcionarios/${id}`, { method: 'DELETE' });
        return res.json();
    },

    registrarSispontoPonto: async (dados) => {
        const res = await req(`${BASE_URL}/sis-ponto/registros`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });
        if (!res.ok) {
            const erro = await res.json().catch(() => ({}));
            throw new Error(erro.error || 'Erro ao registrar ponto.');
        }
        return res.json();
    },

    // Envio da fila offline (services/pontoOffline.js). Não lança em erro HTTP:
    // quem chama decide o que manter na fila pelo status. Sem rede, o fetch lança.
    syncSispontoBatidas: async (payload) => {
        const res = await req(`${BASE_URL}/sis-ponto/sync`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        return { ok: res.ok, status: res.status, data: await res.json().catch(() => ({})) };
    },

    // Pares sem saída/sem entrada/inconsistentes do mês (só ENG/DEV).
    getSispontoRevisao: async (mes) => {
        const res = await req(`${BASE_URL}/sis-ponto/revisao?mes=${encodeURIComponent(mes)}`);
        if (!res.ok) {
            const erro = await res.json().catch(() => ({}));
            throw new Error(erro.error || 'Erro ao carregar pontos para revisão.');
        }
        return res.json();
    },

    // ENG decide os horários previstos (pessoa não bateu): ABONADA, FALTA ou PENDENTE (desfaz).
    decidirSispontoPrevistas: async (ids, situacao) => {
        const res = await req(`${BASE_URL}/sis-ponto/previstas/decisao`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids, situacao })
        });
        if (!res.ok) {
            const erro = await res.json().catch(() => ({}));
            throw new Error(erro.error || 'Erro ao registrar a decisão.');
        }
        return res.json();
    },

    // Correção pelo ENG: inclui uma batida { funcionarioId, tipo: 'ENTRADA'|'SAIDA', batidoEm }.
    inserirSispontoAjuste: async (dados) => {
        const res = await req(`${BASE_URL}/sis-ponto/batidas/ajuste`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });
        if (!res.ok) {
            const erro = await res.json().catch(() => ({}));
            throw new Error(erro.error || 'Erro ao incluir batida.');
        }
        return res.json();
    },

    deleteSispontoRegistro: async (dados) => {
        const res = await req(`${BASE_URL}/sis-ponto/registros`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });
        if (!res.ok) {
            const erro = await res.json().catch(() => ({}));
            throw new Error(erro.error || 'Erro ao excluir registro.');
        }
        return res.json();
    },

    getSispontoJustificativas: async () => {
        const res = await req(`${BASE_URL}/sis-ponto/justificativas`);
        return res.json();
    },

    createSispontoJustificativa: async (dados) => {
        const res = await req(`${BASE_URL}/sis-ponto/justificativas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });
        if (!res.ok) {
            const erro = await res.json().catch(() => ({}));
            throw new Error(erro.error || 'Erro ao enviar justificativa.');
        }
        return res.json();
    },

    updateSispontoJustificativa: async (id, dados) => {
        const res = await req(`${BASE_URL}/sis-ponto/justificativas/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });
        if (!res.ok) {
            const erro = await res.json().catch(() => ({}));
            throw new Error(erro.error || 'Erro ao atualizar justificativa.');
        }
        return res.json();
    },

    deleteSispontoJustificativa: async (id) => {
        const res = await req(`${BASE_URL}/sis-ponto/justificativas/${id}`, { method: 'DELETE' });
        if (!res.ok) {
            const erro = await res.json().catch(() => ({}));
            throw new Error(erro.error || 'Erro ao excluir justificativa.');
        }
        return res.json();
    },

    getSispontoPadroesHorario: async () => {
        const res = await req(`${BASE_URL}/sis-ponto/padroes-horario`);
        if (!res.ok) {
            const erro = await res.json().catch(() => ({}));
            throw new Error(erro.error || 'Erro ao carregar padrões de horário.');
        }
        return res.json();
    },

    updateSispontoPadraoHorario: async (padraoId, dias) => {
        const res = await req(`${BASE_URL}/sis-ponto/padroes-horario/${padraoId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ dias })
        });
        if (!res.ok) {
            const erro = await res.json().catch(() => ({}));
            throw new Error(erro.error || 'Erro ao atualizar padrão de horário.');
        }
        return res.json();
    },

    getServicos: async () => {
        const res = await req(`${BASE_URL}/servicos`);
        return res.json();
    },

    // URL direta: a ficha é aberta numa aba pelo navegador, não consumida aqui.
    urlPdfServico: (servicoId) => comToken(`${BASE_URL}/servicos/${servicoId}/pdf`),

    // A "versao" quebra o cache do navegador: sem ela, trocar a imagem de um
    // serviço continuaria exibindo a antiga, já que a URL não muda.
    urlImagemServico: (servicoId, versao) =>
        comToken(`${BASE_URL}/servicos/${servicoId}/imagem${versao ? `?v=${encodeURIComponent(versao)}` : ''}`),

    // Prévia da ficha: devolve o PDF como blob para exibir num iframe.
    gerarPreviaPdf: async (servicoId, dados, signal) => {
        const res = await req(`${BASE_URL}/servicos/${servicoId}/pdf-previa`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados),
            signal
        });
        if (!res.ok) return null;
        return res.blob();
    },

    getServicoById: async (id) => {
        const res = await req(`${BASE_URL}/servicos/${id}`);
        return res.json();
    },

    createServico: async (dadosServico) => {
        const res = await req(`${BASE_URL}/servicos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dadosServico)
        });
        return { data: await res.json(), ok: res.ok };
    },

    salvarOrcamento: async (servicoId, dadosOrcamento) => {
        const res = await req(`${BASE_URL}/servicos/${servicoId}/orcamento`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dadosOrcamento)
        });
        return { data: await res.json(), ok: res.ok };
    },

    updateServico: async (servicoId, dadosServico) => {
        const res = await req(`${BASE_URL}/servicos/${servicoId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dadosServico)
        });
        return { data: await res.json(), ok: res.ok };
    },

    aprovarOrcamento: async (servicoId, decisao) => {
        const res = await req(`${BASE_URL}/servicos/${servicoId}/aprovar-orcamento`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ decisao })
        });
        return res.json();
    },

    // ---- CLIENTES ----
    getClientes: async () => {
        const res = await req(`${BASE_URL}/clientes`);
        return res.json();
    },

    getClienteById: async (id) => {
        const res = await req(`${BASE_URL}/clientes/${id}`);
        return res.json();
    },

    createCliente: async (dadosCliente) => {
        const res = await req(`${BASE_URL}/clientes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dadosCliente)
        });
        return { data: await res.json(), ok: res.ok };
    },

    updateCliente: async (id, dadosCliente) => {
        const res = await req(`${BASE_URL}/clientes/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dadosCliente)
        });
        return { data: await res.json(), ok: res.ok };
    },

    deleteCliente: async (id) => {
        await req(`${BASE_URL}/clientes/${id}`, { method: 'DELETE' });
    },

    // ---- IMÓVEIS ----
    getImoveis: async () => {
        const res = await req(`${BASE_URL}/imoveis`);
        return res.json();
    },

    getImovelById: async (id) => {
        const res = await req(`${BASE_URL}/imoveis/${id}`);
        return res.json();
    },

    createImovel: async (dadosImovel) => {
        const res = await req(`${BASE_URL}/imoveis`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dadosImovel)
        });
        return { data: await res.json(), ok: res.ok };
    },

    updateImovel: async (id, dadosImovel) => {
        const res = await req(`${BASE_URL}/imoveis/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dadosImovel)
        });
        return { data: await res.json(), ok: res.ok };
    },

    deleteImovel: async (id) => {
        await req(`${BASE_URL}/imoveis/${id}`, { method: 'DELETE' });
    },

    extrairDescricaoImovel: async ({ base64, mimeType }) => {
        const res = await req(`${BASE_URL}/imoveis/extrair-descricao`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ base64, mimeType })
        });
        return { data: await res.json(), ok: res.ok };
    },

    buscarCartorioPorCns: async (cns) => {
        const res = await req(`${BASE_URL}/cartorios/${encodeURIComponent(cns)}`);
        if (!res.ok) return null;
        return res.json();
    },

    // ---- VINCULAÇÃO ----
    salvarVinculacao: async (servicoId, dadosVinculacao) => {
        const res = await req(`${BASE_URL}/servicos/${servicoId}/vinculacao`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dadosVinculacao)
        });
        return { data: await res.json(), ok: res.ok };
    },

    // ---- DOCUMENTOS ----
    getTemplatesDocumento: async () => {
        const res = await req(`${BASE_URL}/documentos/templates`);
        return res.json();
    },

    salvarMapeamentoTiposDocumento: async (mapa) => {
        const res = await req(`${BASE_URL}/documentos/mapeamento-tipos`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mapa }),
        });
        return { data: await res.json(), ok: res.ok };
    },

    // URL direta: o navegador dispara o download, não é consumida via fetch.
    urlGerarDocumento: (servicoId, templateKey) => comToken(`${BASE_URL}/documentos/${servicoId}/${templateKey}`),

    registrarDocumentosNoProtocolo: async (servicoId, chaves) => {
        const res = await req(`${BASE_URL}/documentos/${servicoId}/protocolo`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chaves }),
        });
        return { data: await res.json(), ok: res.ok };
    },

    // ---- AUTENTICAÇÃO ----
    // `login` é o nome de usuário digitado na tela de entrada.
    login: async (login, senha) => {
        const res = await req(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ login, senha }),
        });
        return { data: await res.json(), ok: res.ok };
    },

    criarSenha: async (login, novaSenha) => {
        const res = await req(`${BASE_URL}/auth/criar-senha`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ login, novaSenha }),
        });
        return { data: await res.json(), ok: res.ok };
    },

    // Sem usuário no corpo: o backend troca a senha de quem está no token.
    alterarSenha: async (senhaAtual, novaSenha) => {
        const res = await req(`${BASE_URL}/auth/alterar-senha`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ senhaAtual, novaSenha }),
        });
        return { data: await res.json(), ok: res.ok };
    },

    // Confere o token guardado ao recarregar a página e devolve a pessoa.
    getSessao: async () => {
        const res = await req(`${BASE_URL}/auth/me`);
        return { data: await res.json(), ok: res.ok };
    },

    // ---- USUÁRIOS (cadastro de pessoas — só ENG/DEV) ----
    getUsuarios: async () => {
        const res = await req(`${BASE_URL}/usuarios`);
        return { data: await res.json(), ok: res.ok };
    },

    getSetores: async () => {
        const res = await req(`${BASE_URL}/usuarios/setores`);
        return { data: await res.json(), ok: res.ok };
    },

    criarUsuario: async (dados) => {
        const res = await req(`${BASE_URL}/usuarios`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados),
        });
        return { data: await res.json(), ok: res.ok };
    },

    atualizarUsuario: async (id, dados) => {
        const res = await req(`${BASE_URL}/usuarios/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados),
        });
        return { data: await res.json(), ok: res.ok };
    },

    definirSenhaUsuario: async (id, novaSenha) => {
        const res = await req(`${BASE_URL}/usuarios/${id}/senha`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ novaSenha }),
        });
        return { data: await res.json(), ok: res.ok };
    },

    // ---- TIPOS DE PROCESSO (etapas padrão do Kanban) ----
    getTiposProcesso: async () => {
        const res = await req(`${BASE_URL}/tipos-processo`);
        return res.json();
    },

    // Só ENG/DEV conseguem gravar — o backend confere pelo setor da sessão
    // (ver tipoProcessoRoutes.js).
    atualizarTipoProcesso: async (tipoProcesso, etapas) => {
        const res = await req(`${BASE_URL}/tipos-processo/${encodeURIComponent(tipoProcesso)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ etapas }),
        });
        return { data: await res.json(), ok: res.ok };
    },

    // ---- NOTIFICAÇÕES (setor responsável pela próxima etapa) ----
    // O setor das notificações vem da sessão, não mais do header x-usuario.
    getNotificacoes: async () => {
        const res = await req(`${BASE_URL}/notificacoes`);
        return res.json();
    },

    marcarNotificacaoComoLida: async (id) => {
        const res = await req(`${BASE_URL}/notificacoes/${id}/lida`, { method: 'PUT' });
        return res.json();
    },

    marcarTodasNotificacoesComoLidas: async () => {
        const res = await req(`${BASE_URL}/notificacoes/marcar-todas-lidas`, {
            method: 'PUT',
        });
        return res.json();
    },

    excluirNotificacao: async (id) => {
        const res = await req(`${BASE_URL}/notificacoes/${id}`, { method: 'DELETE' });
        return res.json();
    },

    // ---- FATURAMENTO: COBRANÇAS (boletos) ----
    getCobrancas: async () => {
        const res = await req(`${BASE_URL}/cobrancas`);
        return res.json();
    },

    criarCobranca: async (dados) => {
        const res = await req(`${BASE_URL}/cobrancas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados),
        });
        return { data: await res.json(), ok: res.ok };
    },

    // Cada parcela é um boleto emitido individualmente.
    emitirParcelaCobranca: async (cobrancaId, numeroParcela) => {
        const res = await req(`${BASE_URL}/cobrancas/${cobrancaId}/parcelas/${numeroParcela}/emitir`, { method: 'POST' });
        return { data: await res.json(), ok: res.ok };
    },

    // Boleto já emitido no banco, só o PDF que não veio — tenta de novo sem
    // re-emitir (evita duplicar o boleto no Inter).
    tentarBaixarPdfParcela: async (cobrancaId, numeroParcela) => {
        const res = await req(`${BASE_URL}/cobrancas/${cobrancaId}/parcelas/${numeroParcela}/baixar-pdf`, { method: 'POST' });
        return { data: await res.json(), ok: res.ok };
    },

    // URL direta: o PDF é aberto numa aba pelo navegador, não consumida aqui.
    urlPdfParcelaCobranca: (cobrancaId, numeroParcela) => comToken(`${BASE_URL}/cobrancas/${cobrancaId}/parcelas/${numeroParcela}/pdf`),

    // ---- FATURAMENTO: NOTAS FISCAIS ----
    getNotasFiscais: async () => {
        const res = await req(`${BASE_URL}/notas-fiscais`);
        return res.json();
    },

    criarNotaFiscal: async (dados) => {
        const res = await req(`${BASE_URL}/notas-fiscais`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados),
        });
        return { data: await res.json(), ok: res.ok };
    },

    emitirNotaFiscal: async (id) => {
        const res = await req(`${BASE_URL}/notas-fiscais/${id}/emitir`, { method: 'POST' });
        return { data: await res.json(), ok: res.ok };
    },

    // Nota já emitida na prefeitura, só o PDF que não veio — tenta de novo
    // sem re-emitir (evita duplicar a NFS-e).
    tentarBaixarPdfNotaFiscal: async (id) => {
        const res = await req(`${BASE_URL}/notas-fiscais/${id}/baixar-pdf`, { method: 'POST' });
        return { data: await res.json(), ok: res.ok };
    },

    urlPdfNotaFiscal: (id) => comToken(`${BASE_URL}/notas-fiscais/${id}/pdf`),

    // ---- TAREFAS ----
    getTarefas: async ({ setor, servicoId, status } = {}) => {
        const params = new URLSearchParams();
        if (setor) params.set('setor', setor);
        if (servicoId) params.set('servicoId', servicoId);
        if (status) params.set('status', status);
        const query = params.toString();
        const res = await req(`${BASE_URL}/tarefas${query ? `?${query}` : ''}`);
        return res.json();
    },

    criarTarefa: async (dados) => {
        const res = await req(`${BASE_URL}/tarefas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados),
        });
        return { data: await res.json(), ok: res.ok };
    },

    reordenarTarefas: async (ids) => {
        const res = await req(`${BASE_URL}/tarefas/reordenar`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids }),
        });
        // O controller devolve o motivo real em { error } quando falha — sem
        // isso o toast só consegue dizer "não foi possível", que não ajuda
        // ninguém a descobrir o que aconteceu.
        return { ok: res.ok, data: res.ok ? null : await res.json().catch(() => null) };
    },

    concluirTarefa: async (id, setor) => {
        const res = await req(`${BASE_URL}/tarefas/${id}/concluir`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ setor }),
        });
        return { data: await res.json(), ok: res.ok };
    },

    reabrirTarefa: async (id) => {
        const res = await req(`${BASE_URL}/tarefas/${id}/reabrir`, { method: 'POST' });
        return { data: await res.json(), ok: res.ok };
    },

    colocarTarefaEmAguardo: async (id, motivo) => {
        const res = await req(`${BASE_URL}/tarefas/${id}/aguardar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ motivo }),
        });
        return { data: await res.json(), ok: res.ok };
    },

    retomarTarefa: async (id) => {
        const res = await req(`${BASE_URL}/tarefas/${id}/retomar`, { method: 'POST' });
        return { data: await res.json(), ok: res.ok };
    },

    excluirTarefa: async (id) => {
        const res = await req(`${BASE_URL}/tarefas/${id}`, { method: 'DELETE' });
        return { ok: res.ok };
    },

    atualizarObservacaoTarefa: async (id, observacoes) => {
        const res = await req(`${BASE_URL}/tarefas/${id}/observacao`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ observacoes }),
        });
        return { data: await res.json(), ok: res.ok };
    },

    // O DELETE responde 204 sem corpo quando dá certo; o motivo da recusa
    // (ex.: parcela de boleto já emitido) só vem no corpo do erro.
    excluirCobranca: async (id) => {
        const res = await req(`${BASE_URL}/cobrancas/${id}`, { method: 'DELETE' });
        return { ok: res.ok, data: res.ok ? null : await res.json().catch(() => null) };
    },

    excluirNotaFiscal: async (id) => {
        const res = await req(`${BASE_URL}/notas-fiscais/${id}`, { method: 'DELETE' });
        return { ok: res.ok, data: res.ok ? null : await res.json().catch(() => null) };
    },
};