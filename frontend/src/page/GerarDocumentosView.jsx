import { useEffect, useState } from 'react';
import { servicoService } from '../services/servicoService';
import {
  CheckboxList, Icon, SearchableSelect, SelectField, Section, Shell, Toast, useToast, C,
} from '../components/cadastros/CadastroKit.jsx';

// SIS DOC › Gerar documentos: separado da Vinculação. Aqui só se escolhe o
// serviço e os modelos; os dados (proprietários, imóvel, confrontantes,
// descrição, averbações...) vêm do que foi salvo na Vinculação.
const paraOpcaoServico = (servico) => ({ value: servico.id, label: servico.numeroServico, sub: servico.nomeCliente });

function nomeArquivoDoHeader(contentDisposition, fallback) {
  const match = contentDisposition?.match(/filename="([^"]+)"/);
  return match ? decodeURIComponent(match[1]) : fallback;
}

export default function GerarDocumentosView({ onBack }) {
  const accent = C.accent;
  const { toast, show } = useToast();
  const [servicos, setServicos] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [servico, setServico] = useState(null);
  const [tipoFoco, setTipoFoco] = useState('');
  const [docsSelecionados, setDocsSelecionados] = useState([]);
  const [baixando, setBaixando] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [listaServicos, listaTemplates] = await Promise.all([
          servicoService.listarTodos(),
          servicoService.listarTemplatesDocumento(),
        ]);
        if (Array.isArray(listaServicos)) setServicos(listaServicos);
        if (Array.isArray(listaTemplates)) setTemplates(listaTemplates);
      } catch (erro) {
        console.error('Erro ao carregar dados para gerar documentos:', erro);
      }
    })();
  }, []);

  const carregarServico = async (id) => {
    setDocsSelecionados([]);
    if (!id) {
      setServico(null);
      setTipoFoco('');
      return;
    }
    try {
      const encontrado = await servicoService.buscarPorId(id);
      setServico(encontrado);
      setTipoFoco((encontrado.tiposSolicitados || [])[0] || '');
    } catch (erro) {
      console.error(erro);
      show('Erro ao carregar o serviço.', 'err');
    }
  };

  // Baixa um documento por vez, esperando cada download terminar antes do
  // próximo — disparar vários downloads de uma vez faz o navegador bloquear
  // ou perder os que vêm depois do primeiro. Cada arquivo sai em .docx.
  const baixarSelecionados = async () => {
    if (docsSelecionados.length === 0) return;

    setBaixando(true);
    let falhas = 0;
    for (const chave of docsSelecionados) {
      const nomeTemplate = templates.find((t) => t.chave === chave)?.nome || chave;
      try {
        const res = await fetch(servicoService.urlGerarDocumento(servico.id, chave));
        if (!res.ok) throw new Error('Falha ao gerar documento.');
        const blob = await res.blob();
        const nomeArquivo = nomeArquivoDoHeader(res.headers.get('Content-Disposition'), `${nomeTemplate}.docx`);

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = nomeArquivo;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } catch (erro) {
        console.error(`Erro ao gerar "${nomeTemplate}":`, erro);
        falhas += 1;
      }
    }

    // Registra no protocolo de entrega os documentos gerados (soma com o que
    // já estava marcado na Vinculação).
    try {
      await servicoService.registrarDocumentosNoProtocolo(servico.id, docsSelecionados);
    } catch (erro) {
      console.error('Erro ao registrar documentos no protocolo de entrega:', erro);
    }

    setBaixando(false);
    if (falhas > 0) show(`${falhas} de ${docsSelecionados.length} documento(s) falharam ao gerar.`, 'err');
    else show(`${docsSelecionados.length} documento(s) baixado(s) e registrado(s) no protocolo.`);
  };

  const tiposDoServico = servico?.tiposSolicitados || [];
  const proprietarios = servico?.proprietarios || [];
  const podeGerar = Boolean(servico && proprietarios.length > 0 && servico.imovelId);

  // Modelos sem tipo de serviço são "gerais" (protocolo, dossiê, declarações
  // padrão) e aparecem sempre; os demais só se baterem com o tipo em foco.
  const templatesDoTipo = templates.filter(
    (t) => !t.tiposServico?.length || !tipoFoco || t.tiposServico.includes(tipoFoco),
  );

  const handleTipoFocoChange = (novoTipo) => {
    setTipoFoco(novoTipo);
    const chavesVisiveis = new Set(
      templates.filter((t) => !t.tiposServico?.length || t.tiposServico.includes(novoTipo)).map((t) => t.chave),
    );
    setDocsSelecionados((atuais) => atuais.filter((chave) => chavesVisiveis.has(chave)));
  };

  const svcSelecionado = servicos.find((s) => s.id === servico?.id);

  return (
    <Shell
      title="Gerar documentos"
      wide
      accent={accent}
      subtitle={svcSelecionado ? `${svcSelecionado.numeroServico} — ${svcSelecionado.nomeCliente}` : 'Selecione um serviço para começar'}
      onBack={onBack}
    >
      {toast && <Toast msg={toast.msg} kind={toast.kind} />}

      <div style={{ marginBottom: 20 }}>
        <SearchableSelect label="Serviço" icon="brief" accent={accent}
          options={servicos.map(paraOpcaoServico)} value={servico?.id || null}
          onChange={carregarServico} placeholder="Buscar serviço (número — cliente)…" />
      </div>

      {!servico ? (
        <div style={{
          background: '#fff', border: `1.5px dashed ${C.border}`, borderRadius: 18, padding: '48px 24px',
          textAlign: 'center', color: C.muted,
        }}>
          <div style={{ color: accent, display: 'inline-flex', marginBottom: 12 }}><Icon name="download" size={34} /></div>
          <p style={{ fontFamily: '"Montserrat", sans-serif', fontWeight: 700, fontSize: 15, color: C.text, margin: '0 0 4px' }}>Escolha um serviço</p>
          <p style={{ fontFamily: '"Open Sans", sans-serif', fontSize: 13.5, margin: 0 }}>
            Os documentos usam os proprietários, o imóvel e os demais dados salvos na Vinculação do serviço.
          </p>
        </div>
      ) : (
        <div style={{ animation: 'fadeUp 0.3s ease both' }}>
          <Section icon="download" title="Documentos" accent={accent}
            desc={podeGerar
              ? `Proprietário(s): ${proprietarios.map((p) => p.nome).filter(Boolean).join(', ') || '—'}`
              : 'Este serviço ainda não tem proprietário e imóvel vinculados. Vincule-os em SIS DOC › Vinculação para liberar a geração.'}>
            {podeGerar && (
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
                  <button type="button" onClick={baixarSelecionados} disabled={docsSelecionados.length === 0 || baixando} style={{
                    marginTop: 14, padding: '12px 28px', borderRadius: 11, border: 'none',
                    background: docsSelecionados.length && !baixando ? `linear-gradient(135deg, ${accent} 0%, ${C.green} 100%)` : C.border,
                    color: '#fff', fontFamily: '"Montserrat", sans-serif', fontWeight: 700, fontSize: 13, letterSpacing: '0.05em',
                    cursor: docsSelecionados.length && !baixando ? 'pointer' : 'not-allowed',
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                  }}>
                    <Icon name="download" size={16} />
                    {baixando
                      ? 'Gerando documentos…'
                      : `Baixar ${docsSelecionados.length > 0 ? `${docsSelecionados.length} documento(s)` : 'documentos selecionados'}`}
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
