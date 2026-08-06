import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Briefcase, Building2, IdCard, Mail, MapPin, Phone, Save, Trash2, User, UserRound } from 'lucide-react';
import { clienteService } from '../services/clienteService';
import { formatarCEP, formatarCNPJ, formatarCPF, formatarTelefone } from '../utils/mascaras';
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

function TipoCard({ icon, titulo, descricao, onClick }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      style={{
        flex: 1,
        padding: '24px 20px',
        borderRadius: '16px',
        border: '1px solid rgba(15, 23, 42, 0.10)',
        background: '#FFFFFF',
        cursor: 'pointer',
        textAlign: 'left',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}
    >
      <div
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '10px',
          background: '#E8F0FF',
          color: '#2D7AFD',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon}
      </div>
      <div style={{ fontSize: '15px', fontWeight: 800, color: '#1F2937' }}>{titulo}</div>
      <div style={{ fontSize: '12px', color: '#7B879B', fontWeight: 600 }}>{descricao}</div>
    </motion.button>
  );
}

const clienteVazio = {
  tipo: '',
  nome: '',
  documento: '',
  rg: '',
  orgaoEmissor: '',
  representanteLegalNome: '',
  representanteLegalCpf: '',
  representanteLegalCargo: '',
  situacao: '',
  telefone: '',
  email: '',
  logradouro: '',
  municipio: '',
  cep: '',
  pastaLink: '',
  nacionalidade: '',
  estadoCivil: '',
  profissao: '',
};

