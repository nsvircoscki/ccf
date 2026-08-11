import React, { useEffect, useState } from 'react';
import { servicoService } from '../services/servicoService';
import { clienteService } from '../services/clienteService';
import { imovelService } from '../services/imovelService';
import {
  Actions, CheckboxList, ChipList, Field, Icon, SearchableSelect, SelectField, Section, Segmented, Shell, Toast, useToast, C,
} from '../components/cadastros/CadastroKit.jsx';

const vinculacaoVazia = {
  proprietarioIds: [],
  imovelId: '',
  situacaoProprietario: '',
  procuradorId: '',
  confrontanteIds: [],
  descricaoAtualImovel: '',
  memorialDescritivoRetificacao: '',
  superiorOuInferior: 'superior',
  totalLotes: '',
  averbacoes: '',
  areasDesmembramento: '',
  listaProtocoloEntrega: '',
};

const paraOpcaoPessoa = (cliente) => ({ value: cliente.id, label: cliente.nome, sub: cliente.documento });
const nomesProprietarios = (imovel) => (imovel.proprietarios || []).map((p) => p.nome).join(', ') || 'Sem proprietário';
const paraOpcaoImovel = (imovel) => ({
  value: imovel.id,
  label: imovel.matricula || 'Sem matrícula',
  sub: nomesProprietarios(imovel),
});
const paraOpcaoServico = (servico) => ({ value: servico.id, label: servico.numeroServico, sub: servico.nomeCliente });

const TABS = [
  { id: 'vinc', label: 'Vínculos', icon: 'link', desc: 'Proprietários, imóvel e confrontantes' },
  { id: 'retif', label: 'Descrição', icon: 'ruler', desc: 'Descrição atual e memorial descritivo' },
  { id: 'docs', label: 'Documentos', icon: 'doc', desc: 'Lotes, averbações e protocolos' },
];

