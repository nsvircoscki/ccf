import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, ChartNoAxesColumn, CircleAlert, Clock3, Files, FileText, LogIn, TimerReset, Trash2, User, X } from 'lucide-react';
import { api } from '../../services/api';
import { meses, diasSemana, HORARIOS_PADRAO, JUSTIFICATIVA_CORES } from './sisPontoData.js';
import { chaveData, hora, horariosDoDia, buildEngFuncionariosFromStorage, extrairRegistrosFuncionario, calcularHistoricoSemanal, encontrarJustificativaAceita, statusJustificativaSlotsFaltantes, statusCalendarioDoDia } from './sisPontoUtils.js';
import { BancoHoras, Card, ConfirmacaoPonto, FormularioModal } from './SisPontoComponents.jsx';
import './sisPonto.css';

export default function SisPontoEngAdminScreen({ usuarioLogado = 'ENG', destino }) {
  const [activePage, setActivePage] = useState('dashboard');
  // Redireciona pra aba certa quando a navbar manda o admin pra cá a partir
  // de uma notificação (ex.: justificativa nova). O "ts" no destino garante
  // que o efeito roda de novo mesmo se a página pedida for repetida.
  useEffect(() => {
    if (destino?.pagina) setActivePage(destino.pagina);
  }, [destino?.pagina, destino?.ts]);
  const [date, setDate] = useState(chaveData(new Date()));
  const [mes, setMes] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [mesesAberto, setMesesAberto] = useState(false);
  const [configuracao, setConfiguracao] = useState(() => {
    try { return { ...HORARIOS_PADRAO, ...JSON.parse(localStorage.getItem('ccf-sis-ponto-horarios-ENG') || '{}') }; } catch { return HORARIOS_PADRAO; }
  });
  const [cadastroFuncionarios, setCadastroFuncionarios] = useState(() => {
    try {
      return Array.from(new Set(Object.keys(localStorage).filter((key) => key.startsWith('ccf-sis-ponto-funcionarios-')).flatMap((key) => {
        const setor = key.replace('ccf-sis-ponto-funcionarios-', '');
        const lista = JSON.parse(localStorage.getItem(key) || '[]');
        return Array.isArray(lista) ? lista.map((funcionario) => ({ ...funcionario, setor })) : [];
      }).map((funcionario) => JSON.stringify(funcionario)))).map((funcionario) => JSON.parse(funcionario));
    } catch { return []; }
  });
  const [calendarioFuncionarioId, setCalendarioFuncionarioId] = useState('');
  const [justificativas, setJustificativas] = useState([]);
  const [carregandoJustificativas, setCarregandoJustificativas] = useState(true);
  const [registrosBackend, setRegistrosBackend] = useState({});
  const [confirmacaoModal, setConfirmacaoModal] = useState(null);
  const [novoFuncionarioModal, setNovoFuncionarioModal] = useState(false);

  const carregarJustificativas = () => {
    setCarregandoJustificativas(true);
    return api.getSispontoJustificativas()
      .then((lista) => setJustificativas(Array.isArray(lista) ? lista : []))
      .catch(() => setJustificativas([]))
      .finally(() => setCarregandoJustificativas(false));
  };

  const carregarRegistros = () => api.getSispontoRegistros()
    .then((registros) => setRegistrosBackend(registros && typeof registros === 'object' ? registros : {}))
    .catch(() => {});

  const calendarioRegistros = useMemo(() => {
    const selecionado = cadastroFuncionarios.find((funcionario) => funcionario.id === calendarioFuncionarioId) || cadastroFuncionarios[0];
    if (!selecionado) return {};
    return extrairRegistrosFuncionario(registrosBackend, selecionado.id);
  }, [cadastroFuncionarios, calendarioFuncionarioId, registrosBackend]);

  const horarioEsperadoEng = (indice, registrosDoDia = []) => {
    const dataRegistro = registrosDoDia[indice] ? new Date(registrosDoDia[indice]) : new Date(`${date}T12:00:00`);
    return horariosDoDia(dataRegistro, configuracao)[indice % 4];
  };

  const statusRegistroEng = (registro, indice, registrosDoDia = [], chaveDia = date) => {
    const [horaEsperada, minutoEsperado] = horarioEsperadoEng(indice, registrosDoDia)[1].split(':').map(Number);
    const instante = new Date(registro);
    const diferenca = (instante.getHours() * 60 + instante.getMinutes()) - (horaEsperada * 60 + minutoEsperado);
    const tipo = horarioEsperadoEng(indice, registrosDoDia)[0];
    const foraDoHorario = (tipo === 'Entrada' && diferenca >= 5) || (tipo === 'Saída' && diferenca <= -5);
    if (!foraDoHorario) return 'Normal';
    if (encontrarJustificativaAceita(justificativas, calendarioFuncionarioId, chaveDia, hora(instante))) return 'Justificado';
    return 'Atrasado/Saída Antecipada';
  };

  useEffect(() => { carregarJustificativas(); }, [activePage]);
  useEffect(() => { carregarRegistros(); }, [activePage]);
  useEffect(() => {
    let cancelado = false;
    api.getSispontoFuncionarios().then((lista) => {
      if (!cancelado && Array.isArray(lista) && lista.length) {
        setCadastroFuncionarios(lista);
      }
    }).catch(() => {
      // fallback localStorage continua servindo como origem persistida.
    });
    return () => { cancelado = true; };
  }, []);
  useEffect(() => {
    if (!cadastroFuncionarios.length) return;
    if (!cadastroFuncionarios.some((funcionario) => funcionario.id === calendarioFuncionarioId)) {
      setCalendarioFuncionarioId(cadastroFuncionarios[0].id);
    }
  }, [cadastroFuncionarios, calendarioFuncionarioId]);
  useEffect(() => localStorage.setItem('ccf-sis-ponto-horarios-ENG', JSON.stringify(configuracao)), [configuracao]);
  const funcionarios = useMemo(() => buildEngFuncionariosFromStorage(date, configuracao, cadastroFuncionarios, justificativas, registrosBackend), [date, configuracao, cadastroFuncionarios, justificativas, registrosBackend]);
  const setores = Array.from(new Set(funcionarios.map((f) => f.setor))).sort();
  const [funcionarioFiltro, setFuncionarioFiltro] = useState('Todos os funcionários');
  const [setorFiltro, setSetorFiltro] = useState('Todos os setores');
  const [statusFiltro, setStatusFiltro] = useState('Todos os status');
  const [activeTab, setActiveTab] = useState('resumo');
  const [funcionarioSelecionado, setFuncionarioSelecionado] = useState(funcionarios[0] || { nome: 'Sem registros', setor: '—', entrada: '—', intervalo: '—', retorno: '—', saida: '—', total: '00h00', status: 'Ausente', justificativa: 0, jornadaPrevista: '08:50', jornadaRealizada: '00h00', jornadaTipo: 'Jornada prevista', banco: '+00h00' });

  useEffect(() => {
    setFuncionarioSelecionado((atual) => funcionarios.find((f) => f.nome === atual.nome && f.setor === atual.setor) || funcionarios[0] || atual);
  }, [funcionarios]);

  const historicoSemanal = useMemo(() => {
    if (!funcionarioSelecionado?.id) return [];
    const blob = extrairRegistrosFuncionario(registrosBackend, funcionarioSelecionado.id);
    return calcularHistoricoSemanal(blob, new Date(`${date}T12:00:00`));
  }, [funcionarioSelecionado, date, registrosBackend]);

  const exportarRelatorio = () => {
    const headers = ['Funcionário', 'Setor', 'Entrada', 'Intervalo', 'Retorno', 'Saída', 'Total', 'Status'];
    const linhas = filtered.map((f) => [f.nome, f.setor, f.entrada, f.intervalo, f.retorno, f.saida, f.total, f.status]);
    const csv = [headers, ...linhas].map((linha) => linha.map((campo) => `"${String(campo ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sis-ponto-${date}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const filtered = useMemo(() => {
    return funcionarios.filter((f) => {
      const okFuncionario = funcionarioFiltro === 'Todos os funcionários' || f.nome === funcionarioFiltro;
      const okSetor = setorFiltro === 'Todos os setores' || f.setor === setorFiltro;
      const okStatus = statusFiltro === 'Todos os status'
        || (statusFiltro === 'Atrasado' && f.atrasado)
        || (statusFiltro === 'Saída Antecipada' && f.saidaAntecipada)
        || (statusFiltro === 'Atrasado/Saída Antecipada' && f.status === statusFiltro)
        || (!['Atrasado', 'Saída Antecipada', 'Atrasado/Saída Antecipada'].includes(statusFiltro) && f.status === statusFiltro);
      return okFuncionario && okSetor && okStatus;
    });
  }, [funcionarios, funcionarioFiltro, setorFiltro, statusFiltro]);

  const presentes = funcionarios.filter((f) => f.status === 'Presente' || f.status === 'Atrasado/Saída Antecipada' || f.status === 'Finalizado' || f.status === 'Justificado').length;
  const atrasados = funcionarios.filter((f) => f.status === 'Atrasado/Saída Antecipada').length;
  const ausentes = funcionarios.filter((f) => f.status === 'Ausente').length;
  // Fallback comum quando o backend está fora do ar: as três ações abaixo
  // (criar/renomear/excluir) continuam funcionando localmente e sincronizam
  // com o servidor na próxima vez que a tela carregar.
  const atualizarCadastroLocalStorage = (setor, transformar) => {
    const chave = `ccf-sis-ponto-funcionarios-${setor}`;
    const lista = JSON.parse(localStorage.getItem(chave) || '[]');
    localStorage.setItem(chave, JSON.stringify(transformar(lista)));
  };

  const adicionarFuncionarioEng = () => setNovoFuncionarioModal(true);
  const criarFuncionarioEng = ({ nome, setor }) => {
    setNovoFuncionarioModal(false);
    if (!nome?.trim() || !setor?.trim()) return;
    const funcionario = { id: `${setor.trim().toUpperCase()}-${Date.now()}`, nome: nome.trim(), setor: setor.trim().toUpperCase() };
    api.createSispontoFuncionario(funcionario).then((novo) => {
      setCadastroFuncionarios((atuais) => [...atuais, novo]);
    }).catch(() => {
      setCadastroFuncionarios((atuais) => [...atuais, funcionario]);
      atualizarCadastroLocalStorage(funcionario.setor, (lista) => [...lista, funcionario]);
    });
  };

  const renomearFuncionarioEng = (funcionario) => {
    const novoNome = window.prompt('Novo nome do funcionário', funcionario.nome);
    if (!novoNome?.trim()) return;
    const proximoNome = novoNome.trim();
    api.updateSispontoFuncionario(funcionario.id, { nome: proximoNome }).then((atualizado) => {
      setCadastroFuncionarios((atuais) => atuais.map((item) => item.id === funcionario.id ? { ...item, nome: atualizado.nome } : item));
    }).catch(() => {
      setCadastroFuncionarios((atuais) => atuais.map((item) => item.id === funcionario.id ? { ...item, nome: proximoNome } : item));
      atualizarCadastroLocalStorage(funcionario.setor, (lista) => lista.map((item) => item.id === funcionario.id ? { ...item, nome: proximoNome } : item));
    });
  };

  const excluirFuncionarioEng = (funcionario) => setConfirmacaoModal({
    titulo: 'Excluir funcionário',
    mensagem: `Deseja excluir o funcionário ${funcionario.nome} do cadastro? Os registros de ponto e justificativas dele também serão apagados.`,
    destrutivo: true,
    confirmar: () => {
      setConfirmacaoModal(null);
      api.deleteSispontoFuncionario(funcionario.id).then(() => {
        setCadastroFuncionarios((atuais) => atuais.filter((item) => item.id !== funcionario.id));
        carregarRegistros();
      }).catch(() => {
        setCadastroFuncionarios((atuais) => atuais.filter((item) => item.id !== funcionario.id));
        atualizarCadastroLocalStorage(funcionario.setor, (lista) => lista.filter((item) => item.id !== funcionario.id));
      });
    },
  });

  return (
    <main className="sis-ponto-admin-screen">
      <div className="sis-admin-layout">
        <aside className="sis-admin-sidebar">
          <nav className="sis-admin-nav">
            <button className={`sis-admin-nav-item ${activePage === 'dashboard' ? 'active' : ''}`} onClick={() => setActivePage('dashboard')}><CalendarDays size={16} /> Dashboard</button>
            <button className={`sis-admin-nav-item ${activePage === 'funcionarios' ? 'active' : ''}`} onClick={() => setActivePage('funcionarios')}><User size={16} /> Funcionários</button>
            <button className={`sis-admin-nav-item ${activePage === 'registros' ? 'active' : ''}`} onClick={() => setActivePage('registros')}><ChartNoAxesColumn size={16} /> Registros</button>
            <button className={`sis-admin-nav-item ${activePage === 'calendario' ? 'active' : ''}`} onClick={() => setActivePage('calendario')}><CalendarDays size={16} /> Calendário</button>
            <button className={`sis-admin-nav-item ${activePage === 'banco' ? 'active' : ''}`} onClick={() => setActivePage('banco')}><Clock3 size={16} /> Banco de horas</button>
            <button className={`sis-admin-nav-item ${activePage === 'justificativas' ? 'active' : ''}`} onClick={() => setActivePage('justificativas')}><Files size={16} /> Justificativas</button>
            <button className={`sis-admin-nav-item ${activePage === 'relatorios' ? 'active' : ''}`} onClick={() => setActivePage('relatorios')}><ChartNoAxesColumn size={16} /> Relatórios</button>
            <button className={`sis-admin-nav-item ${activePage === 'configuracoes' ? 'active' : ''}`} onClick={() => setActivePage('configuracoes')}><X size={16} /> Configurações</button>
          </nav>
        </aside>

        <section className="sis-admin-content">
          <header>
            <h1 className="sis-title">SIS Ponto</h1>
            <p className="sis-subtitle">Acompanhe a jornada da sua equipe</p>
          </header>

          {activePage === 'dashboard' && <>
          <section className="sis-metrics">
            <div className="sis-metric-card total">
              <span className="icon"><User size={22} /></span>
              <div>
                <div className="number">{funcionarios.length}</div>
                <div className="label">Total de colaboradores</div>
              </div>
            </div>
            <div className="sis-metric-card present">
              <span className="icon"><CalendarDays size={22} /></span>
              <div>
                <div className="number">{presentes}</div>
                <div className="label">Presentes</div>
              </div>
            </div>
            <div className="sis-metric-card late">
              <span className="icon"><Clock3 size={22} /></span>
              <div>
                <div className="number">{atrasados}</div>
                <div className="label">Atrasado/Saída Antecipada</div>
              </div>
            </div>
            <div className="sis-metric-card absent">
              <span className="icon"><X size={22} /></span>
              <div>
                <div className="number">{ausentes}</div>
                <div className="label">Ausentes</div>
              </div>
            </div>
          </section>

          <section className="sis-filterbar">
            <div className="sis-filter-group">
              <CalendarDays size={16} color="#3177dd" />
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="sis-filter-group">
              <User size={16} color="#3177dd" />
              <select value={funcionarioFiltro} onChange={(e) => { setFuncionarioFiltro(e.target.value); const f = funcionarios.find((x) => x.nome === e.target.value); if (f) setFuncionarioSelecionado(f); }}>
                <option>Todos os funcionários</option>
                {funcionarios.map((f) => <option key={f.nome}>{f.nome}</option>)}
              </select>
            </div>
            <div className="sis-filter-group">
              <ChartNoAxesColumn size={16} color="#3177dd" />
              <select value={setorFiltro} onChange={(e) => setSetorFiltro(e.target.value)}>
                <option>Todos os setores</option>
                {setores.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="sis-filter-group">
              <Clock3 size={16} color="#3177dd" />
              <select value={statusFiltro} onChange={(e) => setStatusFiltro(e.target.value)}>
                <option>Todos os status</option>
                <option>Presente</option>
                <option>Atrasado</option>
                <option>Saída Antecipada</option>
                <option>Atrasado/Saída Antecipada</option>
                <option>Justificado</option>
                <option>Ausente</option>
                <option>Finalizado</option>
              </select>
            </div>
            <button className="sis-export-button" onClick={exportarRelatorio} type="button">Exportar relatório</button>
          </section>

          <section className="sis-grid">
            <section className="sis-table-card">
              <div className="sis-table-head">
                <span className="left">Funcionários</span>
                <span className="right">{filtered.length} funcionários</span>
              </div>
              <table className="sis-table">
                <thead>
                  <tr>
                    <th>Funcionário</th>
                    <th>Entrada</th>
                    <th>Intervalo</th>
                    <th>Retorno</th>
                    <th>Saída</th>
                    <th>Total de horas</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((f, idx) => (
                    <tr key={idx}>
                      <td>
                        <div className="sis-employee">
                          <span className="sis-avatar">{f.nome.split(' ').map((n) => n[0]).slice(0,2).join('').toUpperCase()}</span>
                          <span className="sis-person">
                            <b>{f.nome}</b>
                            <small>{f.setor}</small>
                          </span>
                        </div>
                      </td>
                      <td style={f.preenchidoPorJustificativa?.[0] ? { color: '#3177dd', fontWeight: 800 } : undefined} title={f.preenchidoPorJustificativa?.[0] ? 'Preenchido pela justificativa aprovada' : undefined}>{f.entrada}</td>
                      <td style={f.preenchidoPorJustificativa?.[1] ? { color: '#3177dd', fontWeight: 800 } : undefined} title={f.preenchidoPorJustificativa?.[1] ? 'Preenchido pela justificativa aprovada' : undefined}>{f.intervalo}</td>
                      <td style={f.preenchidoPorJustificativa?.[2] ? { color: '#3177dd', fontWeight: 800 } : undefined} title={f.preenchidoPorJustificativa?.[2] ? 'Preenchido pela justificativa aprovada' : undefined}>{f.retorno}</td>
                      <td style={f.preenchidoPorJustificativa?.[3] ? { color: '#3177dd', fontWeight: 800 } : undefined} title={f.preenchidoPorJustificativa?.[3] ? 'Preenchido pela justificativa aprovada' : undefined}>{f.saida}</td>
                      <td>{f.total}</td>
                      <td><span className={`sis-status ${f.status === 'Atrasado/Saída Antecipada' ? 'late' : f.status}`} style={f.justificadoPendente ? { background: '#f2c14e' } : undefined}>{f.justificadoPendente ? 'Justificado' : f.status}</span></td>
                      <td><button className="sis-arrow" onClick={() => { setFuncionarioSelecionado(f); setActiveTab('resumo'); }}>›</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            <aside className="sis-detail-panel">
              <div className="sis-person-detail">
                <div className="sis-detail-head">
                  <span className="sis-detail-avatar">{funcionarioSelecionado.nome.split(' ').map((n) => n[0]).slice(0,2).join('').toUpperCase()}</span>
                  <div>
                    <div className="sis-detail-person-name">{funcionarioSelecionado.nome}</div>
                    <div className="sis-detail-person-setor">{funcionarioSelecionado.setor}</div>
                  </div>
                </div>
                <div className="sis-detail-tabs">
                  <button className={activeTab === 'resumo' ? 'active' : ''} onClick={() => setActiveTab('resumo')}>Resumo</button>
                  <button className={activeTab === 'historico' ? 'active' : ''} onClick={() => setActiveTab('historico')}>Histórico</button>
                  <button className={activeTab === 'justificativas' ? 'active' : ''} onClick={() => setActiveTab('justificativas')}>Justificativas</button>
                </div>

                {activeTab === 'resumo' && (
                  <>
                    <div className="sis-detail-date">Hoje — {date}</div>
                    <div className="sis-detail-list">
                      <div className="sis-detail-row"><span className="label">Entrada</span><span className="value" style={funcionarioSelecionado.preenchidoPorJustificativa?.[0] ? { color: '#3177dd' } : undefined} title={funcionarioSelecionado.preenchidoPorJustificativa?.[0] ? 'Preenchido pela justificativa aprovada' : undefined}>{funcionarioSelecionado.entrada}</span></div>
                      <div className="sis-detail-row"><span className="label">Intervalo</span><span className="value" style={funcionarioSelecionado.preenchidoPorJustificativa?.[1] ? { color: '#3177dd' } : undefined} title={funcionarioSelecionado.preenchidoPorJustificativa?.[1] ? 'Preenchido pela justificativa aprovada' : undefined}>{funcionarioSelecionado.intervalo}</span></div>
                      <div className="sis-detail-row"><span className="label">Retorno</span><span className="value" style={funcionarioSelecionado.preenchidoPorJustificativa?.[2] ? { color: '#3177dd' } : undefined} title={funcionarioSelecionado.preenchidoPorJustificativa?.[2] ? 'Preenchido pela justificativa aprovada' : undefined}>{funcionarioSelecionado.retorno}</span></div>
                      <div className="sis-detail-row"><span className="label">Saída</span><span className="value" style={funcionarioSelecionado.preenchidoPorJustificativa?.[3] ? { color: '#3177dd' } : undefined} title={funcionarioSelecionado.preenchidoPorJustificativa?.[3] ? 'Preenchido pela justificativa aprovada' : undefined}>{funcionarioSelecionado.saida}</span></div>
                      <div className="sis-detail-row"><span className="label">Jornada prevista</span><span className="value">{funcionarioSelecionado.jornadaPrevista}</span></div>
                      <div className="sis-detail-row"><span className="label">Jornada realizada</span><span className="value">{funcionarioSelecionado.jornadaRealizada}</span></div>
                      <div className="sis-detail-row"><span className="label">Saldo banco</span><span className="value">{funcionarioSelecionado.banco}</span></div>
                    </div>
                    <div className="sis-detail-status" style={funcionarioSelecionado.justificadoPendente ? { background: '#f2c14e' } : undefined}>{funcionarioSelecionado.justificadoPendente ? 'Justificado' : funcionarioSelecionado.status}</div>
                  </>
                )}

                {activeTab === 'historico' && (
                  <>
                    <div className="sis-detail-date">Histórico do mês</div>
                    <div className="sis-detail-list">
                      {historicoSemanal.length ? historicoSemanal.map((semana) => (
                        <div className="sis-detail-row" key={semana.label}><span className="label">{semana.label}</span><span className="value">{semana.texto}</span></div>
                      )) : <div className="sis-detail-row"><span className="label">Sem registros no período</span><span className="value">00h00</span></div>}
                    </div>
                  </>
                )}

                {activeTab === 'justificativas' && (
                  <>
                    <div className="sis-detail-date">Justificativas</div>
                    <div className="sis-detail-list">
                      <div className="sis-detail-row"><span className="label">Atestado</span><span className="value">01 dia</span></div>
                      <div className="sis-detail-row"><span className="label">Atraso</span><span className="value">02 ocorr.</span></div>
                      <div className="sis-detail-row"><span className="label">Ausência</span><span className="value">Sem</span></div>
                    </div>
                  </>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12 }}>
                  <button className="sis-arrow" onClick={() => {
                    const idx = funcionarios.findIndex((f) => f.nome === funcionarioSelecionado.nome);
                    const next = funcionarios[(idx + 1) % funcionarios.length];
                    setFuncionarioSelecionado(next);
                    setFuncionarioFiltro(next.nome);
                  }}>›</button>
                  <span style={{ color: '#718398', fontSize: 11, fontWeight: 800 }}>Detalhe do funcionário</span>
                </div>
              </div>
            </aside>
          </section>
          </>}

          {activePage === 'banco' && (
            <section className="sis-banco-view">
              {BancoHoras(funcionarios)}
            </section>
          )}

          {activePage === 'justificativas' && (
            <section className="sis-justificativas-view">
              <SisPontoJustificativasAdmin justificativas={justificativas} carregando={carregandoJustificativas} onAtualizado={carregarJustificativas} />
            </section>
          )}

          {activePage === 'relatorios' && (
            <section className="sis-empty-view">
              <Card style={{ padding: 26, minHeight: 280 }}><h2 style={{ margin: 0, fontSize: 20 }}>Relatórios</h2><p style={{ margin: '6px 0 24px', color: '#7183a3', fontSize: 13, fontWeight: 600 }}>Relatórios e exportações do SIS Ponto aparecerão aqui.</p><button onClick={exportarRelatorio} type="button" style={{ border: 0, borderRadius: 9, padding: '11px 15px', background: '#1767e8', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>Exportar relatório</button></Card>
            </section>
          )}

          {activePage === 'configuracoes' && (
            <section className="sis-empty-view">
              <Card style={{ padding: 26, minHeight: 280 }}>
                <h2 style={{ margin: 0, fontSize: 20 }}>Configurações de jornada</h2>
                <p style={{ margin: '6px 0 24px', color: '#7183a3', fontSize: 13, fontWeight: 600 }}>Horários-base usados para classificar atrasos, saídas antecipadas e ausências.</p>
                <div style={{ display: 'grid', gap: 12 }}>
                  {['segunda', 'terca', 'quarta', 'quinta', 'sexta'].map((dia) => (
                    <div key={dia} style={{ display: 'grid', gridTemplateColumns: '110px repeat(4, minmax(100px, 1fr))', gap: 8, alignItems: 'center' }}>
                      <strong style={{ color: '#405371', textTransform: 'capitalize', fontSize: 12 }}>{dia}</strong>
                      {[
                        ['entradaManha', 'Entrada manhã'],
                        ['saidaManha', 'Saída manhã'],
                        ['entradaTarde', 'Entrada tarde'],
                        ['saidaTarde', 'Saída tarde'],
                      ].map(([campo, rotulo]) => (
                        <label key={campo} style={{ display: 'grid', gap: 4, color: '#718398', fontSize: 10, fontWeight: 800 }}>
                          {rotulo}
                          <input aria-label={`${dia} - ${rotulo}`} type="time" value={configuracao[dia][campo]} onChange={(event) => setConfiguracao((atual) => ({ ...atual, [dia]: { ...atual[dia], [campo]: event.target.value } }))} />
                        </label>
                      ))}
                    </div>
                  ))}
                </div>
              </Card>
            </section>
          )}

          {activePage === 'funcionarios' && (
            <section className="sis-empty-view">
              <Card style={{ padding: 26, minHeight: 280 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}><div><h2 style={{ margin: 0, fontSize: 20 }}>Funcionários</h2><p style={{ margin: '6px 0 0', color: '#7183a3', fontSize: 13, fontWeight: 600 }}>Cadastros nominais usados no painel do administrador.</p></div><button type="button" onClick={adicionarFuncionarioEng} style={{ border: 0, borderRadius: 9, padding: '10px 14px', background: '#1767e8', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>+ Novo funcionário</button></div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12, marginTop: 22 }}>{cadastroFuncionarios.map((funcionario) => {
                  const dados = funcionarios.find((item) => item.nome === funcionario.nome && item.setor === funcionario.setor) || { nome: funcionario.nome, setor: funcionario.setor, total: '00h00', status: 'Ausente' };
                  return <div key={funcionario.id} style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '14px', border: '1px solid #e5edf8', borderRadius: 12, color: '#405371', fontSize: 13, fontWeight: 800, background: '#f8fbff' }}>
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                      <span style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <span>{funcionario.nome}</span>
                        <small style={{ color: '#7183a3' }}>{funcionario.setor}</small>
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <button type="button" onClick={() => renomearFuncionarioEng(funcionario)} style={{ border: 0, borderRadius: 8, padding: '8px 10px', background: '#eef4ff', color: '#1767e8', fontWeight: 800, cursor: 'pointer' }}>Renomear</button>
                        <button type="button" onClick={() => excluirFuncionarioEng(funcionario)} style={{ border: 0, borderRadius: 8, padding: '8px 10px', background: '#ffecef', color: '#be3747', fontWeight: 800, cursor: 'pointer' }}>Excluir</button>
                      </span>
                    </span>
                    <span style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <span style={{ padding: '9px', borderRadius: 8, background: '#eef4ff', color: '#244c91', fontSize: 11 }}>Horas: <b>{dados.total}</b></span>
                      <span style={{ padding: '9px', borderRadius: 8, background: '#eefaf6', color: '#2b8761', fontSize: 11 }}>Status: <b>{dados.status}</b></span>
                    </span>
                  </div>;
                })}</div>
              </Card>
            </section>
          )}

          {activePage === 'registros' && (
            <section className="sis-empty-view">
              <Card style={{ padding: 26, minHeight: 280 }}><h2 style={{ margin: 0, fontSize: 20 }}>Registros</h2><p style={{ margin: '6px 0 24px', color: '#7183a3', fontSize: 13, fontWeight: 600 }}>Acompanhe os registros legíveis do dia e do perfil.</p><button onClick={exportarRelatorio} type="button" style={{ border: 0, borderRadius: 9, padding: '11px 15px', background: '#1767e8', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>Exportar relatório</button></Card>
            </section>
          )}

          {activePage === 'calendario' && (
            <section className="sis-empty-view">
              <Card style={{ padding: 0, minHeight: 280, overflow: 'hidden', background: '#fff' }}>
                <div className="sis-eng-calendar-frame">
                  <div className="sis-eng-calendar-top">
                    <div className="sis-eng-calendar-left">
                      <select value={calendarioFuncionarioId} onChange={(event) => setCalendarioFuncionarioId(event.target.value)} className="sis-eng-calendar-setor" aria-label="Funcionário do calendário">
                        {cadastroFuncionarios.map((funcionario) => <option key={funcionario.id} value={funcionario.id}>{funcionario.nome} - {funcionario.setor}</option>)}
                      </select>
                    </div>

                    <div className="sis-eng-calendar-title-wrap">
                      <motion.button type="button" whileHover={{ scale: 1.03, y: -1 }} whileTap={{ scale: .98 }} onClick={() => setMes((atual) => new Date(atual.getFullYear(), atual.getMonth() - 1, 1))} className="sis-eng-calendar-arrow" aria-label="Mês anterior"><ChevronLeft size={16} /></motion.button>
                      <div style={{ position: 'relative' }}>
                        <motion.button type="button" whileTap={{ scale: .97 }} onClick={() => setMesesAberto((aberto) => !aberto)} className="sis-eng-calendar-title" style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer' }}>
                          {meses[mes.getMonth()]} {mes.getFullYear()}
                          <motion.span animate={{ rotate: mesesAberto ? 180 : 0 }}><ChevronDown size={17} /></motion.span>
                        </motion.button>
                        <AnimatePresence>
                          {mesesAberto && <motion.div initial={{ opacity: 0, y: -8, scale: .97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: .97 }} transition={{ duration: .18 }} style={{ position: 'absolute', top: 'calc(100% + 10px)', left: '50%', transform: 'translateX(-50%)', zIndex: 20, width: 210, maxHeight: 290, overflowY: 'auto', padding: 6, background: '#fff', border: '1px solid #dbe6f5', borderRadius: 12, boxShadow: '0 14px 30px rgba(15,35,70,.18)' }}>
                            {meses.map((nome, indice) => <motion.button key={nome} type="button" whileHover={{ x: 3 }} onClick={() => { setMes(new Date(mes.getFullYear(), indice, 1)); setMesesAberto(false); }} style={{ width: '100%', display: 'flex', padding: '10px 12px', border: 0, borderRadius: 8, background: indice === mes.getMonth() ? '#eaf2ff' : 'transparent', color: indice === mes.getMonth() ? '#1767e8' : '#41536f', cursor: 'pointer', fontSize: 13, fontWeight: 700, textAlign: 'left' }}>{nome} {mes.getFullYear()}</motion.button>)}
                          </motion.div>}
                        </AnimatePresence>
                      </div>
                      <motion.button type="button" whileHover={{ scale: 1.03, y: -1 }} whileTap={{ scale: .98 }} onClick={() => setMes((atual) => new Date(atual.getFullYear(), atual.getMonth() + 1, 1))} className="sis-eng-calendar-arrow" aria-label="Próximo mês"><ChevronRight size={16} /></motion.button>
                    </div>

                    <div className="sis-eng-calendar-right">
                      <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="sis-eng-calendar-date" />
                      <button type="button" className="sis-eng-calendar-icon"><CalendarDays size={16} /></button>
                    </div>
                  </div>

                  <div className="sis-eng-calendar-body">
                    <section className="sis-eng-calendar-grid-wrap">
                      <div className="sis-eng-calendar-weekdays">
                        {diasSemana.map((dia) => <span key={dia} className="sis-eng-calendar-weekday">{dia}</span>)}
                      </div>
                      <div className="sis-eng-calendar-grid">
                        {(() => {
                          const inicio = new Date(mes.getFullYear(), mes.getMonth(), 1);
                          const primeiraCelula = new Date(mes.getFullYear(), mes.getMonth(), 1 - inicio.getDay());
                          const ultimoDia = new Date(mes.getFullYear(), mes.getMonth() + 1, 0);
                          const totalCelulas = Math.ceil((inicio.getDay() + ultimoDia.getDate()) / 7) * 7;
                          return Array.from({ length: totalCelulas }, (_, index) => {
                            const dia = new Date(primeiraCelula.getFullYear(), primeiraCelula.getMonth(), primeiraCelula.getDate() + index);
                            const chave = chaveData(dia);
                            const itens = Array.isArray(calendarioRegistros[chave]) ? calendarioRegistros[chave].map((registro) => new Date(registro)).sort((a, b) => a - b) : [];
                            const statusItens = itens.map((registro, registroIndex) => statusRegistroEng(registro, registroIndex, itens, chave));
                            const horariosDia = horariosDoDia(dia);
                            const { temAtraso, temJustificado, temJustificadoPendente, horariosPreenchidos } = statusCalendarioDoDia(itens, statusItens, horariosDia, justificativas, calendarioFuncionarioId, chave);
                            const pertenceAoMes = dia.getMonth() === mes.getMonth();
                            const ehHoje = chave === chaveData(new Date());
                            return <motion.div key={chave} initial={{ opacity: 0, scale: .98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: .2 }} whileHover={{ backgroundColor: '#f8fbff' }} className={`sis-eng-calendar-number ${pertenceAoMes ? '' : 'outside'} ${ehHoje ? 'today' : ''}`}>
                              <div className="sis-eng-calendar-day-head"><span className="sis-eng-calendar-day-circle">{dia.getDate()}</span>{itens.length > 0 && <i className={`sis-eng-calendar-dot ${temAtraso ? 'late' : temJustificado ? 'justified' : ''}`} style={temJustificadoPendente && !temAtraso ? { background: '#f2c14e' } : undefined} />}{itens.length === 0 && temJustificado && <i className="sis-eng-calendar-dot justified" style={temJustificadoPendente ? { background: '#f2c14e' } : undefined} title="Justificado" />}</div>
                              {(itens.length > 0 || horariosPreenchidos.some(Boolean)) && <div className="sis-eng-calendar-entries">
                                {itens.slice(0, 4).map((registro, registroIndex) => <span key={registro.toISOString()} className={`sis-eng-calendar-entry ${statusItens[registroIndex] === 'Atrasado/Saída Antecipada' ? 'late' : statusItens[registroIndex] === 'Justificado' ? 'justified' : ''}`}><LogIn size={11} style={registroIndex % 2 ? { transform: 'rotate(180deg)' } : undefined} />{hora(registro).slice(0, 5)}</span>)}
                                {horariosPreenchidos.map((horarioJustificado, indexHorario) => { if (!horarioJustificado || indexHorario < itens.length) return null; const entradaTipo = horariosDia[indexHorario][0] === 'Entrada'; return <span key={`justificado-${chave}-${indexHorario}`} className="sis-eng-calendar-entry justified" style={{ fontStyle: 'italic' }} title="Preenchido pela justificativa aprovada"><LogIn size={11} style={entradaTipo ? undefined : { transform: 'rotate(180deg)' }} />{horarioJustificado}</span>; })}
                              </div>}
                              {temAtraso && <div className="sis-eng-calendar-status">Atrasado/Saída Antecipada</div>}
                              {!temAtraso && temJustificado && <div className="sis-eng-calendar-status" style={{ color: temJustificadoPendente ? '#b9770e' : '#3177dd' }}>Justificado</div>}
                            </motion.div>;
                          });
                        })()}
                      </div>
                      <div className="sis-eng-calendar-legend"><span><i style={{ background: '#2aba72' }} />Normal</span><span><i style={{ background: '#ff9c2e' }} />Atrasado/Saída Antecipada</span><span><i style={{ background: '#e4544e' }} />Falta</span><span><i style={{ background: '#3177dd' }} />Justificado</span><span><i style={{ background: '#a855f7' }} />Atestado</span><span><i style={{ background: '#8e9bb0' }} />Feriado</span><span><i style={{ background: '#b4bdca' }} />Folga</span></div>
                    </section>

                    <aside className="sis-eng-calendar-summary">
                    {(() => {
                      const prefixo = `${mes.getFullYear()}-${String(mes.getMonth() + 1).padStart(2, '0')}`;
                      const dias = Object.entries(calendarioRegistros).filter(([chave, registrosDia]) => chave.startsWith(prefixo) && Array.isArray(registrosDia) && registrosDia.length > 0);
                      const registrosMes = dias.reduce((total, [, registrosDia]) => total + registrosDia.length, 0);
                      const atrasosMes = dias.reduce((total, [chaveDia, registrosDia]) => total + (registrosDia.some((registro, indice, lista) => statusRegistroEng(new Date(registro), indice, lista, chaveDia) === 'Atrasado/Saída Antecipada') ? 1 : 0), 0);
                      const totalDiasMes = new Date(mes.getFullYear(), mes.getMonth() + 1, 0).getDate();
                      // Conta tanto o dia com um registro justificado pontualmente quanto o dia
                      // com um período faltante (ex.: só a tarde) coberto por justificativa aceita.
                      const justificadasMes = Array.from({ length: totalDiasMes }, (_, indice) => new Date(mes.getFullYear(), mes.getMonth(), indice + 1))
                        .filter((dia) => {
                          const chaveDia = chaveData(dia);
                          const registrosDia = Array.isArray(calendarioRegistros[chaveDia]) ? calendarioRegistros[chaveDia] : [];
                          const temJustificadoPorPonto = registrosDia.some((registro, indice, lista) => statusRegistroEng(new Date(registro), indice, lista, chaveDia) === 'Justificado');
                          if (temJustificadoPorPonto) return true;
                          return statusJustificativaSlotsFaltantes(justificativas, calendarioFuncionarioId, chaveDia, horariosDoDia(dia), registrosDia.length) === 'Aceita';
                        }).length;
                      return <motion.div className="sis-eng-calendar-summary-card" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: .3 }}>
                        <div className="sis-eng-calendar-summary-head"><h2>Resumo do mês</h2><span>Seus registros em {meses[mes.getMonth()].toLowerCase()}</span></div>
                        <div className="sis-eng-calendar-summary-list">
                          <div className="sis-eng-calendar-summary-row"><CalendarDays size={16} color="#2aba72" /><span>Dias trabalhados</span><strong>{dias.length}</strong></div>
                          <div className="sis-eng-calendar-summary-row"><CircleAlert size={16} color="#ff9c2e" /><span>Atrasado/Saída Antecipada</span><strong>{atrasosMes}</strong></div>
                          <div className="sis-eng-calendar-summary-row"><CircleAlert size={16} color="#e4544e" /><span>Faltas</span><strong>0</strong></div>
                          <div className="sis-eng-calendar-summary-row"><FileText size={16} color="#3177dd" /><span>Justificadas</span><strong>{justificadasMes}</strong></div>
                          <div className="sis-eng-calendar-summary-row"><CalendarDays size={16} color="#a855f7" /><span>Atestados</span><strong>0</strong></div>
                          <div className="sis-eng-calendar-summary-row"><TimerReset size={16} color="#1767e8" /><span>Registros realizados</span><strong>{registrosMes}</strong></div>
                        </div>
                      </motion.div>;
                    })()}
                    </aside>
                  </div>
                </div>
              </Card>
            </section>
          )}
        </section>
      </div>
      {confirmacaoModal && <ConfirmacaoPonto {...confirmacaoModal} onClose={() => setConfirmacaoModal(null)} />}
      {novoFuncionarioModal && <FormularioModal titulo="Novo funcionário" campos={[{ nome: 'nome', label: 'Nome completo', obrigatorio: true }, { nome: 'setor', label: 'Setor', obrigatorio: true, valorInicial: 'ENG' }]} textoConfirmar="Adicionar" confirmar={criarFuncionarioEng} onClose={() => setNovoFuncionarioModal(false)} />}
    </main>
  );
}

const ORDEM_STATUS_JUSTIFICATIVA = { 'Em análise': 0, Aceita: 1, Inválida: 2, Recusada: 3 };

function SisPontoJustificativasAdmin({ justificativas, carregando, onAtualizado }) {
  const [processandoId, setProcessandoId] = useState(null);
  const [imagemAmpliada, setImagemAmpliada] = useState(null);
  const [confirmacaoExclusao, setConfirmacaoExclusao] = useState(null);

  const decidir = async (id, status) => {
    setProcessandoId(id);
    try {
      await api.updateSispontoJustificativa(id, { status });
      onAtualizado();
    } catch {
      // mantém a lista como está; o admin pode tentar novamente.
    } finally {
      setProcessandoId(null);
    }
  };

  const excluir = (justificativa) => setConfirmacaoExclusao({
    titulo: 'Excluir justificativa',
    mensagem: `Excluir a justificativa de ${justificativa.nome} (${justificativa.dia})? Essa ação não pode ser desfeita.`,
    destrutivo: true,
    confirmar: async () => {
      setConfirmacaoExclusao(null);
      setProcessandoId(justificativa.id);
      try {
        await api.deleteSispontoJustificativa(justificativa.id);
        onAtualizado();
      } catch {
        // mantém a lista como está; o admin pode tentar novamente.
      } finally {
        setProcessandoId(null);
      }
    },
  });

  const ordenadas = [...justificativas].sort((a, b) => {
    const porStatus = (ORDEM_STATUS_JUSTIFICATIVA[a.status] ?? 9) - (ORDEM_STATUS_JUSTIFICATIVA[b.status] ?? 9);
    if (porStatus !== 0) return porStatus;
    return new Date(b.criadoEm) - new Date(a.criadoEm);
  });

  if (carregando) {
    return <Card style={{ padding: 26, minHeight: 200 }}><p style={{ color: '#7183a3', fontSize: 13 }}>Carregando justificativas...</p></Card>;
  }

  if (!ordenadas.length) {
    return <Card style={{ padding: 26, minHeight: 200 }}>
      <h2 style={{ margin: 0, fontSize: 20 }}>Justificativas</h2>
      <p style={{ margin: '6px 0 0', color: '#7183a3', fontSize: 13, fontWeight: 600 }}>Nenhuma solicitação enviada pelos funcionários até o momento.</p>
    </Card>;
  }

  return (
    <>
    <div style={{ display: 'grid', gap: 12 }}>
      {ordenadas.map((justificativa) => {
        const cor = JUSTIFICATIVA_CORES[justificativa.status] || JUSTIFICATIVA_CORES['Em análise'];
        const processando = processandoId === justificativa.id;
        return (
          <motion.div key={justificativa.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ background: '#fff', border: `1px solid ${cor.borda}`, borderRadius: 14, boxShadow: '0 4px 14px rgba(15,35,70,.05)', padding: 18, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 260px', minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 900, color: '#1d3156', fontSize: 14 }}><User size={14} /> {justificativa.nome}</span>
                <span style={{ color: '#7183a3', fontSize: 11, fontWeight: 800 }}>{justificativa.setor}</span>
                <span style={{ marginLeft: 'auto', padding: '4px 10px', borderRadius: 99, background: cor.texto, color: '#fff', fontSize: 10, fontWeight: 900 }}>{justificativa.status}</span>
              </div>
              <div style={{ marginTop: 8, color: '#243755', fontSize: 12, fontWeight: 800 }}>
                {new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', weekday: 'long' }).format(new Date(`${justificativa.dia}T12:00:00`))} · {justificativa.horaInicio}–{justificativa.horaFim}
              </div>
              <p style={{ margin: '8px 0 0', color: '#405371', fontSize: 12, fontWeight: 600, lineHeight: 1.5 }}>{justificativa.motivo}</p>
              {justificativa.anexoDataUrl && (
                <button type="button" onClick={() => setImagemAmpliada(justificativa.anexoDataUrl)} style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10, border: 0, background: 'transparent', padding: 0, cursor: 'pointer' }}>
                  <span style={{ display: 'block', width: 56, height: 56, borderRadius: 8, overflow: 'hidden', border: '1px solid #e5edf8', flexShrink: 0 }}>
                    <img src={justificativa.anexoDataUrl} alt="Atestado anexado" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#1767e8', fontSize: 11, fontWeight: 800 }}><FileText size={13} /> Ver atestado anexado</span>
                </button>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: '0 0 auto', justifyContent: 'center', alignItems: 'stretch' }}>
              {justificativa.status === 'Em análise' ? (
                <>
                  <button type="button" disabled={processando} onClick={() => decidir(justificativa.id, 'Aceita')} style={{ border: 0, borderRadius: 8, padding: '9px 16px', background: '#2aba72', color: '#fff', fontWeight: 800, fontSize: 12, cursor: processando ? 'default' : 'pointer', opacity: processando ? .6 : 1 }}>Aceitar justificativa</button>
                  <button type="button" disabled={processando} onClick={() => decidir(justificativa.id, 'Inválida')} style={{ border: 0, borderRadius: 8, padding: '9px 16px', background: '#ff9c2e', color: '#fff', fontWeight: 800, fontSize: 12, cursor: processando ? 'default' : 'pointer', opacity: processando ? .6 : 1 }}>Justificativa inválida</button>
                  <button type="button" disabled={processando} onClick={() => decidir(justificativa.id, 'Recusada')} style={{ border: 0, borderRadius: 8, padding: '9px 16px', background: '#e4544e', color: '#fff', fontWeight: 800, fontSize: 12, cursor: processando ? 'default' : 'pointer', opacity: processando ? .6 : 1 }}>Recusar justificativa</button>
                </>
              ) : (
                <div style={{ color: '#7183a3', fontSize: 11, fontWeight: 700, textAlign: 'right' }}>
                  Decidida em {new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(justificativa.atualizadoEm))}
                </div>
              )}
              <button type="button" disabled={processando} onClick={() => excluir(justificativa)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, border: '1px solid #f0d3d3', borderRadius: 8, padding: '8px 16px', background: '#fff', color: '#8a4a4f', fontWeight: 800, fontSize: 12, cursor: processando ? 'default' : 'pointer', opacity: processando ? .6 : 1 }}><Trash2 size={13} /> Excluir</button>
            </div>
          </motion.div>
        );
      })}
    </div>
    {imagemAmpliada && (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} role="presentation" onMouseDown={() => setImagemAmpliada(null)} style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'grid', placeItems: 'center', padding: 24, background: 'rgba(15, 30, 55, .72)' }}>
        <motion.img initial={{ opacity: 0, scale: .96 }} animate={{ opacity: 1, scale: 1 }} src={imagemAmpliada} alt="Atestado anexado em tamanho ampliado" onMouseDown={(event) => event.stopPropagation()} style={{ maxWidth: 'min(720px, 92vw)', maxHeight: '86vh', borderRadius: 12, boxShadow: '0 24px 70px rgba(0,0,0,.4)' }} />
      </motion.div>
    )}
    {confirmacaoExclusao && <ConfirmacaoPonto {...confirmacaoExclusao} onClose={() => setConfirmacaoExclusao(null)} />}
    </>
  );
}
