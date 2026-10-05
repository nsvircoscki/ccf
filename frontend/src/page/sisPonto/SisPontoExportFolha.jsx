import { useState } from 'react';
import { api } from '../../services/api';
import { Card } from './SisPontoComponents.jsx';

const mesAnterior = () => {
  const hoje = new Date();
  const d = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

// CSV do mês no formato que o Sistema Ponto (PC da folha) importa: as mesmas
// colunas da planilha antiga + CCF ID e Observacao, sem nenhum valor em
// dinheiro. No Sistema Ponto: FONTE_PONTOS=arquivo e botão "Importar CSV".
export default function SisPontoExportFolha({ onExportarDia }) {
  const [mes, setMes] = useState(mesAnterior);
  const [estado, setEstado] = useState({ baixando: false, erro: null });

  const baixar = async () => {
    setEstado({ baixando: true, erro: null });
    try {
      const blob = await api.baixarSispontoFolhaCsv(mes);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `pontos-${mes}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setEstado({ baixando: false, erro: null });
    } catch (erro) {
      setEstado({ baixando: false, erro: erro.message });
    }
  };

  return (
    <section className="sis-empty-view" style={{ display: 'grid', gap: 16 }}>
      <Card style={{ padding: 26 }}>
        <h2 style={{ margin: 0, fontSize: 20 }}>Pontos para a folha (Sistema Ponto)</h2>
        <p style={{ margin: '6px 0 18px', color: '#7183a3', fontSize: 13, fontWeight: 600, lineHeight: 1.5 }}>
          Baixa todas as batidas do mês no formato que o Sistema Ponto importa (botão "Importar CSV", com FONTE_PONTOS=arquivo).
          Faltas marcadas pelo ENG saem com 0 h e código 6; esquecimentos ainda sem decisão saem com 0 h e aparecem na conferência da folha.
          Confira a aba "Pontos a revisar" antes de exportar.
        </p>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <input type="month" value={mes} onChange={(e) => setMes(e.target.value)} style={{ padding: '9px 10px', border: '1px solid #d8e6fc', borderRadius: 8, color: '#405371', fontWeight: 700 }} />
          <button type="button" disabled={estado.baixando || !mes} onClick={baixar} style={{ border: 0, borderRadius: 9, padding: '11px 15px', background: '#1767e8', color: '#fff', fontWeight: 800, cursor: 'pointer', opacity: estado.baixando ? .7 : 1 }}>
            {estado.baixando ? 'Gerando...' : 'Baixar CSV para a folha'}
          </button>
        </div>
        {estado.erro && <p style={{ margin: '12px 0 0', color: '#be3747', fontWeight: 700 }}>{estado.erro}</p>}
      </Card>

      <Card style={{ padding: 26 }}>
        <h2 style={{ margin: 0, fontSize: 16 }}>Relatório do dia</h2>
        <p style={{ margin: '6px 0 18px', color: '#7183a3', fontSize: 13, fontWeight: 600 }}>
          Resumo do dia selecionado no Dashboard (entrada, intervalo, retorno, saída e status). Serve para conferência; não é aceito pelo Sistema Ponto.
        </p>
        <button type="button" onClick={onExportarDia} style={{ border: '1px solid #d8e4f3', borderRadius: 9, padding: '10px 14px', background: '#fff', color: '#405371', fontWeight: 800, cursor: 'pointer' }}>Exportar relatório do dia</button>
      </Card>
    </section>
  );
}
