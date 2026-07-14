import { useMemo, useState } from 'react';

import ModalPagamento from './ModalPagamento.jsx';
import PainelMapa from './PainelMapa.jsx';

const initialServices = [
  {
    id: 1,
    nome: 'Levantamento Topográfico',
    lseca_km: '2,0',
    lseca_fator: '1,0',
    rio_km: '2,0',
    rio_fator: '1,0',
    indice: 4.0,
    ativo: true,
    selecionado: false,
  },
  { id: 2, nome: 'Retificação', detalhe: 'x1.5', indice: 1.5, ativo: true, selecionado: true },
  { id: 3, nome: 'Desmembramento', detalhe: 'x1.0', indice: 1.0, ativo: true, selecionado: false },
  { id: 4, nome: 'Unificação', detalhe: 'x1.0', indice: 1.0, ativo: true, selecionado: false },
  { id: 5, nome: 'Usucapião', detalhe: 'x1.0', indice: 1.0, ativo: true, selecionado: false },
  { id: 6, nome: 'Certificação', detalhe: 'x1.0', indice: 1.0, ativo: true, selecionado: false },
  { id: 7, nome: 'CAR', detalhe: 'x0.5', indice: 0.5, ativo: true, selecionado: false },
  { id: 8, nome: 'Escritura', detalhe: 'x1.0', indice: 1.0, ativo: true, selecionado: false },
  { id: 9, nome: 'Cadastral', detalhe: 'x1.0', indice: 1.0, ativo: true, selecionado: false },
  { id: 10, nome: 'Conferência', detalhe: 'x1.0', indice: 1.0, ativo: true, selecionado: false },
  { id: 11, nome: 'Movimentação de Terra', detalhe: 'x1.0', indice: 1.0, ativo: true, selecionado: false },
  { id: 12, nome: 'Locação', detalhe: 'x1.0', indice: 1.0, ativo: true, selecionado: false },
  { id: 13, nome: 'Atualização', detalhe: 'x1.0', indice: 1.0, ativo: true, selecionado: false },
];

const currency = (value) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });

const savedOrcamentos = [
  { numero: '20250117-011-TOP', cliente: 'Hermes', matricula: 'MT-1001' },
  { numero: '20250118-012-RET', cliente: 'Lúcia', matricula: 'MT-1002' },
];

const uniqueValues = (items, key) => [...new Set(items.map((item) => item[key]).filter(Boolean))];

