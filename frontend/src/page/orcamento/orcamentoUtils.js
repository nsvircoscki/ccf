export const currency = (value) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });

export const formatIndex = (value) => value.toFixed(1).replace('.', ',');

export const uniqueValues = (items, key) => [...new Set(items.map((item) => item[key]).filter(Boolean))];

export const parseNumberInput = (value) => {
  const normalized = String(value ?? '').replace(',', '.').replace(/[^0-9.]/g, '');
  const parsed = parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const normalizeText = (value) =>
  String(value || '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

export const baseFieldStyle = {
  height: '44px',
  borderRadius: '12px',
  border: '1px solid rgba(15, 23, 42, 0.12)',
  background: '#F8FAFD',
  padding: '0 14px',
  fontSize: '14px',
  outline: 'none',
  color: '#1F2937',
  width: '100%',
};

export const activeFieldStyle = {
  border: '1px solid #2D7AFD',
  boxShadow: '0 0 0 3px rgba(45, 122, 253, 0.12)',
};

export const labelTextStyle = {
  fontSize: '12px',
  fontWeight: 800,
  color: '#5F6B83',
  textTransform: 'uppercase',
};

export const optionRowStyle = {
  display: 'flex',
  gap: '8px',
};