export default function VinculacaoView({ onBack }) {
  const accent = C.accent;
  const { toast, show } = useToast();
  const [servicoId, setServicoId] = useState(null);
  const [servicos, setServicos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [imoveis, setImoveis] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [tiposDoServico, setTiposDoServico] = useState([]);
  const [tipoFoco, setTipoFoco] = useState('');
  const [docsSelecionados, setDocsSelecionados] = useState([]);
  const [form, setForm] = useState(vinculacaoVazia);
  const [tab, setTab] = useState('vinc');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [listaServicos, listaClientes, listaImoveis, listaTemplates] = await Promise.all([
          servicoService.listarTodos(),
          clienteService.listarTodos(),
          imovelService.listarTodos(),
          servicoService.listarTemplatesDocumento(),
        ]);
        if (Array.isArray(listaServicos)) setServicos(listaServicos);
        if (Array.isArray(listaClientes)) setClientes(listaClientes);
        if (Array.isArray(listaImoveis)) setImoveis(listaImoveis);
        if (Array.isArray(listaTemplates)) setTemplates(listaTemplates);
      } catch (erro) {
        console.error('Erro ao carregar dados da vinculação:', erro);
      }
    })();
  }, []);

  const set = (campo) => (valor) => setForm((atual) => ({ ...atual, [campo]: valor }));

  const carregarServico = async (id) => {
    if (!id) {
      setServicoId(null);
      setForm(vinculacaoVazia);
      setTiposDoServico([]);
      setTipoFoco('');
      setDocsSelecionados([]);
      return;
    }

    try {
      const servico = await servicoService.buscarPorId(id);
      setServicoId(servico.id);
      setTab('vinc');
      setTiposDoServico(servico.tiposSolicitados || []);
      setTipoFoco((servico.tiposSolicitados || [])[0] || '');
      setDocsSelecionados([]);
      setForm({
        proprietarioIds: (servico.proprietarios || []).map((p) => p.id),
        imovelId: servico.imovelId || '',
        situacaoProprietario: servico.situacaoProprietario || '',
        procuradorId: servico.procuradorId || '',
        confrontanteIds: (servico.confrontantes || []).map((c) => c.id),
        descricaoAtualImovel: servico.descricaoAtualImovel || '',
        memorialDescritivoRetificacao: servico.memorialDescritivoRetificacao || '',
        superiorOuInferior: servico.superiorOuInferior || 'superior',
        totalLotes: servico.totalLotes != null ? String(servico.totalLotes) : '',
        averbacoes: servico.averbacoes || '',
        areasDesmembramento: servico.areasDesmembramento || '',
        listaProtocoloEntrega: servico.listaProtocoloEntrega || '',
      });
    } catch (erro) {
      console.error(erro);
      show('Erro ao carregar o serviço.', 'err');
    }
  };

  const handleSalvar = async () => {
    if (!servicoId) {
      show('Selecione um serviço para vincular.', 'err');
      return;
    }

    setSalvando(true);
    try {
      const res = await servicoService.salvarVinculacao(servicoId, form);
      if (!res.ok) {
        show(res.data?.error || 'Erro ao salvar vinculação.', 'err');
        return;
      }
      show('Vinculação salva com sucesso.');
    } catch (erro) {
      console.error(erro);
      show('Erro ao conectar com o servidor.', 'err');
    } finally {
      setSalvando(false);
    }
  };

  // Baixa cada documento marcado — como são downloads diretos (não popups),
  // cliques programáticos em sequência funcionam sem esbarrar em bloqueador.
  const baixarSelecionados = () => {
    docsSelecionados.forEach((chave) => {
      const link = document.createElement('a');
      link.href = servicoService.urlGerarDocumento(servicoId, chave);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  };

  // O protocolo de entrega é guardado como texto (um nome de documento por
  // linha) — aqui a gente só traduz isso pra um checklist nos dois sentidos.
  const protocoloSelecionado = templates
    .filter((t) => (form.listaProtocoloEntrega || '').split('\n').includes(t.nome))
    .map((t) => t.chave);
  const handleProtocoloChange = (chaves) => {
    const nomes = templates.filter((t) => chaves.includes(t.chave)).map((t) => t.nome);
    set('listaProtocoloEntrega')(nomes.join('\n'));
  };

  const svcSelecionado = servicos.find((s) => s.id === servicoId);
  const podeGerarDocumento = Boolean(servicoId && form.proprietarioIds.length > 0 && form.imovelId);

  // Templates sem tiposServico são "gerais" (protocolo, dossiê, declarações
  // padrão) e aparecem sempre; os demais só aparecem se baterem com o tipo
  // de serviço em foco.
  const templatesDoTipo = templates.filter(
    (t) => !t.tiposServico?.length || !tipoFoco || t.tiposServico.includes(tipoFoco),
  );

  const handleTipoFocoChange = (novoTipo) => {
    setTipoFoco(novoTipo);
    const chavesVisiveis = new Set(
      templates
        .filter((t) => !t.tiposServico?.length || t.tiposServico.includes(novoTipo))
        .map((t) => t.chave),
    );
    setDocsSelecionados((atuais) => atuais.filter((chave) => chavesVisiveis.has(chave)));
  };

  return (
    <Shell
      title="SIS DOC"
      wide
      accent={accent}
      subtitle={svcSelecionado ? `${svcSelecionado.numeroServico} — ${svcSelecionado.nomeCliente}` : 'Selecione um serviço para começar'}
      onBack={onBack}
    >
      {toast && <Toast msg={toast.msg} kind={toast.kind} />}

      <div style={{ marginBottom: 20 }}>
        <SearchableSelect label="Serviço" icon="brief" accent={accent}
          options={servicos.map(paraOpcaoServico)} value={servicoId}
          onChange={carregarServico} placeholder="Buscar serviço (número — cliente)…" />
      </div>

      {!servicoId ? (
        <div style={{
          background: '#fff', border: `1.5px dashed ${C.border}`, borderRadius: 18, padding: '48px 24px',
          textAlign: 'center', color: C.muted,
        }}>
          <div style={{ color: accent, display: 'inline-flex', marginBottom: 12 }}><Icon name="link" size={34} /></div>
          <p style={{ fontFamily: '"Montserrat", sans-serif', fontWeight: 700, fontSize: 15, color: C.text, margin: '0 0 4px' }}>Escolha um serviço</p>
          <p style={{ fontFamily: '"Open Sans", sans-serif', fontSize: 13.5, margin: 0 }}>
            Ao selecionar, você poderá vincular proprietários, imóvel, confrontantes e preencher só os documentos que o serviço exige.
          </p>
        </div>
      ) : (
        <div style={{ animation: 'fadeUp 0.3s ease both' }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
            {TABS.map((t) => {
              const on = tab === t.id;
              return (
                <button key={t.id} type="button" onClick={() => setTab(t.id)} style={{
                  flex: '1 1 200px', textAlign: 'left', cursor: 'pointer',
                  background: on ? '#fff' : 'transparent',
                  border: `1.5px solid ${on ? accent : C.border}`, borderRadius: 14, padding: '13px 16px',
                  boxShadow: on ? `0 6px 18px ${accent}22` : 'none', transition: 'all 0.2s ease',
                  display: 'flex', alignItems: 'center', gap: 11,
                }}>
                  <span style={{
                    width: 34, height: 34, borderRadius: 9, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: on ? `linear-gradient(150deg, ${accent}, ${accent}cc)` : C.bg,
                    color: on ? '#fff' : C.muted,
                  }}><Icon name={t.icon} size={17} /></span>
                  <span>
                    <span style={{ display: 'block', fontFamily: '"Montserrat", sans-serif', fontWeight: 700, fontSize: 13, color: on ? C.text : C.label }}>{t.label}</span>
                    <span style={{ display: 'block', fontFamily: '"Open Sans", sans-serif', fontSize: 11, color: C.muted }}>{t.desc}</span>
                  </span>
                </button>
              );
            })}
          </div>

          {tab === 'vinc' && (
            <div style={{ animation: 'fadeUp 0.25s ease both' }}>
              <Section icon="link" title="Vínculos do serviço" accent={accent}>
                <ChipList label="Proprietários" icon="user" accent={accent} span={2}
                  options={clientes.map(paraOpcaoPessoa)} values={form.proprietarioIds}
                  onChange={(v) => set('proprietarioIds')(v)} placeholder="Buscar cliente para adicionar…"
                  emptyHint="Nenhum proprietário vinculado a este serviço ainda." />
                <SelectField label="Situação neste serviço" icon="scale" value={form.situacaoProprietario} onChange={set('situacaoProprietario')}
                  options={[
                    { value: 'proprietário', label: 'Proprietário' },
                    { value: 'herdeiro', label: 'Herdeiro' },
                    { value: 'inventariante', label: 'Inventariante' },
                    { value: 'representante', label: 'Representante' },
                  ]} />
                <SearchableSelect label="Imóvel" icon="home" accent={accent} span={2}
                  options={imoveis.map(paraOpcaoImovel)} value={form.imovelId || null}
                  onChange={(v) => set('imovelId')(v || '')} placeholder="Buscar imóvel (matrícula — proprietário)…" />

                <SearchableSelect label="Procurador (opcional)" icon="user" accent={accent} span={2}
                  options={clientes.filter((c) => !form.proprietarioIds.includes(c.id)).map(paraOpcaoPessoa)}
                  value={form.procuradorId || null} onChange={(v) => set('procuradorId')(v || '')}
                  placeholder="Buscar pessoa com procuração neste serviço…" />

                <ChipList label="Adicionar confrontante" icon="plus" accent={accent} span={2}
                  options={imoveis.filter((i) => i.id !== form.imovelId).map(paraOpcaoImovel)}
                  values={form.confrontanteIds} onChange={(v) => set('confrontanteIds')(v)}
                  placeholder="Buscar imóvel confrontante para adicionar…"
                  emptyHint="Nenhum confrontante vinculado a este serviço ainda." />
              </Section>
            </div>
          )}

          {tab === 'retif' && (
            <div style={{ animation: 'fadeUp 0.25s ease both' }}>
              <Section icon="ruler" title="Descrição do imóvel" desc="Descrição atual e memorial descritivo" accent={accent}>
                <Field label="Descrição atual do imóvel (conforme registro)" icon="doc" span={2} textarea rows={4}
                  value={form.descricaoAtualImovel} onChange={set('descricaoAtualImovel')} placeholder="Descrição do imóvel constante na matrícula atual…" />
                <Field label="Memorial descritivo da retificação" icon="doc" span={2} textarea rows={8}
                  value={form.memorialDescritivoRetificacao} onChange={set('memorialDescritivoRetificacao')} placeholder="Descrição do levantamento topográfico com as novas medidas…" />

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontFamily: '"Montserrat", sans-serif', fontWeight: 600, fontSize: 10.5, color: C.label, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 8 }}>
                    A área medida é superior ou inferior à registrada?
                  </label>
                  <Segmented accent={accent} value={form.superiorOuInferior} onChange={set('superiorOuInferior')}
                    options={[{ value: 'superior', label: 'Superior' }, { value: 'inferior', label: 'Inferior' }]} />
                </div>
              </Section>
            </div>
          )}

          {tab === 'docs' && (
            <div style={{ animation: 'fadeUp 0.25s ease both' }}>
              <Section icon="doc" title="Dados para outros documentos" desc="Campos usados conforme o documento a gerar" accent={accent}>
                <Field label="Número de lotes" icon="hash" value={form.totalLotes} onChange={(v) => set('totalLotes')(v.replace(/\D/g, ''))} placeholder="Para Consulta Prévia (PMSBS)" />
                <div />
                <Field label="Averbações" icon="doc" span={2} textarea rows={3} value={form.averbacoes} onChange={set('averbacoes')} placeholder="Averbações a registrar…" />
                <Field label="Áreas do desmembramento" icon="ruler" span={2} textarea rows={3} value={form.areasDesmembramento} onChange={set('areasDesmembramento')} placeholder="Descrição das áreas resultantes…" />

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontFamily: '"Montserrat", sans-serif', fontWeight: 600, fontSize: 10.5, color: C.label, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 8 }}>
                    Lista do protocolo de entrega — marque os documentos que compõem o protocolo
                  </label>
                  <CheckboxList accent={accent} span={2}
                    options={templates.map((t) => ({ value: t.chave, label: t.nome }))}
                    values={protocoloSelecionado} onChange={handleProtocoloChange} />
                </div>
              </Section>
            </div>
          )}

          <Actions editing accent={accent} saving={salvando} onSave={handleSalvar} saveLabel={salvando ? 'Salvando…' : 'Salvar vinculação'} />

          <Section icon="download" title="Gerar documento" accent={accent}
            desc={podeGerarDocumento ? 'Marque os documentos e baixe de uma vez' : 'Selecione e salve os proprietários e o imóvel deste serviço para liberar a geração dos documentos.'}>
            {podeGerarDocumento && (
              <>
                {tiposDoServico.length > 1 && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <SelectField label="Tipo de serviço para este documento" icon="brief" value={tipoFoco} onChange={handleTipoFocoChange} options={tiposDoServico} />
                  </div>
                )}
                <CheckboxList accent={accent} span={2}
                  options={templatesDoTipo.map((t) => ({ value: t.chave, label: t.nome }))}
                  values={docsSelecionados} onChange={setDocsSelecionados} />
                <div style={{ gridColumn: '1 / -1' }}>
                  <button type="button" onClick={baixarSelecionados} disabled={docsSelecionados.length === 0} style={{
                    marginTop: 14, padding: '12px 28px', borderRadius: 11, border: 'none',
                    background: docsSelecionados.length ? `linear-gradient(135deg, ${accent} 0%, ${C.green} 100%)` : C.border,
                    color: '#fff', fontFamily: '"Montserrat", sans-serif', fontWeight: 700, fontSize: 13, letterSpacing: '0.05em',
                    cursor: docsSelecionados.length ? 'pointer' : 'not-allowed',
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                  }}>
                    <Icon name="download" size={16} />
                    Baixar {docsSelecionados.length > 0 ? `${docsSelecionados.length} documento(s)` : 'documentos selecionados'}
                  </button>
                </div>
              </>
            )}
          </Section>
        </div>
      )}
    </Shell>
  );
}
