import { useEffect, useState } from 'react';
import { tipoProcessoService } from '../services/tipoProcessoService';
import {
  Actions, SearchableSelect, Section, Shell, Toast, useToast, C, MONT, SANS,
} from '../components/cadastros/CadastroKit.jsx';

const SETORES = ['ENG', 'CRD', 'DES', 'TOPO'];

const botaoIconeStyle = (desabilitado) => ({
  width: 28, height: 28, borderRadius: 7, border: `1px solid ${C.border}`, background: '#fff',
  color: desabilitado ? C.border : C.label, cursor: desabilitado ? 'default' : 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0,
});

// Tela de administração das etapas padrão de cada tipo de processo — o que
// antes era o CATALOGO_PROCESSOS/MAPEAMENTO_SETORES fixo em workflowService.js
// agora vive na tabela TipoProcessoEtapa e é editável por aqui. Restrita ao
// usuário ENG (checagem espelhada no backend em tipoProcessoRoutes.js).
export default function ConfigEtapasView({ onBack, usuarioLogado }) {
  const accent = C.accent;
  const { toast, show } = useToast();
  const [tipos, setTipos] = useState([]);
  const [tipoSelecionado, setTipoSelecionado] = useState(null);
  const [etapas, setEtapas] = useState([]);
  const [salvando, setSalvando] = useState(false);
  const [carregando, setCarregando] = useState(true);

  const carregar = async (manterSelecao) => {
    setCarregando(true);
    try {
      const lista = await tipoProcessoService.listar();
      if (!Array.isArray(lista)) return;

      setTipos(lista);
      const alvo = manterSelecao
        ? lista.find((t) => t.tipoProcesso === manterSelecao)
        : lista[0];
      if (alvo) {
        setTipoSelecionado(alvo.tipoProcesso);
        setEtapas(alvo.etapas.map((e) => ({ ...e })));
      }
    } catch (erro) {
      console.error('Erro ao carregar tipos de processo:', erro);
      show('Erro ao carregar etapas.', 'err');
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => { carregar(); }, []);

  const selecionarTipo = (tipoProcesso) => {
    setTipoSelecionado(tipoProcesso);
    const tipo = tipos.find((t) => t.tipoProcesso === tipoProcesso);
    setEtapas(tipo ? tipo.etapas.map((e) => ({ ...e })) : []);
  };

  const alterarEtapa = (indice, campo) => (valor) => {
    setEtapas((atuais) => atuais.map((e, i) => (i === indice ? { ...e, [campo]: valor } : e)));
  };

  const moverEtapa = (indice, direcao) => {
    setEtapas((atuais) => {
      const alvo = indice + direcao;
      if (alvo < 0 || alvo >= atuais.length) return atuais;
      const copia = [...atuais];
      [copia[indice], copia[alvo]] = [copia[alvo], copia[indice]];
      return copia;
    });
  };

  const removerEtapa = (indice) => setEtapas((atuais) => atuais.filter((_, i) => i !== indice));
  const adicionarEtapa = () => setEtapas((atuais) => [...atuais, { nome: '', setor: 'CRD' }]);

  const handleSalvar = async () => {
    if (etapas.length === 0) {
      show('Adicione ao menos uma etapa.', 'err');
      return;
    }
    if (etapas.some((e) => !e.nome.trim())) {
      show('Toda etapa precisa de um nome.', 'err');
      return;
    }

    setSalvando(true);
    try {
      const res = await tipoProcessoService.atualizar(tipoSelecionado, etapas, usuarioLogado);
      if (!res.ok) {
        show(res.data?.error || 'Erro ao salvar etapas.', 'err');
        return;
      }
      show(`Etapas salvas — ${res.data.projetosAtualizados} projeto(s) em andamento atualizado(s).`);
      await carregar(tipoSelecionado);
    } catch (erro) {
      console.error(erro);
      show('Erro ao conectar com o servidor.', 'err');
    } finally {
      setSalvando(false);
    }
  };

  if (!['ENG', 'DEV'].includes(usuarioLogado)) {
    return (
      <Shell title="Configurar Etapas" accent={accent} subtitle="Acesso restrito" onBack={onBack}>
        <p style={{ fontFamily: SANS, fontSize: 14, color: C.muted }}>
          Só o usuário ENG pode configurar as etapas padrão dos processos.
        </p>
      </Shell>
    );
  }

  return (
    <Shell title="Configurar Etapas" accent={accent}
      subtitle="Etapas padrão de cada tipo de processo no Kanban" onBack={onBack} wide>
      {toast && <Toast msg={toast.msg} kind={toast.kind} />}

      <Section icon="layers" title="Tipo de processo" accent={accent}>
        <SearchableSelect label="Tipo" icon="layers" accent={accent} span={2}
          options={tipos.map((t) => ({ value: t.tipoProcesso, label: t.tipoProcesso, sub: `${t.etapas.length} etapa(s)` }))}
          value={tipoSelecionado} onChange={selecionarTipo} placeholder="Selecione um tipo de processo…" />
      </Section>

      {carregando && tipos.length === 0 && (
        <p style={{ fontFamily: SANS, fontSize: 13, color: C.muted, padding: '0 4px' }}>Carregando…</p>
      )}

      {tipoSelecionado && (
        <Section icon="doc" title={`Etapas — ${tipoSelecionado}`} accent={accent}
          desc="Ordem em que as tarefas aparecem no Kanban, e o setor responsável por cada uma.">
          <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {etapas.map((etapa, indice) => (
              <div key={indice} style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px',
                background: '#fff', border: `1px solid ${C.border}`, borderRadius: 10,
              }}>
                <span style={{ fontFamily: MONT, fontWeight: 700, fontSize: 11, color: C.muted, width: 20, textAlign: 'center', flexShrink: 0 }}>
                  {indice + 1}
                </span>
                <input value={etapa.nome} onChange={(e) => alterarEtapa(indice, 'nome')(e.target.value)}
                  placeholder="Nome da etapa" style={{
                    flex: 1, minWidth: 0, border: `1.5px solid ${C.border}`, borderRadius: 8, padding: '8px 10px',
                    fontFamily: SANS, fontSize: 13.5, color: C.text, outline: 'none',
                  }} />
                <select value={etapa.setor} onChange={(e) => alterarEtapa(indice, 'setor')(e.target.value)} style={{
                  border: `1.5px solid ${C.border}`, borderRadius: 8, padding: '8px 10px',
                  fontFamily: SANS, fontSize: 13, color: C.text, outline: 'none', cursor: 'pointer', width: 150, flexShrink: 0,
                }}>
                  {SETORES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <button type="button" onClick={() => moverEtapa(indice, -1)} disabled={indice === 0}
                  title="Mover para cima" style={botaoIconeStyle(indice === 0)}>↑</button>
                <button type="button" onClick={() => moverEtapa(indice, 1)} disabled={indice === etapas.length - 1}
                  title="Mover para baixo" style={botaoIconeStyle(indice === etapas.length - 1)}>↓</button>
                <button type="button" onClick={() => removerEtapa(indice)} title="Remover etapa"
                  style={{ ...botaoIconeStyle(false), color: C.danger }}>×</button>
              </div>
            ))}

            <button type="button" onClick={adicionarEtapa} style={{
              alignSelf: 'flex-start', marginTop: 4, padding: '9px 16px', borderRadius: 9,
              border: `1.5px dashed ${C.border}`, background: 'transparent', color: accent,
              fontFamily: MONT, fontWeight: 700, fontSize: 12.5, cursor: 'pointer',
            }}>
              + Adicionar etapa
            </button>
          </div>
        </Section>
      )}

      {tipoSelecionado && (
        <Actions accent={accent} saving={salvando} onSave={handleSalvar}
          saveLabel={salvando ? 'Salvando…' : 'Salvar etapas'} />
      )}
    </Shell>
  );
}
