import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Download, FileText, Save, Users } from 'lucide-react';
import { servicoService } from '../services/servicoService';
import { clienteService } from '../services/clienteService';
import { imovelService } from '../services/imovelService';
import { AnimatedDropdown } from '../components/AnimatedDropdown';

const baseFieldStyle = {
  height: '44px',
  borderRadius: '12px',
  border: '1px solid rgba(15, 23, 42, 0.12)',
  background: '#F8FAFD',
  padding: '0 14px',
  fontSize: '14px',
  outline: 'none',
  color: '#1F2937',
};

const activeFieldStyle = {
  border: '1px solid #2D7AFD',
  boxShadow: '0 0 0 3px rgba(45, 122, 253, 0.12)',
};

const labelStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  fontSize: '12px',
  fontWeight: 800,
  color: '#5F6B83',
  textTransform: 'uppercase',
};

function OptionButton({ ativo, onClick, children }) {
  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.03, y: -1 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      style={{
        flex: 1,
        height: '36px',
        borderRadius: '8px',
        border: ativo ? '1px solid #2D7AFD' : '1px solid rgba(15, 23, 42, 0.12)',
        background: ativo ? '#2D7AFD' : '#FFFFFF',
        color: ativo ? '#FFFFFF' : '#5F6B83',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        fontSize: '13px',
        transition: 'all 0.15s ease',
      }}
    >
      {children}
    </motion.button>
  );
}

const vinculacaoVazia = {
  proprietarioId: '',
  imovelId: '',
  descricaoAtualImovel: '',
  memorialDescritivoRetificacao: '',
  superiorOuInferior: 'superior',
  totalLotes: '',
  averbacoes: '',
  areasDesmembramento: '',
  listaProtocoloEntrega: '',
};

