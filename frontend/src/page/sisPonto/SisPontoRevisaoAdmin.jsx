import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Card } from './SisPontoComponents.jsx';

// Pontos que precisam de conferência antes de fechar a folha: entrada sem
// saída, saída sem entrada e sequência inconsistente (ex.: duas entradas
// seguidas). Nenhum deles é descartado — saem assim no CSV do PC da folha,
// com a observação, até alguém corrigir.
const ROTULOS = {
  SEM_SAIDA: 'Entrada sem saída',
  SEM_ENTRADA: 'Saída sem entrada',
  'INCONSISTENTE:ENTRADA_SEGUIDA': 'Duas entradas seguidas',
  'INCONSISTENTE:SAIDA_SEM_ENTRADA': 'Saída fora de sequência',
};

const mesAtual = () => {
  const hoje = new Date();
  return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
};
const formatar = (iso) => (iso ? new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—');

export default function SisPontoRevisaoAdmin() {
  const [mes, setMes] = useState(mesAtual);
  const [itens, setItens] = useState([]);
  const [estado, setEstado] = useState({ carregando: true, erro: null });

  useEffect(() => {
    let ativo = true;
    api.getSispontoRevisao(mes)
      .then((lista) => { if (ativo) { setItens(Array.isArray(lista) ? lista : []); setEstado({ carregando: false, erro: null }); } })
      .catch((erro) => { if (ativo) setEstado({ carregando: false, erro: erro.message }); });
    return () => { ativo = false; };
  }, [mes]);

  return (
    <section className="sis-empty-view">
      <Card style={{ padding: 26, minHeight: 280 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20 }}>Pontos a revisar</h2>
            <p style={{ margin: '6px 0 0', color: '#7183a3', fontSize: 13, fontWeight: 600 }}>Confira antes de fechar a folha. Para corrigir, exclua a batida errada no calendário do funcionário.</p>
          </div>
          <input type="month" value={mes} onChange={(e) => { setEstado({ carregando: true, erro: null }); setMes(e.target.value || mesAtual()); }} style={{ padding: '8px 10px', border: '1px solid #d8e6fc', borderRadius: 8, color: '#405371', fontWeight: 700 }} />
        </div>

        {estado.erro && <p style={{ color: '#be3747', fontWeight: 700, marginTop: 18 }}>{estado.erro}</p>}
        {!estado.erro && !estado.carregando && !itens.length && <p style={{ color: '#2b8761', fontWeight: 700, marginTop: 18 }}>Nenhum ponto pendente de revisão neste mês.</p>}
        {itens.length > 0 && (
          <div style={{ overflowX: 'auto', marginTop: 18 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, color: '#405371' }}>
              <thead>
                <tr style={{ textAlign: 'left', color: '#7183a3' }}>
                  <th style={{ padding: 8 }}>Funcionário</th><th style={{ padding: 8 }}>Setor</th><th style={{ padding: 8 }}>Entrada</th><th style={{ padding: 8 }}>Saída</th><th style={{ padding: 8 }}>Problema</th>
                </tr>
              </thead>
              <tbody>
                {itens.map((item, i) => (
                  <tr key={`${item.funcionarioId}-${item.entrada || item.saida}-${i}`} style={{ borderTop: '1px solid #eef2f8' }}>
                    <td style={{ padding: 8, fontWeight: 700 }}>{item.nome}</td>
                    <td style={{ padding: 8 }}>{item.setor}</td>
                    <td style={{ padding: 8 }}>{formatar(item.entrada)}</td>
                    <td style={{ padding: 8 }}>{formatar(item.saida)}</td>
                    <td style={{ padding: 8, color: '#b9770e', fontWeight: 700 }}>{item.observacoes.map((o) => ROTULOS[o] || o).join(' · ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </section>
  );
}
