export const fieldBase = {
  width: '100%',
  boxSizing: 'border-box',
  height: '44px',
  borderRadius: '12px',
  border: '1px solid #DDE5F2',
  background: '#FFFFFF',
  padding: '0 13px',
  color: '#061733',
  fontSize: '13px',
  fontWeight: 700,
  outline: 'none',
};

export const labelStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  color: '#475569',
  fontSize: '12px',
  fontWeight: 800,
};

export const cardStyle = {
  borderRadius: '18px',
  border: '1px solid #DDE5F2',
  background: '#FFFFFF',
  boxShadow: '0 14px 36px rgba(15, 23, 42, 0.07)',
};

export const currency = (value) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });

export const parseCurrency = (value) => {
  const normalized = String(value).replace(/\./g, '').replace(',', '.').replace(/[^0-9.]/g, '');
  const parsed = parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

// O Orçamento (e o Cadastro de Serviço) guardam os itens pela sigla curta
// (Ret, Uni, Desm...), a mesma usada internamente pra casar com o que foi
// pedido no cadastro — mas na Ordem de Serviço e no Contrato o cliente
// precisa ver o nome completo do tipo de processo, não a abreviação.
const NOME_COMPLETO_POR_SIGLA = {
  'Ret': 'Retificação',
  'Desm': 'Desmembramento',
  'Uni': 'Unificação',
  'Usu': 'Usucapião',
  'At': 'Alteração de Divisas',
  'CAR': 'CAR',
  'Cert': 'Certificação INCRA',
  'Escritura': 'Escritura',
  'Conf': 'Conferência',
  'Cad': 'Cadastral',
  'Loc': 'Locação',
  'Mov de Terra': 'Movimentação de Terra',
  'Altim': 'Altimetria',
  'DANC': 'DANC',
  'Rel. Usu': 'Relatório de Usucapião',
  'CCIR/ITR': 'CCIR/ITR',
  'Outros': 'Outros',
  'Ext': 'Extremação',
  'Lev Topo': 'Levantamento Topográfico',
};

// Nomes que não estão no mapa (ex.: um serviço avulso digitado à mão) saem
// como vieram — só traduz o que reconhece.
export const nomeCompletoServico = (nome) => NOME_COMPLETO_POR_SIGLA[nome] || nome;

export const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