export default function CadastroClienteView({ onBack }) {
  const [clienteId, setClienteId] = useState(null);
  const [form, setForm] = useState(clienteVazio);
  const [campoAtivo, setCampoAtivo] = useState(null);
  const [clientesSalvos, setClientesSalvos] = useState([]);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const lista = await clienteService.listarTodos();
        if (Array.isArray(lista)) setClientesSalvos(lista);
      } catch (erro) {
        console.error('Erro ao carregar os clientes cadastrados:', erro);
      }
    })();
  }, []);

  const set = (campo) => (valor) => setForm((atual) => ({ ...atual, [campo]: valor }));

  const limparFormulario = () => {
    setClienteId(null);
    setForm(clienteVazio);
  };

  // Escolher o tipo é um passo à parte do formulário: uma vez confirmado
  // (aqui ou ao reabrir um cliente salvo), CPF/CNPJ e os demais campos já
  // nascem certos, sem precisar de um toggle que troque o tipo no meio do
  // cadastro.
  const escolherTipo = (tipo) => setForm((atual) => ({ ...atual, tipo }));

  const carregarCliente = (id) => {
    if (!id) {
      limparFormulario();
      return;
    }

    const cliente = clientesSalvos.find((item) => item.id === id);
    if (!cliente) return;

    setClienteId(cliente.id);
    setForm({
      tipo: cliente.tipo,
      nome: cliente.nome || '',
      documento: cliente.documento || '',
      rg: cliente.rg || '',
      orgaoEmissor: cliente.orgaoEmissor || '',
      representanteLegalNome: cliente.representanteLegalNome || '',
      representanteLegalCpf: cliente.representanteLegalCpf || '',
      representanteLegalCargo: cliente.representanteLegalCargo || '',
      situacao: cliente.situacao || '',
      telefone: cliente.telefone || '',
      email: cliente.email || '',
      logradouro: cliente.logradouro || '',
      municipio: cliente.municipio || '',
      cep: cliente.cep || '',
      pastaLink: cliente.pastaLink || '',
      nacionalidade: cliente.nacionalidade || '',
      estadoCivil: cliente.estadoCivil || '',
      profissao: cliente.profissao || '',
    });
  };

  const avisar = (tipo, texto) => {
    setMensagem({ tipo, texto });
    window.setTimeout(() => setMensagem(null), 2400);
  };

  const handleSalvar = async () => {
    if (!form.nome.trim()) {
      avisar('erro', form.tipo === 'Física' ? 'Informe o nome do cliente.' : 'Informe a razão social.');
      return;
    }
    if (!form.documento.trim()) {
      avisar('erro', form.tipo === 'Física' ? 'Informe o CPF.' : 'Informe o CNPJ.');
      return;
    }
    if (form.tipo === 'Jurídica' && !form.representanteLegalNome.trim()) {
      avisar('erro', 'Informe o nome do representante legal.');
      return;
    }
    if (form.tipo === 'Jurídica' && !form.representanteLegalCpf.trim()) {
      avisar('erro', 'Informe o CPF do representante legal.');
      return;
    }

    setSalvando(true);
    try {
      const editando = Boolean(clienteId);
      const res = editando
        ? await clienteService.atualizar(clienteId, form)
        : await clienteService.cadastrar(form);

      if (!res.ok) {
        avisar('erro', res.data?.error || 'Erro ao salvar cliente.');
        return;
      }

      setClienteId(res.data.id);
      setClientesSalvos((atuais) => {
        const outros = atuais.filter((item) => item.id !== res.data.id);
        return [res.data, ...outros].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
      });
      avisar('sucesso', editando ? 'Cliente atualizado com sucesso!' : 'Cliente cadastrado com sucesso!');
    } catch (erro) {
      console.error(erro);
      avisar('erro', 'Erro ao conectar com o servidor.');
    } finally {
      setSalvando(false);
    }
  };

  const handleExcluir = async () => {
    if (!clienteId) return;
    if (!window.confirm('Excluir este cliente? Essa ação não pode ser desfeita.')) return;

    try {
      await clienteService.remover(clienteId);
      setClientesSalvos((atuais) => atuais.filter((item) => item.id !== clienteId));
      limparFormulario();
      avisar('sucesso', 'Cliente excluído.');
    } catch (erro) {
      console.error(erro);
      avisar('erro', 'Erro ao excluir cliente.');
    }
  };

  const isPF = form.tipo === 'Física';
  const tipoEscolhido = Boolean(form.tipo);

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
              Cadastro de Cliente
            </div>
            <div style={{ fontSize: '12px', color: '#95A0B5', marginTop: '2px' }}>
              {clienteId ? 'Editando cliente' : 'Novo cliente'}
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
              label="Cliente"
              value={clienteId || ''}
              onChange={carregarCliente}
              options={[
                { value: '', label: '+ Novo cliente' },
                ...clientesSalvos.map((cliente) => ({
                  value: cliente.id,
                  label: `${cliente.nome} — ${cliente.documento}`,
                })),
              ]}
              width="100%"
              searchable
              searchPlaceholder="Pesquisar cliente cadastrado"
            />
          </div>

          {!tipoEscolhido ? (
            <div
              style={{
                background: '#FFFFFF',
                borderRadius: '18px',
                border: '1px solid rgba(15, 23, 42, 0.08)',
                boxShadow: '0 1px 2px rgba(16,24,40,0.04), 0 12px 32px -12px rgba(16,24,40,0.10)',
                padding: '28px 24px',
              }}
            >
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#5F6B83', textTransform: 'uppercase', marginBottom: '14px' }}>
                Qual é o tipo do cliente?
              </div>
              <div style={{ display: 'flex', gap: '14px' }}>
                <TipoCard
                  icon={<UserRound size={20} />}
                  titulo="Pessoa Física"
                  descricao="Cadastro por CPF"
                  onClick={() => escolherTipo('Física')}
                />
                <TipoCard
                  icon={<Briefcase size={20} />}
                  titulo="Pessoa Jurídica"
                  descricao="Cadastro por CNPJ"
                  onClick={() => escolherTipo('Jurídica')}
                />
              </div>
            </div>
          ) : (
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '18px',
              border: '1px solid rgba(15, 23, 42, 0.08)',
              boxShadow: '0 1px 2px rgba(16,24,40,0.04), 0 12px 32px -12px rgba(16,24,40,0.10)',
              padding: '22px 20px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '999px',
                  background: '#E8F0FF',
                  color: '#2D7AFD',
                  fontSize: '12px',
                  fontWeight: 800,
                }}
              >
                {isPF ? <UserRound size={14} /> : <Briefcase size={14} />}
                {isPF ? 'Pessoa Física' : 'Pessoa Jurídica'}
              </div>

              {/* Trocar o tipo depois de editar um cliente existente invalidaria os
                  campos de documento (CPF vira CNPJ e vice-versa) — só faz sentido
                  oferecer a troca enquanto o cadastro ainda nem foi salvo. */}
              {!clienteId ? (
                <button
                  type="button"
                  onClick={() => escolherTipo('')}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: '#8A94A6',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  Trocar tipo
                </button>
              ) : null}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <Campo
                  label={isPF ? 'Nome Completo' : 'Razão Social'}
                  icon={<User size={14} />}
                  value={form.nome}
                  onChange={set('nome')}
                  onFocusName="nome"
                  campoAtivo={campoAtivo}
                  setCampoAtivo={setCampoAtivo}
                  placeholder={isPF ? 'Nome do cliente' : 'Nome da empresa'}
                />
              </div>

              <Campo
                label={isPF ? 'CPF' : 'CNPJ'}
                icon={<IdCard size={14} />}
                value={form.documento}
                onChange={(valor) => set('documento')(isPF ? formatarCPF(valor) : formatarCNPJ(valor))}
                onFocusName="documento"
                campoAtivo={campoAtivo}
                setCampoAtivo={setCampoAtivo}
                placeholder={isPF ? '000.000.000-00' : '00.000.000/0000-00'}
              />

              {isPF ? (
              <>
                <Campo
                  label="RG"
                  icon={<IdCard size={14} />}
                  value={form.rg}
                  onChange={set('rg')}
                  onFocusName="rg"
                  campoAtivo={campoAtivo}
                  setCampoAtivo={setCampoAtivo}
                  placeholder="RG do cliente"
                />
                <Campo
                  label="Órgão Emissor"
                  icon={<IdCard size={14} />}
                  value={form.orgaoEmissor}
                  onChange={set('orgaoEmissor')}
                  onFocusName="orgaoEmissor"
                  campoAtivo={campoAtivo}
                  setCampoAtivo={setCampoAtivo}
                  placeholder="Orgão Emissor do RG"
                />
                <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span style={labelStyle}>
                      <User size={14} /> Situação
                    </span>
                    <select
                      value={form.situacao}
                      onChange={(event) => set('situacao')(event.target.value)}
                      onFocus={() => setCampoAtivo('situacao')}
                      onBlur={() => setCampoAtivo(null)}
                      style={{
                        ...baseFieldStyle,
                        ...(campoAtivo === 'situacao' ? activeFieldStyle : {}),
                      }}
                    >
                      <option value="">Selecione</option>
                      <option value="Vivo(a)">Vivo(a)</option>
                      <option value="Falecido(a)">Falecido(a)</option>
                    </select>
                  </label>
              </>
              ) : (
                <Campo
                  label="Link da Pasta"
                  icon={<Building2 size={14} />}
                  value={form.pastaLink}
                  onChange={set('pastaLink')}
                  onFocusName="pastaLink"
                  campoAtivo={campoAtivo}
                  setCampoAtivo={setCampoAtivo}
                  placeholder="https://drive.google.com/..."
                />
              )}

              {!isPF ? (
                <>
                  <Campo
                    label="Representante legal"
                    icon={<User size={14} />}
                    value={form.representanteLegalNome}
                    onChange={set('representanteLegalNome')}
                    onFocusName="representanteLegalNome"
                    campoAtivo={campoAtivo}
                    setCampoAtivo={setCampoAtivo}
                    placeholder="Nome do representante"
                  />

                  <Campo
                    label="CPF do representante"
                    icon={<IdCard size={14} />}
                    value={form.representanteLegalCpf}
                    onChange={(valor) => set('representanteLegalCpf')(formatarCPF(valor))}
                    onFocusName="representanteLegalCpf"
                    campoAtivo={campoAtivo}
                    setCampoAtivo={setCampoAtivo}
                    placeholder="000.000.000-00"
                  />

                  <Campo
                    label="Cargo/Função"
                    icon={<Briefcase size={14} />}
                    value={form.representanteLegalCargo}
                    onChange={set('representanteLegalCargo')}
                    onFocusName="representanteLegalCargo"
                    campoAtivo={campoAtivo}
                    setCampoAtivo={setCampoAtivo}
                    placeholder="Ex.: sócio-administrador"
                  />
                </>
              ) : null}

              {isPF ? (
                <>
                  <Campo
                    label="Nacionalidade"
                    icon={<User size={14} />}
                    value={form.nacionalidade}
                    onChange={set('nacionalidade')}
                    onFocusName="nacionalidade"
                    campoAtivo={campoAtivo}
                    setCampoAtivo={setCampoAtivo}
                    placeholder="Brasileiro(a)"
                  />

                  <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span style={labelStyle}>
                      <User size={14} /> Estado Civil
                    </span>
                    <select
                      value={form.estadoCivil}
                      onChange={(event) => set('estadoCivil')(event.target.value)}
                      onFocus={() => setCampoAtivo('estadoCivil')}
                      onBlur={() => setCampoAtivo(null)}
                      style={{
                        ...baseFieldStyle,
                        ...(campoAtivo === 'estadoCivil' ? activeFieldStyle : {}),
                      }}
                    >
                      <option value="">Selecione</option>
                      <option value="solteiro(a)">Solteiro(a)</option>
                      <option value="casado(a)">Casado(a)</option>
                      <option value="divorciado(a)">Divorciado(a)</option>
                      <option value="viúvo(a)">Viúvo(a)</option>
                      <option value="em união estável">Em união estável</option>
                    </select>
                  </label>

                  <Campo
                    label="Profissão"
                    icon={<Briefcase size={14} />}
                    value={form.profissao}
                    onChange={set('profissao')}
                    onFocusName="profissao"
                    campoAtivo={campoAtivo}
                    setCampoAtivo={setCampoAtivo}
                    placeholder="Ex.: engenheiro(a)"
                  />
                </>
              ) : null}

              <Campo
                label="Telefone"
                icon={<Phone size={14} />}
                value={form.telefone}
                onChange={(valor) => set('telefone')(formatarTelefone(valor))}
                onFocusName="telefone"
                campoAtivo={campoAtivo}
                setCampoAtivo={setCampoAtivo}
                placeholder="(00) 00000-0000"
              />

              <Campo
                label="E-mail"
                icon={<Mail size={14} />}
                value={form.email}
                onChange={set('email')}
                onFocusName="email"
                campoAtivo={campoAtivo}
                setCampoAtivo={setCampoAtivo}
                placeholder={isPF ? 'cliente@email.com' : 'contato@empresa.com.br'}
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
                  placeholder={isPF ? 'Endereço residencial' : 'Endereço da sede'}
                />
              </div>

              <Campo
                label="Município / UF"
                icon={<MapPin size={14} />}
                value={form.municipio}
                onChange={set('municipio')}
                onFocusName="municipio"
                campoAtivo={campoAtivo}
                setCampoAtivo={setCampoAtivo}
                placeholder="Cidade — UF"
                list="municipios-sugeridos"
              />

              <Campo
                label="CEP"
                icon={<IdCard size={14} />}
                value={form.cep}
                onChange={(valor) => set('cep')(formatarCEP(valor))}
                onFocusName="cep"
                campoAtivo={campoAtivo}
                setCampoAtivo={setCampoAtivo}
                placeholder="00000-000"
              />

              {isPF ? null : (
                <div style={{ gridColumn: '1 / -1' }} />
              )}
            </div>

            <datalist id="municipios-sugeridos">
              <option value="Sao Bento do Sul" />
              <option value="Campo Alegre" />
              <option value="Rio Negrinho" />
              <option value="Corupa" />
            </datalist>
          </div>
          )}

          {tipoEscolhido ? (
          <div style={{ display: 'flex', gap: '12px', marginTop: '18px' }}>
            {clienteId ? (
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
              <Save size={16} /> {salvando ? 'Salvando...' : clienteId ? 'Salvar Alterações' : 'Salvar Cadastro'}
            </motion.button>
          </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
