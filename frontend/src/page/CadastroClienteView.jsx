import React, { useEffect, useState } from 'react';
import { clienteService } from '../services/clienteService';
import { formatarCEP, formatarCNPJ, formatarCPF, formatarTelefone } from '../utils/mascaras';
import {
  Actions, Field, Icon, Reveal, SearchableSelect, SelectField, Section, Shell, Toast, useToast, C,
} from '../components/cadastros/CadastroKit.jsx';

const clienteVazio = {
  tipo: '',
  nome: '',
  documento: '',
  rg: '',
  orgaoEmissor: '',
  rgDataExpedicao: '',
  dataNascimento: '',
  representanteLegalDataNascimento: '',
  representanteLegalNome: '',
  representanteLegalCpf: '',
  representanteLegalCargo: '',
  situacao: '',
  telefone: '',
  email: '',
  logradouro: '',
  numero: '',
  bairro: '',
  cidade: '',
  estado: '',
  cep: '',
  pastaLink: '',
  nacionalidade: '',
  estadoCivil: '',
  conjugeId: '',
  profissao: '',
};

const paraOpcao = (cliente) => ({ value: cliente.id, label: cliente.nome, sub: cliente.documento });

export default function CadastroClienteView({ onBack }) {
  const accent = C.accent;
  const { toast, show } = useToast();
  const [clienteId, setClienteId] = useState(null);
  const [form, setForm] = useState(clienteVazio);
  const [clientesSalvos, setClientesSalvos] = useState([]);
  const [salvando, setSalvando] = useState(false);

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

  const buscarEnderecoPorCep = async (cepFormatado) => {
    const digitosCep = cepFormatado.replace(/\D/g, '');
    if (digitosCep.length !== 8) return;

    try {
      const resposta = await fetch(`https://viacep.com.br/ws/${digitosCep}/json/`);
      const dados = await resposta.json();
      if (dados.erro) {
        show('CEP não encontrado.', 'err');
        return;
      }

      setForm((atual) => ({
        ...atual,
        logradouro: dados.logradouro || atual.logradouro,
        bairro: dados.bairro || atual.bairro,
        cidade: dados.localidade || atual.cidade,
        estado: dados.uf || atual.estado,
      }));
    } catch (erro) {
      console.error('Erro ao buscar CEP:', erro);
    }
  };

  const limparFormulario = () => {
    setClienteId(null);
    setForm(clienteVazio);
  };

  const escolherTipo = (tipoEscolhido) => setForm((atual) => ({ ...atual, tipo: tipoEscolhido }));

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
      rgDataExpedicao: cliente.rgDataExpedicao ? cliente.rgDataExpedicao.slice(0,10) : '',
      dataNascimento: cliente.dataNascimento ? cliente.dataNascimento.slice(0,10) : '',
      representanteLegalDataNascimento: cliente.representanteLegalDataNascimento ? cliente.representanteLegalDataNascimento.slice(0,10) : '',
      representanteLegalNome: cliente.representanteLegalNome || '',
      representanteLegalCpf: cliente.representanteLegalCpf || '',
      representanteLegalCargo: cliente.representanteLegalCargo || '',
      situacao: cliente.situacao || '',
      telefone: cliente.telefone || '',
      email: cliente.email || '',
      logradouro: cliente.logradouro || '',
      numero: cliente.numero || '',
      bairro: cliente.bairro || '',
      cidade: cliente.cidade || '',
      estado: cliente.estado || '',
      cep: cliente.cep || '',
      pastaLink: cliente.pastaLink || '',
      nacionalidade: cliente.nacionalidade || '',
      estadoCivil: cliente.estadoCivil || '',
      conjugeId: (cliente.conjuge || cliente.conjugeDe)?.id || '',
      profissao: cliente.profissao || '',
    });
  };

  const handleSalvar = async () => {
    if (!form.nome.trim()) {
      show(form.tipo === 'Física' ? 'Informe o nome do cliente.' : 'Informe a razão social.', 'err');
      return;
    }

    setSalvando(true);
    try {
      const editando = Boolean(clienteId);
      const res = editando
        ? await clienteService.atualizar(clienteId, form)
        : await clienteService.cadastrar(form);

      if (!res.ok) {
        show(res.data?.error || 'Erro ao salvar cliente.', 'err');
        return;
      }

      setClienteId(res.data.id);
      setClientesSalvos((atuais) => {
        const outros = atuais.filter((item) => item.id !== res.data.id);
        return [res.data, ...outros].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
      });
      show(editando ? 'Cliente atualizado com sucesso.' : 'Cliente cadastrado com sucesso.');
    } catch (erro) {
      console.error(erro);
      show('Erro ao conectar com o servidor.', 'err');
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
      show('Cliente excluído.', 'err');
    } catch (erro) {
      console.error(erro);
      show('Erro ao excluir cliente.', 'err');
    }
  };

  const isPF = form.tipo === 'Física';
  const tipoEscolhido = Boolean(form.tipo);
  const editing = Boolean(clienteId);
  const showConjuge = form.estadoCivil === 'casado(a)' || form.estadoCivil === 'em união estável';

  return (
    <Shell
      title="Cadastro de Cliente"
      accent={accent}
      subtitle={editing ? 'Editando cliente' : tipoEscolhido ? `Novo cliente — ${isPF ? 'Pessoa Física' : 'Pessoa Jurídica'}` : 'Novo cliente'}
      onBack={onBack}
    >
      {toast && <Toast msg={toast.msg} kind={toast.kind} />}

      <div style={{ marginBottom: 18 }}>
        <SearchableSelect label="Selecionar cliente existente" icon="user" accent={accent}
          options={clientesSalvos.map(paraOpcao)} value={clienteId}
          placeholder="Buscar cliente para editar, ou preencha abaixo…"
          onChange={carregarCliente} />
      </div>

      {!tipoEscolhido && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, animation: 'fadeUp 0.3s ease both' }}>
          {[['Física', 'user', 'Pessoa Física', 'CPF, RG, estado civil, cônjuge'], ['Jurídica', 'brief', 'Pessoa Jurídica', 'CNPJ, representante legal, pasta']].map(([t, ic, tt, ds]) => (
            <button key={t} type="button" onClick={() => escolherTipo(t)} style={{
              background: '#fff', border: `1.5px solid ${C.borderSoft}`, borderRadius: 18, padding: '28px 22px',
              cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s ease', boxShadow: '0 3px 14px rgba(14,37,73,0.05)',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = accent; e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 12px 30px ${accent}22`; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.borderSoft; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 3px 14px rgba(14,37,73,0.05)'; }}>
              <div style={{
                width: 52, height: 52, borderRadius: 14, color: '#fff', marginBottom: 16,
                background: `linear-gradient(150deg, ${accent}, ${accent}cc)`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 8px 18px ${accent}3a`,
              }}>
                <Icon name={ic} size={26} />
              </div>
              <div style={{ fontFamily: '"Montserrat", sans-serif', fontWeight: 700, fontSize: 17, color: C.text }}>{tt}</div>
              <div style={{ fontFamily: '"Open Sans", sans-serif', fontSize: 13, color: C.muted, marginTop: 4 }}>{ds}</div>
            </button>
          ))}
        </div>
      )}

      {tipoEscolhido && (
        <div style={{ animation: 'fadeUp 0.3s ease both' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 7, padding: '6px 12px', borderRadius: 20,
              background: `${accent}14`, color: accent, fontFamily: '"Montserrat", sans-serif', fontWeight: 700, fontSize: 11.5,
            }}>
              <Icon name={isPF ? 'user' : 'brief'} size={14} />
              {isPF ? 'Pessoa Física' : 'Pessoa Jurídica'}
            </span>
            {!editing && (
              <button type="button" onClick={() => { escolherTipo(''); }} style={{
                background: 'none', border: 'none', cursor: 'pointer', fontFamily: '"Montserrat", sans-serif', fontWeight: 600,
                fontSize: 12, color: C.muted, textDecoration: 'underline',
              }}>trocar tipo</button>
            )}
          </div>

          <Section icon="id" title="Dados principais" accent={accent}>
            <Field label={isPF ? 'Nome completo' : 'Razão social'} icon="user" span={2}
              value={form.nome} onChange={set('nome')} placeholder={isPF ? 'Nome do cliente' : 'Nome da empresa'} />
            <Field label={isPF ? 'CPF' : 'CNPJ'} icon="id"
              value={form.documento} onChange={(v) => set('documento')(isPF ? formatarCPF(v) : formatarCNPJ(v))}
              placeholder={isPF ? '000.000.000-00' : '00.000.000/0000-00'} />
            <Field label="Telefone" icon="phone" value={form.telefone} onChange={(v) => set('telefone')(formatarTelefone(v))} placeholder="(00) 00000-0000" />
            <Field label="E-mail" icon="mail" type="email" span={2} value={form.email} onChange={set('email')} placeholder={isPF ? 'cliente@email.com' : 'contato@empresa.com.br'} />
          </Section>

          <Section icon="pin" title="Endereço" accent={accent}>
            <Field label="CEP" icon="pin" value={form.cep}
              onChange={(v) => { const formatado = formatarCEP(v); set('cep')(formatado); buscarEnderecoPorCep(formatado); }}
              placeholder="00000-000" hint="Preenche o endereço automaticamente" />
            <Field label="Bairro" icon="map" value={form.bairro} onChange={set('bairro')} placeholder="Bairro" />
            <Field label="Logradouro" icon="home" value={form.logradouro} onChange={set('logradouro')} placeholder={isPF ? 'Endereço residencial' : 'Endereço da sede'} />
            <Field label="Número" icon="hash" value={form.numero} onChange={set('numero')} placeholder="Nº" />
            <Field label="Cidade" icon="map" value={form.cidade} onChange={set('cidade')} placeholder="Cidade" />
            <Field label="Estado" icon="map" value={form.estado} onChange={set('estado')} placeholder="UF" />
          </Section>

          {isPF && (
            <Section icon="doc" title="Documentos & situação" accent={accent}>
              <Field label="Data de nascimento" icon="doc" type="date" value={form.dataNascimento} onChange={set('dataNascimento')} />
              <Field label="RG" icon="id" value={form.rg} onChange={set('rg')} placeholder="00.000.000-0" />
              <Field label = "Data de expedição do RG" icon="doc" type="date" value={form.rgDataExpedicao} onChange={set('rgDataExpedicao')} />
              <Field label="Órgão emissor" icon="doc" value={form.orgaoEmissor} onChange={set('orgaoEmissor')} placeholder="SSP/UF" />
              <Field label="Nacionalidade" icon="user" value={form.nacionalidade} onChange={set('nacionalidade')} placeholder="Brasileiro(a)" />
              <Field label="Profissão" icon="brief" value={form.profissao} onChange={set('profissao')} placeholder="Ex.: engenheiro(a)" />
              <Field label="Link da pasta (Drive)" icon="folder" span={2} value={form.pastaLink} onChange={set('pastaLink')} placeholder="https://drive.google.com/…" />
              <SelectField label="Estado civil" icon="ring" value={form.estadoCivil} onChange={set('estadoCivil')}
                options={[
                  { value: 'solteiro(a)', label: 'Solteiro(a)' },
                  { value: 'casado(a)', label: 'Casado(a)' },
                  { value: 'divorciado(a)', label: 'Divorciado(a)' },
                  { value: 'viúvo(a)', label: 'Viúvo(a)' },
                  { value: 'em união estável', label: 'Em união estável' },
                ]} />
              <SelectField label="Situação" icon="user" value={form.situacao} onChange={set('situacao')} options={['Vivo(a)', 'Falecido(a)']} />

              <div style={{ gridColumn: '1 / -1' }}>
                <Reveal open={showConjuge}>
                  <div style={{ paddingTop: 4 }}>
                    <SearchableSelect label="Cônjuge" icon="ring" accent={accent}
                      options={clientesSalvos.filter((c) => c.tipo === 'Física' && c.id !== clienteId).map(paraOpcao)}
                      value={form.conjugeId || null} onChange={(v) => set('conjugeId')(v || '')}
                      placeholder="Buscar pessoa cadastrada…" span={2} />
                  </div>
                </Reveal>
              </div>
            </Section>
          )}

          {!isPF && (
            <Section icon="brief" title="Dados da empresa" accent={accent}>
              <Field label="Link da pasta (Drive)" icon="folder" span={2} value={form.pastaLink} onChange={set('pastaLink')} placeholder="https://drive.google.com/…" />
              <div style={{ gridColumn: '1 / -1', height: 1, background: C.borderSoft, margin: '4px 0' }} />
              <Field label="Representante legal" icon="user" value={form.representanteLegalNome} onChange={set('representanteLegalNome')} placeholder="Nome do representante" />
              <Field label="CPF do representante" icon="id" value={form.representanteLegalCpf} onChange={(v) => set('representanteLegalCpf')(formatarCPF(v))} placeholder="000.000.000-00" />
              <Field label="Data de nascimento do representante" icon="doc" type="date" span={2} value={form.representanteLegalDataNascimento} onChange={set('representanteLegalDataNascimento')} />  
              <Field label="Cargo" icon="brief" span={2} value={form.representanteLegalCargo} onChange={set('representanteLegalCargo')} placeholder="Ex.: sócio-administrador" />
            </Section>
          )}

          <Actions editing={editing} accent={accent} saving={salvando}
            onSave={handleSalvar} onDelete={editing ? handleExcluir : undefined} />
        </div>
      )}
    </Shell>
  );
}
