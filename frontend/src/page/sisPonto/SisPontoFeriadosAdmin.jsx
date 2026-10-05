import { useCallback, useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Card, Switch } from './SisPontoComponents.jsx';

// Feriados do ponto. Os nacionais são calculados pelo sistema; aqui o ENG
// decide os pontos facultativos (Carnaval, Corpus Christi) e cadastra os
// feriados municipais/estaduais ou folgas da empresa. Em feriado a jornada
// prevista é zero: não gera esquecimento e trabalho no dia vira crédito.
const TIPOS = { nacional: 'Nacional', facultativo: 'Ponto facultativo', municipal: 'Municipal', estadual: 'Estadual', empresa: 'Folga da empresa' };
const formatarDia = (dia) => new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' }).format(new Date(`${dia}T12:00:00`));
const formatarExtra = (data) => (data.length === 5 ? `${data.slice(3)}/${data.slice(0, 2)} (todo ano)` : `${data.slice(8)}/${data.slice(5, 7)}/${data.slice(0, 4)}`);

export default function SisPontoFeriadosAdmin() {
  const [ano, setAno] = useState(() => new Date().getFullYear());
  const [config, setConfig] = useState(null);
  const [feriados, setFeriados] = useState([]);
  const [novo, setNovo] = useState({ data: '', nome: '', tipo: 'municipal', todoAno: true });
  const [estado, setEstado] = useState({ salvando: false, erro: null, ok: null });

  const carregar = useCallback(() => api.getSispontoFeriados([ano])
    .then((dados) => { setConfig(dados.config); setFeriados(dados.feriados || []); })
    .catch((erro) => setEstado({ salvando: false, erro: erro.message, ok: null })), [ano]);
  useEffect(() => { carregar(); }, [carregar]);

  const salvar = async (proxima) => {
    setEstado({ salvando: true, erro: null, ok: null });
    try {
      await api.salvarSispontoFeriados(proxima);
      await carregar();
      setEstado({ salvando: false, erro: null, ok: 'Feriados salvos. Os esquecimentos pendentes nesses dias saem sozinhos.' });
    } catch (erro) {
      setEstado({ salvando: false, erro: erro.message, ok: null });
    }
  };

  const adicionar = () => {
    if (!novo.data || !novo.nome.trim()) { setEstado({ salvando: false, erro: 'Informe a data e o nome do feriado.', ok: null }); return; }
    const data = novo.todoAno ? novo.data.slice(5) : novo.data;
    salvar({ ...config, extras: [...config.extras, { data, nome: novo.nome.trim(), tipo: novo.tipo }] });
    setNovo({ data: '', nome: '', tipo: 'municipal', todoAno: true });
  };

  if (!config) return <section className="sis-empty-view"><Card style={{ padding: 26 }}>{estado.erro || 'Carregando feriados...'}</Card></section>;

  const campo = { height: 36, borderRadius: 8, border: '1px solid #d8e6fc', padding: '0 8px', fontSize: 13, fontWeight: 700, color: '#405371', background: '#fff' };
  return (
    <section className="sis-empty-view" style={{ display: 'grid', gap: 16 }}>
      <Card style={{ padding: 26 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20 }}>Feriados</h2>
            <p style={{ margin: '6px 0 0', color: '#7183a3', fontSize: 13, fontWeight: 600 }}>Em feriado não há jornada: ninguém fica com esquecimento, e quem trabalhar ganha crédito no banco de horas.</p>
          </div>
          <input type="number" value={ano} min={2000} max={2100} onChange={(e) => setAno(Number(e.target.value) || new Date().getFullYear())} style={{ ...campo, width: 100 }} />
        </div>
        <div style={{ display: 'grid', gap: 6, marginTop: 18 }}>
          {feriados.map((f) => (
            <div key={f.dia} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, background: '#f8fbff', border: '1px solid #e5edf8', fontSize: 13 }}>
              <strong style={{ width: 92, textTransform: 'capitalize', color: '#1d3156' }}>{formatarDia(f.dia)}</strong>
              <span style={{ flex: 1, color: '#405371', fontWeight: 700 }}>{f.nome}</span>
              <span style={{ color: '#7183a3', fontSize: 11, fontWeight: 800 }}>{TIPOS[f.tipo] || f.tipo}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card style={{ padding: 26 }}>
        <h2 style={{ margin: 0, fontSize: 16 }}>Pontos facultativos</h2>
        <p style={{ margin: '4px 0 14px', color: '#7183a3', fontSize: 12, fontWeight: 600 }}>Ligue só se a empresa folga nesses dias.</p>
        {[['carnaval', 'Carnaval (segunda e terça)'], ['corpusChristi', 'Corpus Christi']].map(([chave, rotulo]) => (
          <div key={chave} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0' }}>
            <Switch ligado={config[chave]} corLigado="#1767e8" onChange={() => salvar({ ...config, [chave]: !config[chave] })} />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#405371' }}>{rotulo}: {config[chave] ? 'folga' : 'trabalha'}</span>
          </div>
        ))}
      </Card>

      <Card style={{ padding: 26 }}>
        <h2 style={{ margin: 0, fontSize: 16 }}>Feriados municipais, estaduais e folgas da empresa</h2>
        <div style={{ display: 'grid', gap: 6, margin: '14px 0' }}>
          {config.extras.length ? config.extras.map((extra, i) => (
            <div key={`${extra.data}-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
              <strong style={{ width: 150, color: '#1d3156' }}>{formatarExtra(extra.data)}</strong>
              <span style={{ flex: 1, color: '#405371', fontWeight: 700 }}>{extra.nome}</span>
              <span style={{ color: '#7183a3', fontSize: 11, fontWeight: 800 }}>{TIPOS[extra.tipo] || extra.tipo}</span>
              <button type="button" disabled={estado.salvando} onClick={() => salvar({ ...config, extras: config.extras.filter((_, j) => j !== i) })} style={{ border: 0, borderRadius: 7, padding: '6px 10px', background: '#ffecef', color: '#be3747', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>Remover</button>
            </div>
          )) : <span style={{ color: '#7183a3', fontSize: 13 }}>Nenhum cadastrado.</span>}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <input type="date" value={novo.data} onChange={(e) => setNovo({ ...novo, data: e.target.value })} style={campo} />
          <input type="text" value={novo.nome} placeholder="Nome (ex.: Padroeiro)" onChange={(e) => setNovo({ ...novo, nome: e.target.value })} style={{ ...campo, minWidth: 200 }} />
          <select value={novo.tipo} onChange={(e) => setNovo({ ...novo, tipo: e.target.value })} style={campo}>
            <option value="municipal">Municipal</option><option value="estadual">Estadual</option><option value="empresa">Folga da empresa</option>
          </select>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#405371' }}>
            <input type="checkbox" checked={novo.todoAno} onChange={(e) => setNovo({ ...novo, todoAno: e.target.checked })} /> Repete todo ano
          </label>
          <button type="button" disabled={estado.salvando} onClick={adicionar} style={{ border: 0, borderRadius: 8, padding: '0 14px', height: 36, background: '#1767e8', color: '#fff', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>Adicionar</button>
        </div>
        {estado.erro && <p style={{ margin: '12px 0 0', color: '#be3747', fontWeight: 700 }}>{estado.erro}</p>}
        {estado.ok && <p style={{ margin: '12px 0 0', color: '#2b8761', fontWeight: 700 }}>{estado.ok}</p>}
      </Card>
    </section>
  );
}
