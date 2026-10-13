import { useEffect, useState } from 'react';
import { usuarioService } from '../services/usuarioService';
import { api } from '../services/api';
import {
  Actions, ConfirmModal, Field, SelectField, Section, Shell, Switch, Toast, useToast, C, MONT, SANS,
} from '../components/cadastros/CadastroKit.jsx';

// Aparelhos com sessão do ponto ativa (token "só ponto", 60 dias): com ela o
// celular envia batidas mesmo depois que o login normal venceu. Revogar corta
// na hora — as batidas que o aparelho ainda enviar vão para a quarentena
// (aba Pontos a revisar) em vez de entrar no ponto.
function AparelhosPonto({ usuario, show, accent }) {
  const [sessoes, setSessoes] = useState(null);
  const [revogando, setRevogando] = useState(null);

  useEffect(() => {
    let ativo = true;
    api.getSessoesPonto(usuario.id).then((lista) => { if (ativo) setSessoes(lista); }).catch(() => { if (ativo) setSessoes([]); });
    return () => { ativo = false; };
  }, [usuario.id]);

  const revogar = async (sessaoId) => {
    setRevogando(sessaoId || 'todas');
    try {
      await api.revogarSessoesPonto(usuario.id, sessaoId);
      setSessoes(await api.getSessoesPonto(usuario.id));
      show(sessaoId ? 'Aparelho desconectado do ponto.' : `Todos os aparelhos de ${usuario.nome} foram desconectados do ponto.`, 'ok');
    } catch {
      show('Erro ao revogar.', 'err');
    } finally {
      setRevogando(null);
    }
  };

  const data = (iso) => (iso ? new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—');
  const aparelho = (userAgent) => {
    const ua = userAgent || '';
    if (/iPhone|iPad/i.test(ua)) return 'iPhone/iPad';
    if (/Android/i.test(ua)) return 'Android';
    if (/Windows/i.test(ua)) return 'Windows';
    if (/Mac/i.test(ua)) return 'Mac';
    return 'Aparelho';
  };

  return (
    <div style={{ marginTop: 30 }}>
      <Section icon="id" title="Aparelhos do ponto" desc="Celulares que podem enviar pontos guardados offline (válido 60 dias, renova a cada envio)" accent={accent}>
        <div style={{ gridColumn: '1 / -1', fontFamily: SANS, fontSize: 13, color: C.text }}>
          {sessoes === null && <span style={{ color: C.muted }}>Carregando…</span>}
          {sessoes?.length === 0 && <span style={{ color: C.muted }}>Nenhum aparelho conectado.</span>}
          {sessoes?.map((sessao) => (
            <div key={sessao.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 0', borderTop: `1px solid ${C.borderSoft}` }}>
              <span style={{ flex: 1 }}>
                <strong>{aparelho(sessao.userAgent)}</strong>
                <span style={{ color: C.muted, fontSize: 12 }}> · conectado em {data(sessao.criadoEm)} · último envio {data(sessao.ultimoUso)} · vale até {data(sessao.expiraEm)}</span>
              </span>
              <button type="button" disabled={Boolean(revogando)} onClick={() => revogar(sessao.id)} style={{ padding: '6px 12px', borderRadius: 8, border: `1px solid ${C.border}`, background: '#fff', color: C.label, fontFamily: MONT, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>Desconectar</button>
            </div>
          ))}
          {sessoes?.length > 1 && (
            <button type="button" disabled={Boolean(revogando)} onClick={() => revogar(null)} style={{ marginTop: 10, padding: '8px 14px', borderRadius: 8, border: '1px solid #f0d3d3', background: '#fff', color: '#8a4a4f', fontFamily: MONT, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>Desconectar todos</button>
          )}
        </div>
      </Section>
    </div>
  );
}

const formVazio = {
  nome: '',
  email: '',
  login: '',
  setor: '',
  senha: '',
  ativo: true,
  registraPonto: true,
  horista: false,
};

// Mesmos tons do Kanban, com o amarelo do ENG escurecido: aqui a cor é do
// texto da etiqueta, e amarelo claro sobre fundo claro não se lê.
const CORES_SETOR = { ENG: '#B7791F', TOPO: '#1E88E5', DES: '#43A047', CRD: '#795548', DEV: '#64748b' };

function Etiqueta({ texto, cor }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', padding: '3px 9px', borderRadius: 999,
      background: `${cor}1c`, color: cor, fontFamily: MONT, fontWeight: 700, fontSize: 10.5,
      letterSpacing: '0.04em', whiteSpace: 'nowrap',
    }}>
      {texto}
    </span>
  );
}

// "Bianca Souza" -> "bianca": primeiro nome, minúsculo, sem acento. É só uma
// sugestão ao cadastrar; o admin pode trocar.
const sugerirLogin = (nome) => String(nome || '').trim().split(/\s+/)[0]
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .toLowerCase().replace(/[^a-z0-9._-]/g, '');

// Mensalista x horista: duas caixas de marcar que se excluem (marcar uma
// desmarca a outra), no mesmo visual do CheckboxList do CadastroKit.
function EscolhaVinculo({ horista, onChange, accent }) {
  const opcoes = [
    { valor: false, rotulo: 'Mensalista' },
    { valor: true, rotulo: 'Horista' },
  ];
  return (
    <div style={{ gridColumn: '1 / -1' }}>
      <div style={{
        fontFamily: MONT, fontWeight: 600, fontSize: 10.5, color: C.label,
        letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 6,
      }}>
        Vínculo
      </div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {opcoes.map(({ valor, rotulo }) => {
          const marcado = horista === valor;
          return (
            <label key={rotulo} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderRadius: 10,
              border: `1.5px solid ${marcado ? accent : C.border}`, background: marcado ? `${accent}0d` : '#fff',
              cursor: 'pointer', transition: 'all 0.15s ease', minWidth: 150,
            }}>
              <input
                type="checkbox"
                checked={marcado}
                onChange={() => onChange(valor)}
                style={{ width: 16, height: 16, accentColor: accent, cursor: 'pointer', flexShrink: 0 }}
              />
              <span style={{ fontFamily: SANS, fontSize: 13.5, fontWeight: 600, color: C.text }}>{rotulo}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

function LinhaSwitch({ valor, onChange, rotuloSim, rotuloNao }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <Switch value={valor} onChange={onChange} />
      <span style={{ fontFamily: SANS, fontSize: 13.5, color: C.text, fontWeight: 600 }}>
        {valor ? rotuloSim : rotuloNao}
      </span>
    </div>
  );
}

export default function UsuariosView({ onBack, usuarioAtual }) {
  const accent = '#0f766e';
  const { toast, show } = useToast();

  const [usuarios, setUsuarios] = useState([]);
  const [setores, setSetores] = useState([]);
  const [selecionadoId, setSelecionadoId] = useState(null);
  const [form, setForm] = useState(formVazio);
  const [salvando, setSalvando] = useState(false);
  const [novaSenha, setNovaSenha] = useState('');
  const [definindoSenha, setDefinindoSenha] = useState(false);
  const [confirmarDesativar, setConfirmarDesativar] = useState(false);
  // Enquanto o admin não mexer no login, ele acompanha o nome digitado.
  const [loginEditado, setLoginEditado] = useState(false);

  const selecionado = usuarios.find((u) => u.id === selecionadoId) || null;
  const editando = Boolean(selecionado);
  const ehVoce = selecionado?.id === usuarioAtual?.id;

  const carregar = async () => {
    try {
      const [resUsuarios, resSetores] = await Promise.all([usuarioService.listar(), usuarioService.listarSetores()]);
      if (resUsuarios.ok) setUsuarios(resUsuarios.data);
      else show(resUsuarios.data?.error || 'Erro ao carregar usuários.', 'err');
      if (resSetores.ok) setSetores(resSetores.data);
    } catch (erro) {
      console.error(erro);
      show('Erro ao conectar com o servidor.', 'err');
    }
  };

  useEffect(() => { carregar(); }, []);

  const set = (campo) => (valor) => setForm((atual) => ({ ...atual, [campo]: valor }));

  const mudarNome = (nome) => setForm((atual) => ({
    ...atual,
    nome,
    login: !editando && !loginEditado ? sugerirLogin(nome) : atual.login,
  }));

  const mudarLogin = (login) => {
    setLoginEditado(true);
    set('login')(login.toLowerCase().replace(/\s/g, ''));
  };

  const novaPessoa = () => {
    setSelecionadoId(null);
    setForm(formVazio);
    setNovaSenha('');
    setLoginEditado(false);
  };

  const selecionar = (u) => {
    setSelecionadoId(u.id);
    setForm({
      nome: u.nome, email: u.email, login: u.login, setor: u.setor, senha: '',
      ativo: u.ativo, registraPonto: u.registraPonto, horista: u.horista,
    });
    setNovaSenha('');
  };

  const executarSalvar = async () => {
    setConfirmarDesativar(false);
    setSalvando(true);
    try {
      const { senha, ...dados } = form;
      const res = editando
        ? await usuarioService.atualizar(selecionado.id, dados)
        : await usuarioService.criar({ ...dados, senha });
      if (!res.ok) {
        show(res.data?.error || 'Erro ao salvar.', 'err');
        return;
      }
      show(editando ? 'Cadastro atualizado.' : `Pessoa cadastrada — passe o usuário "${res.data.login}" e a senha inicial pra ela.`, 'ok');
      await carregar();
      selecionar(res.data);
    } catch (erro) {
      console.error(erro);
      show('Erro ao conectar com o servidor.', 'err');
    } finally {
      setSalvando(false);
    }
  };

  const salvar = () => {
    if (!form.nome.trim()) { show('Informe o nome da pessoa.', 'err'); return; }
    if (!form.email.trim()) { show('Informe o e-mail.', 'err'); return; }
    if (!form.login.trim()) { show('Informe o usuário (login).', 'err'); return; }
    if (!form.setor) { show('Selecione o setor.', 'err'); return; }
    if (!editando && !form.senha) { show('Defina uma senha inicial.', 'err'); return; }
    // Desativar corta o acesso na hora — pede confirmação.
    if (editando && selecionado.ativo && !form.ativo) {
      setConfirmarDesativar(true);
      return;
    }
    executarSalvar();
  };

  const definirSenha = async () => {
    if (!novaSenha) { show('Digite a nova senha.', 'err'); return; }
    setDefinindoSenha(true);
    try {
      const res = await usuarioService.definirSenha(selecionado.id, novaSenha);
      if (!res.ok) {
        show(res.data?.error || 'Erro ao definir a senha.', 'err');
        return;
      }
      setNovaSenha('');
      show(`Senha de ${selecionado.nome} redefinida — passe a nova senha pra ela.`, 'ok');
      await carregar();
    } catch (erro) {
      console.error(erro);
      show('Erro ao conectar com o servidor.', 'err');
    } finally {
      setDefinindoSenha(false);
    }
  };

  const th = { padding: '10px 14px', fontFamily: MONT, fontWeight: 700, fontSize: 10.5, letterSpacing: '0.06em', textTransform: 'uppercase', color: C.muted, textAlign: 'left' };
  const td = { padding: '11px 14px', fontFamily: SANS, fontSize: 13, color: C.text, verticalAlign: 'middle' };

  return (
    <Shell title="Usuários" subtitle="Pessoas com acesso ao sistema" onBack={onBack} accent={accent}>
      {toast && <Toast msg={toast.msg} kind={toast.kind} />}

      <Section icon="user" title="Pessoas cadastradas" desc="Clique numa pessoa para editar" accent={accent}>
        <div style={{ gridColumn: '1 / -1' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <button type="button" onClick={novaPessoa} style={{
              padding: '9px 18px', borderRadius: 10, border: `1.5px solid ${accent}`,
              background: editando ? '#fff' : `${accent}12`, color: accent,
              fontFamily: MONT, fontWeight: 700, fontSize: 12.5, cursor: 'pointer',
            }}>
              + Nova pessoa
            </button>
          </div>
          <div style={{ border: `1px solid ${C.borderSoft}`, borderRadius: 12, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}>
              <thead>
                <tr style={{ background: C.bg }}>
                  <th style={th}>Nome</th>
                  <th style={th}>Usuário</th>
                  <th style={th}>E-mail</th>
                  <th style={th}>Setor</th>
                  <th style={th}>Situação</th>
                  <th style={th}>Senha</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((u) => {
                  const ativoNaLista = u.id === selecionadoId;
                  return (
                    <tr
                      key={u.id}
                      onClick={() => selecionar(u)}
                      style={{
                        borderTop: `1px solid ${C.borderSoft}`, cursor: 'pointer',
                        background: ativoNaLista ? `${accent}10` : 'transparent',
                        opacity: u.ativo ? 1 : 0.55,
                      }}
                      onMouseEnter={(e) => { if (!ativoNaLista) e.currentTarget.style.background = '#F8FAFC'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = ativoNaLista ? `${accent}10` : 'transparent'; }}
                    >
                      <td style={{ ...td, fontWeight: 700 }}>
                        {u.nome}
                        {u.id === usuarioAtual?.id && (
                          <span style={{ marginLeft: 8, fontSize: 11, color: C.muted, fontWeight: 600 }}>(você)</span>
                        )}
                      </td>
                      <td style={{ ...td, fontFamily: 'Consolas, monospace', fontSize: 12.5 }}>{u.login}</td>
                      <td style={{ ...td, color: C.muted }}>{u.email}</td>
                      <td style={td}><Etiqueta texto={u.setor} cor={CORES_SETOR[u.setor] || C.muted} /></td>
                      <td style={td}><Etiqueta texto={u.ativo ? 'Ativo' : 'Inativo'} cor={u.ativo ? C.green : C.muted} /></td>
                      <td style={{ ...td, color: C.muted, fontSize: 12 }}>{u.temSenha ? 'Definida' : 'Pendente'}</td>
                    </tr>
                  );
                })}
                {usuarios.length === 0 && (
                  <tr><td colSpan={6} style={{ ...td, textAlign: 'center', color: C.muted, padding: 20 }}>Nenhuma pessoa cadastrada.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Section>

      <Section
        icon="id"
        title={editando ? `Editando: ${selecionado.nome}` : 'Nova pessoa'}
        desc={editando ? 'Dados de acesso e do ponto' : 'Cadastre com uma senha inicial e passe pra pessoa — ela troca em "Alterar senha"'}
        accent={accent}
      >
        <Field label="Nome" icon="user" value={form.nome} onChange={mudarNome} placeholder="Nome completo" />
        <Field label="E-mail" icon="mail" value={form.email} onChange={set('email')} placeholder="nome@ccfconsultores.com.br" />
        <Field
          label="Usuário (login)" icon="id" value={form.login} onChange={mudarLogin} placeholder="ex.: bianca"
          hint="É o que a pessoa digita pra entrar. Letras sem acento, números, ponto, hífen ou _."
        />
        <SelectField label="Setor" icon="brief" value={form.setor} onChange={set('setor')} options={setores} />
        {!editando && (
          <Field label="Senha inicial" icon="id" type="password" value={form.senha} onChange={set('senha')} placeholder="Mínimo de 4 caracteres" />
        )}

        <EscolhaVinculo horista={form.horista} onChange={set('horista')} accent={accent} />

        <div style={{ gridColumn: '1 / -1', display: 'flex', flexWrap: 'wrap', gap: '14px 36px', paddingTop: 4 }}>
          <LinhaSwitch valor={form.registraPonto} onChange={set('registraPonto')} rotuloSim="Registra ponto" rotuloNao="Não registra ponto" />
          {editando && (
            <LinhaSwitch
              valor={form.ativo}
              onChange={ehVoce ? () => show('Você não pode desativar a própria conta.', 'err') : set('ativo')}
              rotuloSim="Ativo — pode entrar no sistema"
              rotuloNao="Inativo — sem acesso"
            />
          )}
        </div>
      </Section>

      <Actions
        editing={editando}
        accent={accent}
        saving={salvando}
        onSave={salvar}
        saveLabel={salvando ? 'Salvando…' : editando ? 'Salvar alterações' : 'Cadastrar pessoa'}
      />

      {/* Depois do "Salvar" de propósito: a senha tem botão próprio e não é
          gravada por ele — logo acima, dava a entender que era. */}
      {editando && (
        <div style={{ marginTop: 30 }}>
        <Section icon="id" title="Redefinir senha" desc="Para quem esqueceu a senha: defina uma temporária e passe pra pessoa" accent={accent}>
          <Field label="Nova senha" icon="id" type="password" value={novaSenha} onChange={setNovaSenha} placeholder="Mínimo de 4 caracteres" />
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button type="button" onClick={definirSenha} disabled={definindoSenha} style={{
              padding: '11px 22px', borderRadius: 10, border: `1.5px solid ${accent}`, background: '#fff',
              color: accent, fontFamily: MONT, fontWeight: 700, fontSize: 13, cursor: definindoSenha ? 'default' : 'pointer',
              opacity: definindoSenha ? 0.6 : 1,
            }}>
              {definindoSenha ? 'Salvando…' : 'Definir senha'}
            </button>
          </div>
        </Section>
        </div>
      )}

      {editando && <AparelhosPonto key={selecionado.id} usuario={selecionado} show={show} accent={accent} />}

      {confirmarDesativar && (
        <ConfirmModal
          title={`Desativar ${selecionado.nome}?`}
          message="A pessoa sai da lista do login e perde o acesso na hora. O histórico dela (Kanban, comentários, ponto) é mantido, e dá pra reativar depois."
          confirmLabel="Desativar"
          onConfirm={executarSalvar}
          onCancel={() => setConfirmarDesativar(false)}
        />
      )}
    </Shell>
  );
}
