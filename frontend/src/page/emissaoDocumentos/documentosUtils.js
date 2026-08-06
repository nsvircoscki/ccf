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

export const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
