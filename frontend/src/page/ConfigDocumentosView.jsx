import { useEffect, useState } from 'react';
import { servicoService } from '../services/servicoService';
import { Actions, CheckboxList, Section, Shell, Toast, useToast, C } from '../components/cadastros/CadastroKit.jsx';

// Mesma lista de tipos usada no Orçamento (SIGLA_POR_TIPO) — é o vocabulário
// canônico de servico.tiposSolicitados.
const TIPOS_SERVICO = [
  'Retificação', 'Desmembramento', 'Unificação', 'Usucapião', 'Alteração de Divisas',
  'CAR', 'Certificação INCRA', 'Escritura', 'Conferência', 'Cadastral',
  'Locação', 'Movimentação de Terra', 'Extremação', 'Altimetria', 'DANC',
  'Relatório de Usucapião', 'CCIR/ITR', 'Outros',
];

export default function ConfigDocumentosView({ onBack }) {
  const accent = C.accent;
  const { toast, show } = useToast();
  const [templates, setTemplates] = useState([]);
  const [mapa, setMapa] = useState({});
  const [salvando, setSalvando] = useState(false);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const lista = await servicoService.listarTemplatesDocumento();
        if (Array.isArray(lista)) {
          setTemplates(lista);
          const inicial = {};
          lista.forEach((t) => { inicial[t.chave] = t.tiposServico || []; });
          setMapa(inicial);
        }
      } catch (erro) {
        console.error('Erro ao carregar templates:', erro);
        show('Erro ao carregar documentos.', 'err');
      } finally {
        setCarregando(false);
      }
    })();
  }, []);

  const alterarTiposDoTemplate = (chave) => (tipos) => {
    setMapa((atual) => ({ ...atual, [chave]: tipos }));
  };

  const handleSalvar = async () => {
    setSalvando(true);
    try {
      const res = await servicoService.salvarMapeamentoTiposDocumento(mapa);
      if (!res.ok) {
        show(res.data?.error || 'Erro ao salvar mapeamento.', 'err');
        return;
      }
      show('Mapeamento salvo com sucesso.');
    } catch (erro) {
      console.error(erro);
      show('Erro ao conectar com o servidor.', 'err');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Shell
      title="Documentos × Tipos de Serviço"
      accent={accent}
      subtitle="Escolha para quais tipos de serviço cada documento aparece"
      onBack={onBack}
    >
      {toast && <Toast msg={toast.msg} kind={toast.kind} />}

      {carregando ? (
        <p style={{ fontFamily: '"Open Sans", sans-serif', fontSize: 13.5, color: C.muted }}>Carregando…</p>
      ) : (
        <>
          <p style={{ fontFamily: '"Open Sans", sans-serif', fontSize: 13, color: C.muted, margin: '0 0 20px' }}>
            Marque os tipos de serviço aos quais cada documento se aplica. Documentos sem nenhum tipo marcado
            são considerados <strong>gerais</strong> e aparecem para qualquer serviço na tela de SIS DOC.
          </p>

          {templates.map((t) => (
            <Section key={t.chave} icon="doc" title={t.nome}
              desc={(mapa[t.chave] || []).length === 0 ? 'Geral — aparece para todos os tipos' : undefined}
              accent={accent}
            >
              <CheckboxList accent={accent} span={2}
                options={TIPOS_SERVICO.map((tipo) => ({ value: tipo, label: tipo }))}
                values={mapa[t.chave] || []}
                onChange={alterarTiposDoTemplate(t.chave)} />
            </Section>
          ))}

          <Actions editing accent={accent} saving={salvando} onSave={handleSalvar}
            saveLabel={salvando ? 'Salvando…' : 'Salvar mapeamento'} />
        </>
      )}
    </Shell>
  );
}