export default function VinculacaoView({ onBack }) {
  const [servicoId, setServicoId] = useState(null);
  const [servicos, setServicos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [imoveis, setImoveis] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [form, setForm] = useState(vinculacaoVazia);
  const [campoAtivo, setCampoAtivo] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState(null);

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

  const avisar = (tipo, texto) => {
    setMensagem({ tipo, texto });
    window.setTimeout(() => setMensagem(null), 2600);
  };

  const carregarServico = async (id) => {
    if (!id) {
      setServicoId(null);
      setForm(vinculacaoVazia);
      return;
    }

    try {
      const servico = await servicoService.buscarPorId(id);
      setServicoId(servico.id);
      setForm({
        proprietarioId: servico.proprietarioId || '',
        imovelId: servico.imovelId || '',
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
      avisar('erro', 'Erro ao carregar o serviço.');
    }
  };

  const handleSalvar = async () => {
    if (!servicoId) {
      avisar('erro', 'Selecione um serviço para vincular.');
      return;
    }

    setSalvando(true);
    try {
      const res = await servicoService.salvarVinculacao(servicoId, form);
      if (!res.ok) {
        avisar('erro', res.data?.error || 'Erro ao salvar vinculação.');
        return;
      }
      avisar('sucesso', 'Vinculação salva com sucesso!');
    } catch (erro) {
      console.error(erro);
      avisar('erro', 'Erro ao conectar com o servidor.');
    } finally {
      setSalvando(false);
    }
  };

  const imovelSelecionado = imoveis.find((i) => i.id === form.imovelId);
  const confrontantesDoImovel = imovelSelecionado?.confrontantes || [];
  const podeGerarDocumento = Boolean(servicoId && form.proprietarioId && form.imovelId);

  return (
    <div style={{ position: 'relative', flex: 1, minHeight: 0, background: '#F4F6FA', color: '#2D2A35', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <header
        style={{
          height: '64px',
          background: '#FFFFFF',
          borderBottom: '1px solid rgba(15, 23, 42, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          boxShadow: '0 2px 10px rgba(15, 23, 42, 0.05)',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
          <motion.button
            type="button"
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={onBack}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              border: '1px solid rgba(15, 23, 42, 0.12)',
              background: '#FFFFFF',
              color: '#54607A',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <ArrowLeft size={18} />
          </motion.button>

          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '17px', fontWeight: 800, color: '#1F2937', lineHeight: 1.1 }}>
              Vinculação
            </div>
            <div style={{ fontSize: '12px', color: '#95A0B5', marginTop: '2px' }}>
              Proprietário, imóvel e confrontantes do serviço
            </div>
          </div>
        </div>
      </header>

      {mensagem ? (
        <div
          style={{
            position: 'absolute',
            top: '76px',
            right: '24px',
            background: mensagem.tipo === 'sucesso' ? '#EAF8F3' : '#FEECEC',
            color: mensagem.tipo === 'sucesso' ? '#0F8B6B' : '#C24141',
            border: `1px solid ${mensagem.tipo === 'sucesso' ? 'rgba(16, 163, 127, 0.18)' : 'rgba(248, 113, 113, 0.18)'}`,
            borderRadius: '14px',
            padding: '10px 14px',
            boxShadow: '0 12px 30px rgba(15, 23, 42, 0.10)',
            zIndex: 40,
            fontSize: '12px',
            fontWeight: 700,
          }}
        >
          {mensagem.texto}
        </div>
      ) : null}

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', justifyContent: 'center', padding: '28px 20px' }}>
        <div style={{ width: 'min(720px, 100%)' }}>
          <div style={{ marginBottom: '16px' }}>
            <AnimatedDropdown
              label="Serviço"
              value={servicoId || ''}
              onChange={carregarServico}
              options={[
                { value: '', label: 'Selecione o serviço' },
                ...servicos.map((servico) => ({
                  value: servico.id,
                  label: `${servico.numeroServico} — ${servico.nomeCliente}`,
                })),
              ]}
              width="100%"
              searchable
              searchPlaceholder="Pesquisar serviço cadastrado"
            />
          </div>

          {servicoId ? (
            <>
              <div
                style={{
                  background: '#FFFFFF',
                  borderRadius: '18px',
                  border: '1px solid rgba(15, 23, 42, 0.08)',
                  boxShadow: '0 1px 2px rgba(16,24,40,0.04), 0 12px 32px -12px rgba(16,24,40,0.10)',
                  padding: '22px 20px',
                  marginBottom: '16px',
                }}
              >
                <div style={{ marginBottom: '18px' }}>
                  <AnimatedDropdown
                    label="Proprietário"
                    value={form.proprietarioId}
                    onChange={set('proprietarioId')}
                    options={[
                      { value: '', label: 'Selecione o cliente proprietário' },
                      ...clientes.map((cliente) => ({
                        value: cliente.id,
                        label: `${cliente.nome} — ${cliente.documento}`,
                      })),
                    ]}
                    width="100%"
                    searchable
                    searchPlaceholder="Pesquisar cliente"
                  />
                </div>

                <div style={{ marginBottom: '18px' }}>
                  <AnimatedDropdown
                    label="Imóvel"
                    value={form.imovelId}
                    onChange={set('imovelId')}
                    options={[
                      { value: '', label: 'Selecione o imóvel' },
                      ...imoveis.map((imovel) => ({
                        value: imovel.id,
                        label: `${imovel.matricula || 'Sem matrícula'} — ${imovel.proprietario?.nome || 'Sem proprietário'}`,
                      })),
                    ]}
                    width="100%"
                    searchable
                    searchPlaceholder="Pesquisar imóvel"
                  />
                </div>

                {form.imovelId ? (
                  <div style={{ marginBottom: '6px' }}>
                    <span style={labelStyle}>
                      <Users size={14} /> Confrontantes deste imóvel
                    </span>
                    {confrontantesDoImovel.length > 0 ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
                        {confrontantesDoImovel.map((c) => (
                          <div
                            key={c.id}
                            style={{
                              padding: '6px 10px',
                              borderRadius: '999px',
                              background: '#E8F0FF',
                              color: '#2D7AFD',
                              fontSize: '12px',
                              fontWeight: 700,
                            }}
                          >
                            {c.nome}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ margin: '10px 0 0', fontSize: '11px', color: '#8A94A6' }}>
                        Nenhum confrontante vinculado a este imóvel ainda — cadastre em Confrontantes ou edite o imóvel.
                      </p>
                    )}
                  </div>
                ) : null}
              </div>

              <div
                style={{
                  background: '#FFFFFF',
                  borderRadius: '18px',
                  border: '1px solid rgba(15, 23, 42, 0.08)',
                  boxShadow: '0 1px 2px rgba(16,24,40,0.04), 0 12px 32px -12px rgba(16,24,40,0.10)',
                  padding: '22px 20px',
                  marginBottom: '16px',
                }}
              >
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#5F6B83', textTransform: 'uppercase', marginBottom: '14px' }}>
                  Dados da Retificação
                </div>

                <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                  <span style={labelStyle}>Descrição Atual do Imóvel (conforme registro)</span>
                  <textarea
                    value={form.descricaoAtualImovel}
                    onChange={(event) => set('descricaoAtualImovel')(event.target.value)}
                    onFocus={() => setCampoAtivo('descricaoAtualImovel')}
                    onBlur={() => setCampoAtivo(null)}
                    placeholder="Descrição do imóvel constante na matrícula atual..."
                    rows={4}
                    style={{
                      ...baseFieldStyle,
                      ...(campoAtivo === 'descricaoAtualImovel' ? activeFieldStyle : {}),
                      height: 'auto',
                      padding: '12px 14px',
                      resize: 'vertical',
                      fontFamily: 'inherit',
                    }}
                  />
                </label>

                <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                  <span style={labelStyle}>Memorial Descritivo da Retificação</span>
                  <textarea
                    value={form.memorialDescritivoRetificacao}
                    onChange={(event) => set('memorialDescritivoRetificacao')(event.target.value)}
                    onFocus={() => setCampoAtivo('memorialDescritivoRetificacao')}
                    onBlur={() => setCampoAtivo(null)}
                    placeholder="Descrição do levantamento topográfico com as novas medidas..."
                    rows={6}
                    style={{
                      ...baseFieldStyle,
                      ...(campoAtivo === 'memorialDescritivoRetificacao' ? activeFieldStyle : {}),
                      height: 'auto',
                      padding: '12px 14px',
                      resize: 'vertical',
                      fontFamily: 'inherit',
                    }}
                  />
                </label>

                <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={labelStyle}>A área medida é Superior ou Inferior à registrada?</span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <OptionButton
                      ativo={form.superiorOuInferior === 'superior'}
                      onClick={() => set('superiorOuInferior')('superior')}
                    >
                      Superior
                    </OptionButton>
                    <OptionButton
                      ativo={form.superiorOuInferior === 'inferior'}
                      onClick={() => set('superiorOuInferior')('inferior')}
                    >
                      Inferior
                    </OptionButton>
                  </div>
                </label>
              </div>

              <div
                style={{
                  background: '#FFFFFF',
                  borderRadius: '18px',
                  border: '1px solid rgba(15, 23, 42, 0.08)',
                  boxShadow: '0 1px 2px rgba(16,24,40,0.04), 0 12px 32px -12px rgba(16,24,40,0.10)',
                  padding: '22px 20px',
                  marginBottom: '16px',
                }}
              >
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#5F6B83', textTransform: 'uppercase', marginBottom: '14px' }}>
                  Dados para Outros Documentos
                </div>

                <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                  <span style={labelStyle}>Número de Lotes (Consulta Prévia PMSBS)</span>
                  <input
                    value={form.totalLotes}
                    onChange={(event) => set('totalLotes')(event.target.value.replace(/\D/g, ''))}
                    onFocus={() => setCampoAtivo('totalLotes')}
                    onBlur={() => setCampoAtivo(null)}
                    placeholder="Ex.: 2"
                    style={{
                      ...baseFieldStyle,
                      ...(campoAtivo === 'totalLotes' ? activeFieldStyle : {}),
                    }}
                  />
                </label>

                <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                  <span style={labelStyle}>Averbações (Requerimento de Averbações RISBS)</span>
                  <textarea
                    value={form.averbacoes}
                    onChange={(event) => set('averbacoes')(event.target.value)}
                    onFocus={() => setCampoAtivo('averbacoes')}
                    onBlur={() => setCampoAtivo(null)}
                    placeholder="Lista dos documentos a averbar..."
                    rows={3}
                    style={{
                      ...baseFieldStyle,
                      ...(campoAtivo === 'averbacoes' ? activeFieldStyle : {}),
                      height: 'auto',
                      padding: '12px 14px',
                      resize: 'vertical',
                      fontFamily: 'inherit',
                    }}
                  />
                </label>

                <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                  <span style={labelStyle}>Áreas do Desmembramento (PMSBS)</span>
                  <textarea
                    value={form.areasDesmembramento}
                    onChange={(event) => set('areasDesmembramento')(event.target.value)}
                    onFocus={() => setCampoAtivo('areasDesmembramento')}
                    onBlur={() => setCampoAtivo(null)}
                    placeholder="Descrição das áreas resultantes do desmembramento..."
                    rows={3}
                    style={{
                      ...baseFieldStyle,
                      ...(campoAtivo === 'areasDesmembramento' ? activeFieldStyle : {}),
                      height: 'auto',
                      padding: '12px 14px',
                      resize: 'vertical',
                      fontFamily: 'inherit',
                    }}
                  />
                </label>

                <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={labelStyle}>Lista do Protocolo de Entrega</span>
                  <textarea
                    value={form.listaProtocoloEntrega}
                    onChange={(event) => set('listaProtocoloEntrega')(event.target.value)}
                    onFocus={() => setCampoAtivo('listaProtocoloEntrega')}
                    onBlur={() => setCampoAtivo(null)}
                    placeholder="Itens entregues ao cliente (ART, planta, memorial...)..."
                    rows={3}
                    style={{
                      ...baseFieldStyle,
                      ...(campoAtivo === 'listaProtocoloEntrega' ? activeFieldStyle : {}),
                      height: 'auto',
                      padding: '12px 14px',
                      resize: 'vertical',
                      fontFamily: 'inherit',
                    }}
                  />
                </label>
              </div>

              <motion.button
                type="button"
                onClick={handleSalvar}
                disabled={salvando}
                whileHover={{ scale: 1.01, y: -1 }}
                whileTap={{ scale: 0.99 }}
                style={{
                  width: '100%',
                  height: '46px',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #14B38B 0%, #0F9E7A 100%)',
                  cursor: salvando ? 'not-allowed' : 'pointer',
                  opacity: salvando ? 0.7 : 1,
                  fontSize: '13px',
                  fontWeight: 800,
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 10px 20px rgba(15, 163, 127, 0.22)',
                  marginBottom: '16px',
                }}
              >
                <Save size={16} /> {salvando ? 'Salvando...' : 'Salvar Vinculação'}
              </motion.button>

              <div
                style={{
                  background: '#FFFFFF',
                  borderRadius: '18px',
                  border: '1px solid rgba(15, 23, 42, 0.08)',
                  boxShadow: '0 1px 2px rgba(16,24,40,0.04), 0 12px 32px -12px rgba(16,24,40,0.10)',
                  padding: '22px 20px',
                }}
              >
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#5F6B83', textTransform: 'uppercase', marginBottom: '14px' }}>
                  Gerar Documento
                </div>

                {!podeGerarDocumento ? (
                  <p style={{ margin: 0, fontSize: '12px', color: '#8A94A6' }}>
                    Selecione e salve o proprietário e o imóvel deste serviço para liberar a geração dos documentos.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {templates.map((template) => (
                      <a
                        key={template.chave}
                        href={servicoService.urlGerarDocumento(servicoId, template.chave)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px 16px',
                          borderRadius: '12px',
                          border: '1px solid rgba(15, 23, 42, 0.10)',
                          background: '#F8FAFD',
                          color: '#1F2937',
                          textDecoration: 'none',
                          fontSize: '13px',
                          fontWeight: 700,
                        }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <FileText size={16} /> {template.nome}
                        </span>
                        <Download size={16} />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