function Orcamento() {
  const [services, setServices] = useState(initialServices);
  const [viewMode, setViewMode] = useState('Topografico');
  const [numero, setNumero] = useState(savedOrcamentos[0].numero);
  const [cliente, setCliente] = useState(savedOrcamentos[0].cliente);
  const [matricula, setMatricula] = useState(savedOrcamentos[0].matricula);
  const [area, setArea] = useState('0,00');
  const [salarioMinimo, setSalarioMinimo] = useState(1621.0);
  const [isNewOrcamento, setIsNewOrcamento] = useState(false);
  const [pagamentoAberto, setPagamentoAberto] = useState(false);

  const totalValor = useMemo(() =>
    services.filter((s) => s.selecionado && s.ativo).reduce((acc, s) => acc + s.indice * salarioMinimo, 0),
    [services, salarioMinimo]
  );

  const totalIndice = useMemo(() =>
    services.filter((s) => s.selecionado && s.ativo).reduce((acc, s) => acc + s.indice, 0),
    [services]
  );

  const numerosOrcamento = useMemo(() => uniqueValues(savedOrcamentos, 'numero'), []);
  const clientes = useMemo(() => uniqueValues(savedOrcamentos, 'cliente'), []);
  const matriculas = useMemo(() => uniqueValues(savedOrcamentos, 'matricula'), []);

  const toggleService = (id) => {
    setServices((curr) => curr.map((s) => s.id === id && s.ativo ? { ...s, selecionado: !s.selecionado } : s));
  };

  const parseNumberInput = (value) => {
    const normalized = String(value).replace(',', '.').replace(/[^0-9.]/g, '');
    const parsed = parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const updateServiceIndice = (id, value) => {
    const newIndice = parseNumberInput(value);
    setServices((curr) => curr.map((s) => s.id === id ? { ...s, indice: newIndice } : s));
  };

  const handleSalarioMinimoChange = (value) => {
    setSalarioMinimo(parseNumberInput(value) || 0);
  };

  const updateTopographicFields = (field, value) => {
    setServices((curr) => curr.map((s) => {
      if (s.id !== 1) return s;
      const updated = { ...s, [field]: value };
      const lsecaKm = parseNumberInput(updated.lseca_km);
      const lsecaFator = parseNumberInput(updated.lseca_fator);
      const rioKm = parseNumberInput(updated.rio_km);
      const rioFator = parseNumberInput(updated.rio_fator);
      
      const totalIndice = Number(((lsecaKm * lsecaFator) + (rioKm * rioFator)).toFixed(1));
      return { ...updated, indice: totalIndice };
    }));
  };

  const handleOrcamentoChange = (value) => {
    setNumero(value);

    const budget = savedOrcamentos.find((item) => item.numero === value);
    if (budget) {
      setNumero(budget.numero);
      setCliente(budget.cliente);
      setMatricula(budget.matricula);
      setIsNewOrcamento(false);
      return;
    }

    setIsNewOrcamento(true);
  };

  const handleClienteChange = (value) => {
    setCliente(value);

    const budget = savedOrcamentos.find((item) => item.cliente === value);
    if (budget) {
      setNumero(budget.numero);
      setCliente(budget.cliente);
      setMatricula(budget.matricula);
      setIsNewOrcamento(false);
      return;
    }

    setIsNewOrcamento(true);
  };

  const handleMatriculaChange = (value) => {
    setMatricula(value);

    const budget = savedOrcamentos.find((item) => item.matricula === value);
    if (budget) {
      setNumero(budget.numero);
      setCliente(budget.cliente);
      setMatricula(budget.matricula);
      setIsNewOrcamento(false);
      return;
    }

    setIsNewOrcamento(true);
  };

  const handleCreateNewOrcamento = () => {
    setNumero(''); setCliente(''); setMatricula(''); setIsNewOrcamento(true);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F4F6FA', fontFamily: 'Roboto, sans-serif', color: '#2D2A35', display: 'flex', flexDirection: 'column' }}>
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: '64px', background: '#FFFFFF', borderBottom: '1px solid rgba(45, 42, 53, 0.08)', display: 'flex', alignItems: 'center', padding: '0 24px', zIndex: 100, boxShadow: '0 2px 8px rgba(45, 42, 53, 0.06)' }}>
        <button type="button" style={{ width: '40px', height: '40px', borderRadius: '10px', border: '1px solid rgba(45, 42, 53, 0.12)', background: '#FFFFFF', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '16px' }}>←</button>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontSize: '18px', fontWeight: 700 }}>Orçamento</span>
          <span style={{ fontSize: '12px', color: '#8E8A97' }}>{isNewOrcamento ? 'Novo Orçamento' : numero}</span>
        </div>
      </div>

      <div style={{ marginTop: '64px', display: 'grid', gridTemplateColumns: '1fr 480px', flex: 1 }}>
        <PainelMapa viewMode={viewMode} setViewMode={setViewMode} />

        {/* Lado Direito */}
        <div style={{ background: '#FFFFFF', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
          
          {/* Área de conteúdo rolável (Formulário + Serviços juntos) */}
          <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '16px' }}>
            
            {/* Formulário */}
            <div style={{ padding: '32px 24px', borderBottom: '1px solid rgba(45, 42, 53, 0.08)' }}>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '10px', color: '#8E8A97', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase' }}># Nº do Orçamento</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    value={numero}
                    list="orcamentos-salvos"
                    onChange={(e) => handleOrcamentoChange(e.target.value)}
                    placeholder="Digite ou selecione"
                    style={{ flex: 1, height: '44px', borderRadius: '12px', border: '1px solid rgba(45, 42, 53, 0.08)', background: '#F2F4F8', padding: '0 14px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                  />
                  <datalist id="orcamentos-salvos">
                    {numerosOrcamento.map((item) => <option key={item} value={item} />)}
                  </datalist>
                  <button type="button" onClick={handleCreateNewOrcamento} style={{ width: '92px', height: '44px', borderRadius: '12px', background: '#2D7AFD', color: '#FFFFFF', fontSize: '14px', fontWeight: 700, cursor: 'pointer', border: 'none' }}>+ Novo</button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '10px', color: '#8E8A97', fontSize: '12px', fontWeight: 700 }}>👤 Cliente</label>
                  <input value={cliente} list="clientes-salvos" onChange={(e) => handleClienteChange(e.target.value)} placeholder="Digite ou selecione" style={{ width: '100%', boxSizing: 'border-box', height: '44px', borderRadius: '12px', border: '1px solid rgba(45, 42, 53, 0.08)', background: '#F2F4F8', padding: '12px 16px', fontSize: '14px', outline: 'none' }} />
                  <datalist id="clientes-salvos">
                    {clientes.map((item) => <option key={item} value={item} />)}
                  </datalist>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '10px', color: '#8E8A97', fontSize: '12px', fontWeight: 700 }}>📍 Matrícula</label>
                  <input value={matricula} list="matriculas-salvas" placeholder="Digite ou selecione" onChange={(e) => handleMatriculaChange(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', height: '44px', borderRadius: '12px', border: '1px solid rgba(45, 42, 53, 0.08)', background: '#F2F4F8', padding: '12px 16px', fontSize: '14px', outline: 'none' }} />
                  <datalist id="matriculas-salvas">
                    {matriculas.map((item) => <option key={item} value={item} />)}
                  </datalist>
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '10px', color: '#8E8A97', fontSize: '12px', fontWeight: 700 }}>💰 Valor de Referência</label>
                <input value={salarioMinimo.toFixed(2).replace('.', ',')} onChange={(e) => handleSalarioMinimoChange(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', height: '44px', borderRadius: '12px', border: '1px solid rgba(45, 42, 53, 0.08)', background: '#F2F4F8', padding: '12px 16px', fontSize: '14px', outline: 'none' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '10px', color: '#8E8A97', fontSize: '12px', fontWeight: 700 }}>📏 Área (ha)</label>
                  <input value={area} onChange={(e) => setArea(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', height: '44px', borderRadius: '12px', border: '1px solid rgba(45, 42, 53, 0.08)', background: '#F2F4F8', padding: '12px 16px', fontSize: '14px', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '10px', color: '#8E8A97', fontSize: '12px', fontWeight: 700 }}>💳 Parcelas</label>
                  <button type="button" style={{ width: '100%', height: '44px', borderRadius: '12px', border: 'none', background: '#2D7AFD', color: '#FFFFFF', cursor: 'pointer', fontWeight: 700, fontSize: '13px' }}>Parcelas</button>
                </div>
              </div>
            </div>

            {/* Cabeçalho da Tabela */}
            <div style={{ padding: '16px 24px 12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr 1fr', gap: '16px', paddingBottom: '12px', borderBottom: '2px solid #E8EDF5', color: '#8E8A97', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>
                <span>Serviço</span><span style={{ textAlign: 'center' }}>Índice</span><span style={{ textAlign: 'right' }}>Valor</span>
              </div>
            </div>

            {/* Lista de Serviços */}
            <div style={{ padding: '0 24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {services.map((service) => {
                const isSelected = service.selecionado && service.ativo;
                return (
                  <div key={service.id} onClick={() => toggleService(service.id)} style={{ display: 'flex', flexDirection: 'column', padding: '12px 14px', borderRadius: '12px', border: isSelected ? '2px solid #2D7AFD' : '1px solid rgba(45, 42, 53, 0.08)', background: isSelected ? '#E8F0FF' : '#FFFFFF', cursor: 'pointer', transition: 'all 0.15s' }}>
                    {service.id === 1 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '12px', borderBottom: '1px dashed rgba(45, 42, 53, 0.1)', paddingBottom: '10px' }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                          <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px', color: '#8E8A97', fontWeight: 600 }}>
                            L.Seca (Km)
                            <input type="text" value={service.lseca_km || ''} onChange={(e) => updateTopographicFields('lseca_km', e.target.value)} style={{ height: '32px', borderRadius: '8px', border: '1px solid rgba(45, 42, 53, 0.15)', background: '#F2F4F8', padding: '0 8px', fontSize: '12px', textAlign: 'center', outline: 'none' }} />
                          </label>
                          <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px', color: '#8E8A97', fontWeight: 600 }}>
                            f L.Seca
                            <input type="text" value={service.lseca_fator || ''} onChange={(e) => updateTopographicFields('lseca_fator', e.target.value)} style={{ height: '32px', borderRadius: '8px', border: '1px solid rgba(45, 42, 53, 0.15)', background: '#F2F4F8', padding: '0 8px', fontSize: '12px', textAlign: 'center', outline: 'none' }} />
                          </label>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                          <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px', color: '#8E8A97', fontWeight: 600 }}>
                            Rio (Km)
                            <input type="text" value={service.rio_km || ''} onChange={(e) => updateTopographicFields('rio_km', e.target.value)} style={{ height: '32px', borderRadius: '8px', border: '1px solid rgba(45, 42, 53, 0.15)', background: '#F2F4F8', padding: '0 8px', fontSize: '12px', textAlign: 'center', outline: 'none' }} />
                          </label>
                          <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px', color: '#8E8A97', fontWeight: 600 }}>
                            f Rio
                            <input type="text" value={service.rio_fator || ''} onChange={(e) => updateTopographicFields('rio_fator', e.target.value)} style={{ height: '32px', borderRadius: '8px', border: '1px solid rgba(45, 42, 53, 0.15)', background: '#F2F4F8', padding: '0 8px', fontSize: '12px', textAlign: 'center', outline: 'none' }} />
                          </label>
                        </div>
                      </div>
                    ) : null}

                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr 1fr', gap: '16px', alignItems: 'center', width: '100%' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', minWidth: 0 }}>
                        <input type="checkbox" checked={isSelected} readOnly style={{ width: '20px', height: '20px', minWidth: '20px', accentColor: '#2D7AFD', marginTop: '1px' }} />
                        <div style={{ fontSize: '13px', fontWeight: 600, lineHeight: '1.2', whiteSpace: 'normal', wordBreak: 'break-word', maxWidth: '140px', color: isSelected ? '#2D7AFD' : '#2D2A35' }}>{service.nome}</div>
                      </div>
                      <div style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                        <input type="text" value={service.indice.toFixed(1).replace('.', ',')} readOnly={service.id === 1} onChange={(e) => updateServiceIndice(service.id, e.target.value)} style={{ width: '64px', height: '34px', borderRadius: '8px', border: '1px solid rgba(45, 42, 53, 0.15)', background: service.id === 1 ? '#ECEEF4' : '#FFFFFF', fontSize: '13px', fontWeight: 600, color: '#2D2A35', textAlign: 'center', outline: 'none' }} />
                      </div>
                      <div style={{ textAlign: 'right', fontSize: '13px', fontWeight: 700 }}>{service.indice > 0 ? currency(service.indice * salarioMinimo) : '—'}</div>
                    </div>

                    {service.id !== 1 ? (
                      <div style={{ fontSize: '11px', color: '#8E8A97', marginTop: '4px', paddingLeft: '32px' }}>{service.detalhe}</div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Secção de Totais (Sempre Visível) */}
          <div style={{ padding: '12px 24px', borderTop: '1px solid rgba(45, 42, 53, 0.08)', background: '#FFFFFF' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr 1fr', gap: '16px', alignItems: 'center', padding: '14px', borderRadius: '12px', background: '#F5F7FB', fontWeight: 700, fontSize: '13px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>TOTAL <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '20px', background: '#E8EDF5', fontSize: '11px' }}>{services.filter((s) => s.selecionado && s.ativo).length}</span></div>
              <div style={{ textAlign: 'center' }}>{totalIndice.toFixed(1)}</div>
              <div style={{ textAlign: 'right' }}>{currency(totalValor)}</div>
            </div>
          </div>

          {/* Rodapé de Ações (Sempre Visível na parte inferior do ecrã) */}
          <div style={{ padding: '16px 24px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', borderTop: '1px solid rgba(45, 42, 53, 0.08)', background: '#FFFFFF' }}>
            <button type="button" onClick={() => setPagamentoAberto(true)} style={{ borderRadius: '12px', border: '1px solid rgba(45, 42, 53, 0.12)', background: '#FFFFFF', padding: '12px 16px', cursor: 'pointer', fontWeight: 700, fontSize: '13px' }}>💳 Pagamento</button>
            <button type="button" style={{ borderRadius: '12px', border: '1px solid rgba(45, 42, 53, 0.12)', background: '#FFFFFF', padding: '12px 16px', cursor: 'pointer', fontWeight: 700, fontSize: '13px' }}>💬 Notas</button>
            <button type="button" style={{ borderRadius: '12px', border: 'none', background: '#10A37F', color: '#FFFFFF', padding: '12px 16px', cursor: 'pointer', fontWeight: 700, fontSize: '13px' }}>✅ Confirmar</button>
          </div>

        </div>
      </div>
      {pagamentoAberto ? (
        <ModalPagamento totalValor={totalValor} onClose={() => setPagamentoAberto(false)} />
      ) : null}
    </div>
  );
}

export default Orcamento;
