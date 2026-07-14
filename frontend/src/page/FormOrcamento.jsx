import { savedOrcamentos } from './servicesData';

export default function FormOrcamento({
  numero,
  cliente,
  matricula,
  salarioMinimo,
  area,
  isNewOrcamento,
  setCliente,
  setMatricula,
  setArea,
  handleOrcamentoChange,
  handleCreateNewOrcamento,
  handleSalarioMinimoChange,
}) {
  return (
    <div style={{ padding: '24px', borderBottom: '1px solid rgba(45, 42, 53, 0.08)' }}>
      {/* Orçamento e Botão Novo */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px', color: '#8E8A97', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase' }}>
          # Nº do Orçamento
        </label>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <select
            value={numero}
            onChange={(e) => handleOrcamentoChange(e.target.value)}
            style={{ flex: 1, height: '44px', borderRadius: '12px', border: '1px solid rgba(45, 42, 53, 0.12)', background: '#F2F4F8', padding: '0 12px', fontSize: '14px', outline: 'none', cursor: 'pointer' }}
          >
            {savedOrcamentos.map((item) => (
              <option key={item.numero} value={item.numero}>{item.numero}</option>
            ))}
            <option value="novo">* Criar Novo Orçamento *</option>
          </select>
          <button type="button" onClick={handleCreateNewOrcamento} style={{ height: '44px', padding: '0 20px', borderRadius: '12px', border: 'none', background: '#2D7AFD', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer' }}>
            + Novo
          </button>
        </div>
      </div>

      {/* Cliente e Matrícula */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', color: '#8E8A97', fontSize: '12px', fontWeight: 700 }}>👤 CLIENTE</label>
          <input
            value={cliente}
            onChange={(e) => setCliente(e.target.value)}
            disabled={!isNewOrcamento}
            style={{ width: '100%', boxSizing: 'border-box', height: '44px', borderRadius: '12px', border: '1px solid rgba(45, 42, 53, 0.08)', background: isNewOrcamento ? '#FFFFFF' : '#E9ECEF', padding: '12px 16px', fontSize: '14px', outline: 'none' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', color: '#8E8A97', fontSize: '12px', fontWeight: 700 }}>📍 MATRÍCULA</label>
          <input
            value={matricula}
            placeholder="—"
            onChange={(e) => setMatricula(e.target.value)}
            disabled={!isNewOrcamento}
            style={{ width: '100%', boxSizing: 'border-box', height: '44px', borderRadius: '12px', border: '1px solid rgba(45, 42, 53, 0.08)', background: isNewOrcamento ? '#FFFFFF' : '#E9ECEF', padding: '12px 16px', fontSize: '14px', outline: 'none' }}
          />
        </div>
      </div>

      {/* Salário Mínimo e Área */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', color: '#8E8A97', fontSize: '12px', fontWeight: 700 }}>💰 SALÁRIO MÍNIMO</label>
          <input
            value={salarioMinimo}
            type="number"
            step="0.01"
            onChange={(e) => handleSalarioMinimoChange(e.target.value)}
            style={{ width: '100%', boxSizing: 'border-box', height: '44px', borderRadius: '12px', border: '1px solid rgba(45, 42, 53, 0.08)', padding: '12px 16px', fontSize: '14px', outline: 'none' }}
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: '8px', alignItems: 'end' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: '#8E8A97', fontSize: '12px', fontWeight: 700 }}>📏 ÁREA (HA)</label>
            <input
              value={area}
              onChange={(e) => setArea(e.target.value)}
              style={{ width: '100%', boxSizing: 'border-box', height: '44px', borderRadius: '12px', border: '1px solid rgba(45, 42, 53, 0.08)', padding: '12px 16px', fontSize: '14px', outline: 'none' }}
            />
          </div>
          <button type="button" style={{ height: '44px', borderRadius: '12px', border: 'none', background: '#2D7AFD', color: '#FFFFFF', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}>
            Parcelas
          </button>
        </div>
      </div>
    </div>
  );
}
