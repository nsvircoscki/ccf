import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Building2, FileText, Hash, Landmark, MapPin, Save, Trash2, Users, X } from 'lucide-react';
import { imovelService } from '../services/imovelService';
import { clienteService } from '../services/clienteService';
import { confrontanteService } from '../services/confrontanteService';
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

function Campo({ label, icon, value, onChange, onFocusName, campoAtivo, setCampoAtivo, placeholder, list }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <span style={labelStyle}>
        {icon} {label}
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onFocus={() => setCampoAtivo(onFocusName)}
        onBlur={() => setCampoAtivo(null)}
        placeholder={placeholder}
        list={list}
        style={{
          ...baseFieldStyle,
          ...(campoAtivo === onFocusName ? activeFieldStyle : {}),
        }}
      />
    </label>
  );
}

const imovelVazio = {
  proprietarioId: '',
  cartorio: '',
  matricula: '',
  cns: '',
  incra: '',
  cib: '',
  logradouro: '',
  municipio: '',
  area: '',
  descricao: '',
  tipoTitulo: 'matrícula',
  confrontanteIds: [],
  comarca: '',
  zoneamento: '',
};

export default function CadastroImovelView({ onBack }) {
  const [imovelId, setImovelId] = useState(null);
  const [form, setForm] = useState(imovelVazio);
  const [campoAtivo, setCampoAtivo] = useState(null);
  const [imoveisSalvos, setImoveisSalvos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [confrontantes, setConfrontantes] = useState([]);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [listaImoveis, listaClientes, listaConfrontantes] = await Promise.all([
          imovelService.listarTodos(),
          clienteService.listarTodos(),
          confrontanteService.listarTodos(),
        ]);
        if (Array.isArray(listaImoveis)) setImoveisSalvos(listaImoveis);
        if (Array.isArray(listaClientes)) setClientes(listaClientes);
        if (Array.isArray(listaConfrontantes)) setConfrontantes(listaConfrontantes);
      } catch (erro) {
        console.error('Erro ao carregar imóveis/clientes/confrontantes:', erro);
      }
    })();
  }, []);

  const set = (campo) => (valor) => setForm((atual) => ({ ...atual, [campo]: valor }));

  const limparFormulario = () => {
    setImovelId(null);
    setForm(imovelVazio);
  };

  const carregarImovel = (id) => {
    if (!id) {
      limparFormulario();
      return;
    }

    const imovel = imoveisSalvos.find((item) => item.id === id);
    if (!imovel) return;

    setImovelId(imovel.id);
    setForm({
      proprietarioId: imovel.proprietarioId || '',
      cartorio: imovel.cartorio || '',
      matricula: imovel.matricula || '',
      cns: imovel.cns || '',
      incra: imovel.incra || '',
      cib: imovel.cib || '',
      logradouro: imovel.logradouro || '',
      municipio: imovel.municipio || '',
      area: imovel.area != null ? String(imovel.area).replace('.', ',') : '',
      descricao: imovel.descricao || '',
      tipoTitulo: imovel.tipoTitulo || 'matrícula',
      confrontanteIds: (imovel.confrontantes || []).map((c) => c.id),
      comarca: imovel.comarca || '',
      zoneamento: imovel.zoneamento || '',
    });
  };

  const avisar = (tipo, texto) => {
    setMensagem({ tipo, texto });
    window.setTimeout(() => setMensagem(null), 2400);
  };

  const handleSalvar = async () => {
    if (!form.proprietarioId) {
      avisar('erro', 'Selecione o cliente proprietário do imóvel.');
      return;
    }

    setSalvando(true);
    try {
      const editando = Boolean(imovelId);
      const res = editando
        ? await imovelService.atualizar(imovelId, form)
        : await imovelService.cadastrar(form);

      if (!res.ok) {
        avisar('erro', res.data?.error || 'Erro ao salvar imóvel.');
        return;
      }

      setImovelId(res.data.id);
      setImoveisSalvos((atuais) => {
        const outros = atuais.filter((item) => item.id !== res.data.id);
        return [res.data, ...outros];
      });
      avisar('sucesso', editando ? 'Imóvel atualizado com sucesso!' : 'Imóvel cadastrado com sucesso!');
    } catch (erro) {
      console.error(erro);
      avisar('erro', 'Erro ao conectar com o servidor.');
    } finally {
      setSalvando(false);
    }
  };

  const handleExcluir = async () => {
    if (!imovelId) return;
    if (!window.confirm('Excluir este imóvel? Essa ação não pode ser desfeita.')) return;

    try {
      await imovelService.remover(imovelId);
      setImoveisSalvos((atuais) => atuais.filter((item) => item.id !== imovelId));
      limparFormulario();
      avisar('sucesso', 'Imóvel excluído.');
    } catch (erro) {
      console.error(erro);
      avisar('erro', 'Erro ao excluir imóvel.');
    }
  };

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
              Cadastro de Imóvel
            </div>
            <div style={{ fontSize: '12px', color: '#95A0B5', marginTop: '2px' }}>
              {imovelId ? 'Editando imóvel' : 'Novo imóvel'}
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
              label="Imóvel"
              value={imovelId || ''}
              onChange={carregarImovel}
              options={[
                { value: '', label: '+ Novo imóvel' },
                ...imoveisSalvos.map((imovel) => ({
                  value: imovel.id,
                  label: `${imovel.matricula || 'Sem matrícula'} — ${imovel.proprietario?.nome || 'Sem proprietário'}`,
                })),
              ]}
              width="100%"
              searchable
              searchPlaceholder="Pesquisar imóvel cadastrado"
            />
          </div>

          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '18px',
              border: '1px solid rgba(15, 23, 42, 0.08)',
              boxShadow: '0 1px 2px rgba(16,24,40,0.04), 0 12px 32px -12px rgba(16,24,40,0.10)',
              padding: '22px 20px',
            }}
          >
            <div style={{ marginBottom: '18px' }}>
              <AnimatedDropdown
                label="Cliente Proprietário"
                value={form.proprietarioId}
                onChange={set('proprietarioId')}
                options={[
                  { value: '', label: 'Selecione o proprietário' },
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <Campo
                label="Cartório"
                icon={<Landmark size={14} />}
                value={form.cartorio}
                onChange={set('cartorio')}
                onFocusName="cartorio"
                campoAtivo={campoAtivo}
                setCampoAtivo={setCampoAtivo}
                placeholder="Cartório de registro"
              />

              <Campo
                label="Comarca"
                icon={<Landmark size={14} />}
                value={form.comarca}
                onChange={set('comarca')}
                onFocusName="comarca"
                campoAtivo={campoAtivo}
                setCampoAtivo={setCampoAtivo}
                placeholder="Comarca de São Bento do Sul"
              />

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={labelStyle}>Tipo de Título</span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <OptionButton
                      ativo={form.tipoTitulo === 'matrícula'}
                      onClick={() => set('tipoTitulo')('matrícula')}
                    >
                      Matrícula
                    </OptionButton>
                    <OptionButton
                      ativo={form.tipoTitulo === 'transcrição'}
                      onClick={() => set('tipoTitulo')('transcrição')}
                    >
                      Transcrição
                    </OptionButton>
                  </div>
                </label>
              </div>

              <Campo
                label={form.tipoTitulo === 'transcrição' ? 'Número da Transcrição' : 'Número da Matrícula'}
                icon={<Hash size={14} />}
                value={form.matricula}
                onChange={set('matricula')}
                onFocusName="matricula"
                campoAtivo={campoAtivo}
                setCampoAtivo={setCampoAtivo}
                placeholder="Matrícula do imóvel"
              />

              <Campo
                label="CNS"
                icon={<Hash size={14} />}
                value={form.cns}
                onChange={set('cns')}
                onFocusName="cns"
                campoAtivo={campoAtivo}
                setCampoAtivo={setCampoAtivo}
                placeholder="Código CNS"
              />

              <Campo
                label="Código INCRA"
                icon={<Hash size={14} />}
                value={form.incra}
                onChange={set('incra')}
                onFocusName="incra"
                campoAtivo={campoAtivo}
                setCampoAtivo={setCampoAtivo}
                placeholder="900.000.000.000-0"
              />

              <Campo
                label="CIB / NIRF"
                icon={<Hash size={14} />}
                value={form.cib}
                onChange={set('cib')}
                onFocusName="cib"
                campoAtivo={campoAtivo}
                setCampoAtivo={setCampoAtivo}
                placeholder="Cadastro do imóvel"
              />

              <div style={{ gridColumn: '1 / -1' }}>
                <Campo
                  label="Logradouro"
                  icon={<MapPin size={14} />}
                  value={form.logradouro}
                  onChange={set('logradouro')}
                  onFocusName="logradouro"
                  campoAtivo={campoAtivo}
                  setCampoAtivo={setCampoAtivo}
                  placeholder="Localização do imóvel"
                />
              </div>

              <Campo
                label="Município / UF"
                icon={<Building2 size={14} />}
                value={form.municipio}
                onChange={set('municipio')}
                onFocusName="municipio"
                campoAtivo={campoAtivo}
                setCampoAtivo={setCampoAtivo}
                placeholder="Cidade — UF"
                list="municipios-sugeridos-imovel"
              />

              <Campo
                label="Área Registrada (ha)"
                icon={<MapPin size={14} />}
                value={form.area}
                onChange={set('area')}
                onFocusName="area"
                campoAtivo={campoAtivo}
                setCampoAtivo={setCampoAtivo}
                placeholder="0,00"
              />

              <Campo
                label="Zoneamento"
                icon={<Building2 size={14} />}
                value={form.zoneamento}
                onChange={set('zoneamento')}
                onFocusName="zoneamento"
                campoAtivo={campoAtivo}
                setCampoAtivo={setCampoAtivo}
                placeholder="Ex.: Zona Residencial 2"
              />

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={labelStyle}>
                    <FileText size={14} /> Descrição do Imóvel
                  </span>
                  <textarea
                    value={form.descricao}
                    onChange={(event) => set('descricao')(event.target.value)}
                    onFocus={() => setCampoAtivo('descricao')}
                    onBlur={() => setCampoAtivo(null)}
                    placeholder="Características, benfeitorias, observações..."
                    rows={4}
                    style={{
                      ...baseFieldStyle,
                      ...(campoAtivo === 'descricao' ? activeFieldStyle : {}),
                      height: 'auto',
                      padding: '12px 14px',
                      resize: 'vertical',
                      fontFamily: 'inherit',
                    }}
                  />
                </label>
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={labelStyle}>
                    <Users size={14} /> Confrontantes
                  </span>
                  <AnimatedDropdown
                    label="Adicionar"
                    value=""
                    onChange={(id) => {
                      if (!id || form.confrontanteIds.includes(id)) return;
                      set('confrontanteIds')([...form.confrontanteIds, id]);
                    }}
                    options={[
                      { value: '', label: 'Selecione um confrontante' },
                      ...confrontantes
                        .filter((c) => !form.confrontanteIds.includes(c.id))
                        .map((c) => ({ value: c.id, label: `${c.nome}${c.documento ? ` — ${c.documento}` : ''}` })),
                    ]}
                    width="100%"
                    searchable
                    searchPlaceholder="Pesquisar confrontante"
                  />
                </label>

                {form.confrontanteIds.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
                    {form.confrontanteIds.map((id) => {
                      const confrontante = confrontantes.find((c) => c.id === id);
                      return (
                        <div
                          key={id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 10px',
                            borderRadius: '999px',
                            background: '#E8F0FF',
                            color: '#2D7AFD',
                            fontSize: '12px',
                            fontWeight: 700,
                          }}
                        >
                          {confrontante?.nome || 'Confrontante'}
                          <button
                            type="button"
                            onClick={() => set('confrontanteIds')(form.confrontanteIds.filter((cid) => cid !== id))}
                            style={{
                              border: 'none',
                              background: 'transparent',
                              color: '#2D7AFD',
                              cursor: 'pointer',
                              display: 'flex',
                              padding: 0,
                            }}
                          >
                            <X size={13} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p style={{ margin: '10px 0 0', fontSize: '11px', color: '#8A94A6' }}>
                    Nenhum confrontante vinculado a este imóvel ainda.
                  </p>
                )}
              </div>
            </div>

            <datalist id="municipios-sugeridos-imovel">
              <option value="Sao Bento do Sul" />
              <option value="Campo Alegre" />
              <option value="Rio Negrinho" />
              <option value="Corupa" />
            </datalist>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '18px' }}>
            {imovelId ? (
              <motion.button
                type="button"
                onClick={handleExcluir}
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  height: '46px',
                  padding: '0 20px',
                  borderRadius: '12px',
                  border: '1px solid rgba(220, 38, 38, 0.25)',
                  background: '#FFFFFF',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 800,
                  color: '#DC2626',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <Trash2 size={16} /> Excluir
              </motion.button>
            ) : null}

            <motion.button
              type="button"
              onClick={handleSalvar}
              disabled={salvando}
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              style={{
                flex: 1,
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
              }}
            >
              <Save size={16} /> {salvando ? 'Salvando...' : imovelId ? 'Salvar Alterações' : 'Salvar Cadastro'}
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}
