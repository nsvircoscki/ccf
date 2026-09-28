// Grupos de módulos: um item só no menu (navbar e seletor de módulos) que, ao
// ser clicado, abre as opções de dentro. Definidos aqui uma vez pra navbar e
// seletor não divergirem sobre o que fica em cada grupo e quem vê o quê.
import {
  ClipboardList, Users, Home, FileText, ListChecks, FileSpreadsheet, Table, BarChart3, Settings2, UserCog,
} from 'lucide-react';
import { temAcessoAoModulo } from './permissoes';

export const GRUPOS = {
  cadastros: {
    label: 'Cadastros',
    desc: 'Serviço, pessoas e imóveis',
    titulo: 'Cadastros — escolha o que cadastrar',
    icon: ClipboardList,
    color: '#1a3a8a',
    itens: [
      { id: 'cadastro', label: 'Serviço', desc: 'Abrir um novo serviço e escolher os tipos de processo', icon: ClipboardList, color: '#1a3a8a' },
      { id: 'clientes', label: 'Pessoas', desc: 'Cadastro de clientes, pessoas físicas e jurídicas', icon: Users, color: '#be185d' },
      { id: 'imoveis', label: 'Imóveis', desc: 'Cadastro de imóveis, proprietários e usufrutuários', icon: Home, color: '#7c3aed' },
    ],
  },
  relatorios: {
    label: 'Relatórios',
    desc: 'Tabela de serviços e pontos de levantamento',
    titulo: 'Relatórios — escolha qual abrir',
    icon: BarChart3,
    color: '#4f46e5',
    itens: [
      { id: 'tabela-servicos', label: 'Tabela de Serviços', desc: 'Todos os projetos, etapa atual e o que falta em cada um', icon: Table, color: '#4d7c0f' },
      { id: 'importar-pontos', label: 'Pontos', desc: 'Converte exportação de levantamento (GNSS/RTK) em tabela/Excel', icon: FileSpreadsheet, color: '#0369a1' },
    ],
  },
  config: {
    label: 'Configurações',
    desc: 'Documentos, etapas, usuários e outros ajustes do sistema',
    titulo: 'Configurações — escolha o que ajustar',
    icon: Settings2,
    color: '#64748b',
    // Configurações tem permissão própria em permissoes.js ('config'); nos
    // outros grupos vale a permissão de cada tela de dentro.
    permissaoPropria: true,
    itens: [
      { id: 'config-documentos', label: 'Documentos', desc: 'Quais documentos aparecem para cada tipo de serviço', icon: FileText, color: '#64748b' },
      { id: 'config-etapas', label: 'Etapas', desc: 'Etapas padrão de cada tipo de processo no Kanban', icon: ListChecks, color: '#9333ea', apenasEng: true },
      { id: 'config-usuarios', label: 'Usuários', desc: 'Pessoas com acesso ao sistema, setor e senha', icon: UserCog, color: '#0f766e', apenasEng: true },
    ],
  },
};

export const ehGrupo = (id) => Boolean(GRUPOS[id]);

// Subitens que aparecem pra pessoa: "apenasEng" some pra quem não é ENG/DEV
// (mesma restrição da tela em si).
export function subitensDoGrupo(grupoId, usuarioLogado) {
  return GRUPOS[grupoId].itens.filter((sub) => !sub.apenasEng || ['ENG', 'DEV'].includes(usuarioLogado));
}

export function podeAbrirSubitem(grupoId, sub, usuarioLogado) {
  if (GRUPOS[grupoId].permissaoPropria) return temAcessoAoModulo(usuarioLogado, grupoId);
  return temAcessoAoModulo(usuarioLogado, sub.id);
}

// O grupo só vale a pena se a pessoa consegue abrir ao menos uma coisa dentro
// (TOPO, por exemplo, não acessa nenhum cadastro).
export function grupoAcessivel(grupoId, usuarioLogado) {
  return subitensDoGrupo(grupoId, usuarioLogado).some((sub) => podeAbrirSubitem(grupoId, sub, usuarioLogado));
}
