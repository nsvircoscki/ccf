import { useMemo, useState } from 'react';

const currency = (value) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });

const parseDecimal = (value) => {
  const normalized = String(value ?? '').replace(',', '.').replace(/[^0-9.]/g, '');
  const parsed = parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatInput = (value) => {
  if (!Number.isFinite(value)) return '';
  return value.toFixed(2).replace('.', ',');
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const todayInput = () => new Date().toISOString().slice(0, 10);

const addDays = (dateValue, days) => {
  if (!dateValue) return '';
  const [year, month, day] = dateValue.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

const ordinal = (number) => `${number}ª`;

const fieldStyle = (disabled = false) => ({
  width: '100%',
  boxSizing: 'border-box',
  height: '42px',
  borderRadius: '12px',
  border: '1px solid rgba(45, 42, 53, 0.12)',
  background: disabled ? '#ECEEF4' : '#FFFFFF',
  color: disabled ? '#8E8A97' : '#2D2A35',
  padding: '0 12px',
  fontSize: '13px',
  fontWeight: 600,
  outline: 'none',
});

const labelStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  color: '#6D7280',
  fontSize: '12px',
  fontWeight: 700,
};

const sectionStyle = {
  borderRadius: '14px',
  border: '1px solid rgba(45, 42, 53, 0.08)',
  background: '#FFFFFF',
  padding: '16px',
  display: 'flex',
  flexDirection: 'column',
  gap: '14px',
};

function ModalPagamento({ totalValor, onClose }) {
  const [descontoAtivo, setDescontoAtivo] = useState(false);
  const [desconto, setDesconto] = useState({ valor: '', percentual: '', totalFinal: formatInput(totalValor) });
  const [entradaAtiva, setEntradaAtiva] = useState(false);
  const [entradaValor, setEntradaValor] = useState('');
  const [entradaData, setEntradaData] = useState(todayInput());
  const [parcelamentoAtivo, setParcelamentoAtivo] = useState(false);
  const [quantidadeParcelas, setQuantidadeParcelas] = useState('3');
  const [jurosAtivo, setJurosAtivo] = useState(false);
  const [taxaJuros, setTaxaJuros] = useState('');
  const [tipoJuros, setTipoJuros] = useState('simples');
  const [baseJuros, setBaseJuros] = useState('parcelas');
  const [parcelaSelecionada, setParcelaSelecionada] = useState('');
  const [edicoesParcelas, setEdicoesParcelas] = useState({});

  const totalTrabalho = Number.isFinite(totalValor) ? totalValor : 0;
  const totalComDesconto = descontoAtivo ? parseDecimal(desconto.totalFinal) : totalTrabalho;
  const valorEntrada = entradaAtiva ? clamp(parseDecimal(entradaValor), 0, totalComDesconto) : 0;
  const saldoRemanescente = Math.max(totalComDesconto - valorEntrada, 0);
  const numeroParcelas = parcelamentoAtivo ? Math.max(1, Math.floor(parseDecimal(quantidadeParcelas))) : 0;

  const updateDiscountFromValue = (value) => {
    const valor = clamp(parseDecimal(value), 0, totalTrabalho);
    const percentual = totalTrabalho > 0 ? (valor / totalTrabalho) * 100 : 0;
    setDesconto({ valor: value, percentual: formatInput(percentual), totalFinal: formatInput(totalTrabalho - valor) });
  };

  const updateDiscountFromPercent = (value) => {
    const percentual = clamp(parseDecimal(value), 0, 100);
    const valor = (totalTrabalho * percentual) / 100;
    setDesconto({ valor: formatInput(valor), percentual: value, totalFinal: formatInput(totalTrabalho - valor) });
  };

  const updateDiscountFromFinal = (value) => {
    const totalFinal = clamp(parseDecimal(value), 0, totalTrabalho);
    const valor = totalTrabalho - totalFinal;
    const percentual = totalTrabalho > 0 ? (valor / totalTrabalho) * 100 : 0;
    setDesconto({ valor: formatInput(valor), percentual: formatInput(percentual), totalFinal: value });
  };

  const parcelas = useMemo(() => {
    if (!entradaAtiva || !parcelamentoAtivo || !entradaData || numeroParcelas <= 0 || saldoRemanescente <= 0) {
      return [];
    }

    const taxa = jurosAtivo ? parseDecimal(taxaJuros) / 100 : 0;
    const basePadrao = saldoRemanescente / numeroParcelas;
    const jurosTotalSaldo = jurosAtivo && baseJuros === 'saldo'
      ? tipoJuros === 'composto'
        ? saldoRemanescente * (Math.pow(1 + taxa, numeroParcelas) - 1)
        : saldoRemanescente * taxa
      : 0;

    return Array.from({ length: numeroParcelas }, (_, index) => {
      const parcelaNumero = index + 1;
      const base = parcelaNumero === numeroParcelas
        ? saldoRemanescente - basePadrao * (numeroParcelas - 1)
        : basePadrao;
      const juros = jurosAtivo
        ? baseJuros === 'saldo'
          ? jurosTotalSaldo / numeroParcelas
          : tipoJuros === 'composto'
            ? base * (Math.pow(1 + taxa, parcelaNumero) - 1)
            : base * taxa * parcelaNumero
        : 0;
      const gerada = {
        numero: parcelaNumero,
        base,
        juros,
        final: base + juros,
        vencimento: addDays(entradaData, index * 30),
      };
      const editada = edicoesParcelas[parcelaNumero];

      if (!editada) return gerada;

      const baseEditada = editada.base !== undefined ? parseDecimal(editada.base) : gerada.base;
      const jurosEditado = editada.juros !== undefined ? parseDecimal(editada.juros) : gerada.juros;
      return {
        ...gerada,
        base: baseEditada,
        juros: jurosEditado,
        final: baseEditada + jurosEditado,
        vencimento: editada.vencimento || gerada.vencimento,
        manual: true,
      };
    });
  }, [
    baseJuros,
    edicoesParcelas,
    entradaAtiva,
    entradaData,
    jurosAtivo,
    numeroParcelas,
    parcelamentoAtivo,
    saldoRemanescente,
    taxaJuros,
    tipoJuros,
  ]);

  const totaisParcelas = useMemo(() => parcelas.reduce((acc, parcela) => ({
    base: acc.base + parcela.base,
    juros: acc.juros + parcela.juros,
    final: acc.final + parcela.final,
  }), { base: 0, juros: 0, final: 0 }), [parcelas]);

  const totalPago = parcelas.length > 0 ? valorEntrada + totaisParcelas.final : totalComDesconto;
  const parcelaEditavel = parcelas.find((parcela) => String(parcela.numero) === String(parcelaSelecionada));

  const updateParcelaManual = (field, value) => {
    if (!parcelaSelecionada) return;
    setEdicoesParcelas((current) => ({
      ...current,
      [parcelaSelecionada]: {
        ...current[parcelaSelecionada],
        [field]: value,
      },
    }));
  };

  const handleDescontoToggle = (checked) => {
    setDescontoAtivo(checked);
    if (!checked) {
      setDesconto({ valor: '', percentual: '', totalFinal: formatInput(totalTrabalho) });
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(20, 24, 36, 0.45)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: 'min(980px, 100%)', maxHeight: '92vh', overflow: 'hidden', borderRadius: '22px', background: '#F5F7FB', boxShadow: '0 24px 80px rgba(18, 27, 45, 0.28)', display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
        <div style={{ padding: '22px 24px', background: '#FFFFFF', borderBottom: '1px solid rgba(45, 42, 53, 0.08)', display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '12px', color: '#8E8A97', fontWeight: 800, textTransform: 'uppercase' }}>Condições de Pagamento</div>
            <h2 style={{ margin: '4px 0 0', fontSize: '22px', color: '#2D2A35', fontWeight: 800 }}>Valor Total do Trabalho: {currency(totalTrabalho)}</h2>
          </div>
          <button type="button" onClick={onClose} style={{ width: '42px', height: '42px', borderRadius: '12px', border: '1px solid rgba(45, 42, 53, 0.12)', background: '#FFFFFF', cursor: 'pointer', fontSize: '20px', color: '#5F6370' }}>×</button>
        </div>

        <div style={{ overflowY: 'auto', padding: '18px 24px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            <div style={{ ...sectionStyle, background: '#E8F0FF', borderColor: 'rgba(45, 122, 253, 0.18)' }}>
              <span style={{ fontSize: '12px', color: '#4770B8', fontWeight: 800 }}>Total com desconto</span>
              <strong style={{ fontSize: '22px', color: '#2D7AFD' }}>{currency(totalComDesconto)}</strong>
            </div>
            <div style={{ ...sectionStyle }}>
              <span style={{ fontSize: '12px', color: '#8E8A97', fontWeight: 800 }}>Saldo remanescente</span>
              <strong style={{ fontSize: '22px', color: '#2D2A35' }}>{currency(saldoRemanescente)}</strong>
            </div>
            <div style={{ ...sectionStyle, background: '#EAF8F3', borderColor: 'rgba(16, 163, 127, 0.18)' }}>
              <span style={{ fontSize: '12px', color: '#408875', fontWeight: 800 }}>Total final a pagar</span>
              <strong style={{ fontSize: '22px', color: '#10A37F' }}>{currency(totalPago)}</strong>
            </div>
          </div>

          <div style={sectionStyle}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 800, color: '#2D2A35' }}>
              <input type="checkbox" checked={descontoAtivo} onChange={(event) => handleDescontoToggle(event.target.checked)} style={{ width: '18px', height: '18px', accentColor: '#2D7AFD' }} />
              Aplicar Desconto
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              <label style={labelStyle}>Valor do Desconto (R$)
                <input value={desconto.valor} disabled={!descontoAtivo} onChange={(event) => updateDiscountFromValue(event.target.value)} style={fieldStyle(!descontoAtivo)} />
              </label>
              <label style={labelStyle}>Porcentagem (%)
                <input value={desconto.percentual} disabled={!descontoAtivo} onChange={(event) => updateDiscountFromPercent(event.target.value)} style={fieldStyle(!descontoAtivo)} />
              </label>
              <label style={labelStyle}>Total Final
                <input value={desconto.totalFinal} disabled={!descontoAtivo} onChange={(event) => updateDiscountFromFinal(event.target.value)} style={fieldStyle(!descontoAtivo)} />
              </label>
            </div>
          </div>

          <div style={sectionStyle}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 800, color: '#2D2A35' }}>
              <input type="checkbox" checked={entradaAtiva} onChange={(event) => setEntradaAtiva(event.target.checked)} style={{ width: '18px', height: '18px', accentColor: '#2D7AFD' }} />
              Fazer Entrada
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              <label style={labelStyle}>Valor da Entrada (R$)
                <input value={entradaValor} disabled={!entradaAtiva} onChange={(event) => setEntradaValor(event.target.value)} style={fieldStyle(!entradaAtiva)} />
              </label>
              <label style={labelStyle}>Data da Entrada / 1ª Parcela
                <input type="date" value={entradaData} disabled={!entradaAtiva} onChange={(event) => setEntradaData(event.target.value)} style={fieldStyle(!entradaAtiva)} />
              </label>
              <label style={labelStyle}>Saldo Remanescente
                <input value={formatInput(saldoRemanescente)} readOnly disabled style={fieldStyle(true)} />
              </label>
            </div>
          </div>

          <div style={sectionStyle}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 800, color: '#2D2A35' }}>
              <input type="checkbox" checked={parcelamentoAtivo} onChange={(event) => setParcelamentoAtivo(event.target.checked)} style={{ width: '18px', height: '18px', accentColor: '#2D7AFD' }} />
              Parcelamento
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: jurosAtivo ? '0.8fr 0.8fr 1fr 1fr' : '1fr 1fr', gap: '12px' }}>
              <label style={labelStyle}>Quantidade de Parcelas
                <input type="number" min="1" value={quantidadeParcelas} disabled={!parcelamentoAtivo} onChange={(event) => setQuantidadeParcelas(event.target.value)} style={fieldStyle(!parcelamentoAtivo)} />
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '22px', fontWeight: 800, color: parcelamentoAtivo ? '#2D2A35' : '#8E8A97' }}>
                <input type="checkbox" checked={jurosAtivo} disabled={!parcelamentoAtivo} onChange={(event) => setJurosAtivo(event.target.checked)} style={{ width: '18px', height: '18px', accentColor: '#2D7AFD' }} />
                Juros
              </label>
              {jurosAtivo ? (
                <>
                  <label style={labelStyle}>Taxa de Juros (%)
                    <input value={taxaJuros} disabled={!parcelamentoAtivo} onChange={(event) => setTaxaJuros(event.target.value)} style={fieldStyle(!parcelamentoAtivo)} />
                  </label>
                  <label style={labelStyle}>Tipo de Juros
                    <select value={tipoJuros} disabled={!parcelamentoAtivo} onChange={(event) => setTipoJuros(event.target.value)} style={fieldStyle(!parcelamentoAtivo)}>
                      <option value="simples">Simples</option>
                      <option value="composto">Composto</option>
                    </select>
                  </label>
                  <label style={labelStyle}>Base de Cálculo
                    <select value={baseJuros} disabled={!parcelamentoAtivo} onChange={(event) => setBaseJuros(event.target.value)} style={fieldStyle(!parcelamentoAtivo)}>
                      <option value="parcelas">Aplicar sobre as Parcelas</option>
                      <option value="saldo">Aplicar sobre o Saldo Total</option>
                    </select>
                  </label>
                </>
              ) : null}
            </div>
          </div>

          {parcelas.length > 0 ? (
            <>
              <div style={{ ...sectionStyle, padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '16px 16px 0', fontWeight: 800, color: '#2D2A35' }}>Tabela de Parcelas</div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ color: '#8E8A97', textTransform: 'uppercase', fontSize: '11px' }}>
                        <th style={{ padding: '12px 16px', textAlign: 'left' }}>Nº</th>
                        <th style={{ padding: '12px 16px', textAlign: 'right' }}>Valor Base</th>
                        <th style={{ padding: '12px 16px', textAlign: 'right' }}>Juros</th>
                        <th style={{ padding: '12px 16px', textAlign: 'right' }}>Valor Final</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left' }}>Vencimento</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parcelas.map((parcela) => (
                        <tr key={parcela.numero} style={{ borderTop: '1px solid #E8EDF5', background: parcela.manual ? '#FFF8E8' : '#FFFFFF' }}>
                          <td style={{ padding: '12px 16px', fontWeight: 800 }}>{ordinal(parcela.numero)}</td>
                          <td style={{ padding: '12px 16px', textAlign: 'right' }}>{currency(parcela.base)}</td>
                          <td style={{ padding: '12px 16px', textAlign: 'right' }}>{currency(parcela.juros)}</td>
                          <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 800 }}>{currency(parcela.final)}</td>
                          <td style={{ padding: '12px 16px' }}>{parcela.vencimento}</td>
                        </tr>
                      ))}
                      <tr style={{ borderTop: '2px solid #DDE5F2', background: '#F5F7FB', fontWeight: 900 }}>
                        <td style={{ padding: '12px 16px' }}>Totais</td>
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>{currency(totaisParcelas.base)}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>{currency(totaisParcelas.juros)}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>{currency(totaisParcelas.final)}</td>
                        <td style={{ padding: '12px 16px' }}>Entrada: {currency(valorEntrada)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div style={sectionStyle}>
                <div style={{ fontWeight: 800, color: '#2D2A35' }}>Editar Parcela Selecionada</div>
                <div style={{ display: 'grid', gridTemplateColumns: '0.9fr repeat(3, 1fr)', gap: '12px' }}>
                  <label style={labelStyle}>Parcela
                    <select value={parcelaSelecionada} onChange={(event) => setParcelaSelecionada(event.target.value)} style={fieldStyle(false)}>
                      <option value="">Selecione</option>
                      {parcelas.map((parcela) => <option key={parcela.numero} value={parcela.numero}>{ordinal(parcela.numero)} parcela</option>)}
                    </select>
                  </label>
                  <label style={labelStyle}>Valor Manual
                    <input disabled={!parcelaEditavel} value={edicoesParcelas[parcelaSelecionada]?.base ?? (parcelaEditavel ? formatInput(parcelaEditavel.base) : '')} onChange={(event) => updateParcelaManual('base', event.target.value)} style={fieldStyle(!parcelaEditavel)} />
                  </label>
                  <label style={labelStyle}>Juro Personalizado
                    <input disabled={!parcelaEditavel} value={edicoesParcelas[parcelaSelecionada]?.juros ?? (parcelaEditavel ? formatInput(parcelaEditavel.juros) : '')} onChange={(event) => updateParcelaManual('juros', event.target.value)} style={fieldStyle(!parcelaEditavel)} />
                  </label>
                  <label style={labelStyle}>Vencimento
                    <input type="date" disabled={!parcelaEditavel} value={edicoesParcelas[parcelaSelecionada]?.vencimento ?? parcelaEditavel?.vencimento ?? ''} onChange={(event) => updateParcelaManual('vencimento', event.target.value)} style={fieldStyle(!parcelaEditavel)} />
                  </label>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default ModalPagamento;
