import React, { useEffect, useState } from 'react';
import { imovelService } from '../services/imovelService';
import { clienteService } from '../services/clienteService';
import { formatarArea } from '../utils/mascaras';
import {
  Actions, ChipList, Field, Reveal, SearchableSelect, Section, Segmented, Shell, Switch, Toast, useToast, C,
} from '../components/cadastros/CadastroKit.jsx';
import CadastroClienteView from './CadastroClienteView.jsx';

const imovelVazio = {
  proprietarioIds: [],
  cartorio: '',
  matricula: '',
  cns: '',
  incra: '',
  cib: '',
  logradouro: '',
  municipio: '',
  estado: '',
  area: '',
  descricao: '',
  tipoTitulo: 'matrícula',
  usufruto: false,
  usufrutuarioIds: [],
  comarca: '',
  zoneamento: '',
};

const paraOpcaoPessoa = (cliente) => ({ value: cliente.id, label: cliente.nome, sub: cliente.documento });
const nomesProprietarios = (imovel) => (imovel.proprietarios || []).map((p) => p.nome).join(', ') || 'Sem proprietário';
const paraOpcaoImovel = (imovel) => ({
  value: imovel.id,
  label: imovel.matricula || 'Sem matrícula',
  sub: nomesProprietarios(imovel),
});

export default function CadastroImovelView({ onBack, modal, onSaved }) {
  const accent = C.accent;
  const { toast, show } = useToast();
  const [imovelId, setImovelId] = useState(null);
  const [form, setForm] = useState(imovelVazio);
  const [imoveisSalvos, setImoveisSalvos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [salvando, setSalvando] = useState(false);
  // null | 'proprietario' | 'usufrutuario' — qual ChipList disparou o modal
  // de cadastro rápido, pra saber em qual campo entrar a pessoa criada.
  const [alvoModalPessoa, setAlvoModalPessoa] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [listaImoveis, listaClientes] = await Promise.all([
          imovelService.listarTodos(),
          clienteService.listarTodos(),
        ]);
        if (Array.isArray(listaImoveis)) setImoveisSalvos(listaImoveis);
        if (Array.isArray(listaClientes)) setClientes(listaClientes);
      } catch (erro) {
        console.error('Erro ao carregar imóveis/clientes:', erro);
      }
    })();
  }, []);

  const set = (campo) => (valor) => setForm((atual) => ({ ...atual, [campo]: valor }));

  const buscarCartorioPorCns = async (cnsDigitado) => {
    if (!cnsDigitado?.trim()) return;

    try {
      const resultado = await imovelService.buscarCartorioPorCns(cnsDigitado.trim());
      if (!resultado) return; // CNS ainda não visto antes — sem problema, preenche na mão

      setForm((atual) => ({
        ...atual,
        cartorio: resultado.cartorio || atual.cartorio,
        comarca: resultado.comarca || atual.comarca,
      }));
    } catch (erro) {
      console.error('Erro ao buscar cartório pelo CNS:', erro);
    }
  };

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
      proprietarioIds: (imovel.proprietarios || []).map((p) => p.id),
      cartorio: imovel.cartorio || '',
      matricula: imovel.matricula || '',
      cns: imovel.cns || '',
      incra: imovel.incra || '',
      cib: imovel.cib || '',
      logradouro: imovel.logradouro || '',
      municipio: imovel.municipio || '',
      estado: imovel.estado || '',
      area: imovel.area != null ? formatarArea(String(imovel.area).replace('.', ',')) : '',
      descricao: imovel.descricao || '',
      tipoTitulo: imovel.tipoTitulo || 'matrícula',
      usufruto: Boolean(imovel.usufruto),
      usufrutuarioIds: (imovel.usufrutuarios || []).map((p) => p.id),
      comarca: imovel.comarca || '',
      zoneamento: imovel.zoneamento || '',
    });
  };

  const handleSalvar = async () => {
    if (form.proprietarioIds.length === 0) {
      show('Selecione ao menos um cliente proprietário do imóvel.', 'err');
      return;
    }

    setSalvando(true);
    try {
      const editando = Boolean(imovelId);
      const res = editando
        ? await imovelService.atualizar(imovelId, form)
        : await imovelService.cadastrar(form);

      if (!res.ok) {
        show(res.data?.error || 'Erro ao salvar imóvel.', 'err');
        return;
      }

      setImovelId(res.data.id);
      setImoveisSalvos((atuais) => {
        const outros = atuais.filter((item) => item.id !== res.data.id);
        return [res.data, ...outros];
      });
      show(editando ? 'Imóvel atualizado com sucesso.' : 'Imóvel cadastrado com sucesso.');
      onSaved?.(res.data);
    } catch (erro) {
      console.error(erro);
      show('Erro ao conectar com o servidor.', 'err');
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
      show('Imóvel excluído.', 'err');
    } catch (erro) {
      console.error(erro);
      show('Erro ao excluir imóvel.', 'err');
    }
  };

  const editing = Boolean(imovelId);
  const tituloLabel = form.tipoTitulo === 'transcrição' ? 'Número da Transcrição' : 'Número da Matrícula';

  return (
    <Shell
      title="Cadastro de Imóvel"
      accent={accent}
      subtitle={editing ? 'Editando imóvel' : 'Novo imóvel'}
      onBack={onBack}
      modal={modal}
    >
      {toast && <Toast msg={toast.msg} kind={toast.kind} />}

      <div style={{ marginBottom: 18 }}>
        <SearchableSelect label="Selecionar imóvel existente" icon="home" accent={accent}
          options={imoveisSalvos.map(paraOpcaoImovel)} value={imovelId}
          placeholder="Buscar imóvel para editar, ou preencha abaixo…"
          onChange={carregarImovel} />
      </div>

      <Section icon="doc" title="Registro" desc="Dados cartorários do imóvel" accent={accent}>
        <ChipList label="Proprietários" icon="user" accent={accent} span={2}
          options={clientes.map(paraOpcaoPessoa)} values={form.proprietarioIds}
          onChange={(v) => set('proprietarioIds')(v)} placeholder="Buscar proprietário cadastrado para adicionar…"
          emptyHint="Nenhum proprietário adicionado ainda."
          onCriarNovo={() => setAlvoModalPessoa('proprietario')} criarNovoLabel="Cadastrar nova pessoa" />
        <Field label="Cartório" icon="doc" value={form.cartorio} onChange={set('cartorio')} placeholder="Cartório de registro" />
        <Field label="Comarca" icon="scale" value={form.comarca} onChange={set('comarca')} placeholder="Comarca de São Bento do Sul" />

        <div style={{ gridColumn: '1 / -1' }}>
          <label style={{ display: 'block', fontFamily: '"Montserrat", sans-serif', fontWeight: 600, fontSize: 10.5, color: C.label, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 8 }}>Tipo de título</label>
          <Segmented accent={accent} value={form.tipoTitulo}
            onChange={(v) => set('tipoTitulo')(v)}
            options={[{ value: 'matrícula', label: 'Matrícula' }, { value: 'transcrição', label: 'Transcrição' }]} />
        </div>

        <Field label={tituloLabel} icon="hash" value={form.matricula} onChange={set('matricula')} placeholder="Nº do registro" />
        <Field label="CNS" icon="hash" value={form.cns} onChange={set('cns')}
          onBlur={() => buscarCartorioPorCns(form.cns)}
          placeholder="Código Nacional de Serventia" hint="Preenche cartório/comarca se já usamos esse CNS antes" />
        <Field label="Código INCRA" icon="hash" value={form.incra} onChange={set('incra')} placeholder="000.000.000.000-0" />
        <Field label="CIB / NIRF" icon="hash" value={form.cib} onChange={set('cib')} placeholder="Cadastro do imóvel" />
      </Section>

      <Section icon="pin" title="Localização" desc="Endereço e caracterização" accent={accent}>
        <Field label="Logradouro" icon="home" span={2} value={form.logradouro} onChange={set('logradouro')} placeholder="Localização do imóvel" />
        <Field label="Município" icon="map" value={form.municipio} onChange={set('municipio')} placeholder="Cidade" />
        <Field label="Estado" icon="map" value={form.estado} onChange={set('estado')} placeholder="UF" />
        <Field label="Área registrada (m²)" icon="ruler" value={form.area} onChange={(v) => set('area')(formatarArea(v))} placeholder="0,00 m²" />
        <Field label="Zoneamento" icon="layers" value={form.zoneamento} onChange={set('zoneamento')} placeholder="Ex.: Zona Residencial 2" />
        <Field label="Descrição do imóvel" icon="doc" span={2} textarea rows={4} value={form.descricao} onChange={set('descricao')} placeholder="Características, benfeitorias, observações…" />
      </Section>

      <Section icon="user" title="Usufruto" desc="Há usufrutuário(s) sobre o imóvel?" accent={accent}>
        <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 14 }}>
          <Switch value={form.usufruto} onChange={(v) => { set('usufruto')(v); if (!v) set('usufrutuarioIds')([]); }} />
          <span style={{ fontFamily: '"Open Sans", sans-serif', fontSize: 14, color: C.text, fontWeight: 600 }}>
            {form.usufruto ? 'Sim — há usufruto' : 'Não há usufruto'}
          </span>
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <Reveal open={form.usufruto}>
            <div style={{ paddingTop: 14 }}>
              <ChipList label="Usufrutuários" icon="user" accent={accent} span={2}
                options={clientes.map(paraOpcaoPessoa)} values={form.usufrutuarioIds}
                onChange={(v) => set('usufrutuarioIds')(v)} placeholder="Buscar pessoa cadastrada para adicionar…"
                emptyHint="Nenhum usufrutuário adicionado ainda."
                onCriarNovo={() => setAlvoModalPessoa('usufrutuario')} criarNovoLabel="Cadastrar nova pessoa" />
            </div>
          </Reveal>
        </div>
      </Section>

      <Actions editing={editing} accent={accent} saving={salvando}
        onSave={handleSalvar} onDelete={editing ? handleExcluir : undefined} />

      {alvoModalPessoa && (
        <CadastroClienteView
          modal
          onBack={() => setAlvoModalPessoa(null)}
          onSaved={(novaPessoa) => {
            setClientes((atuais) => [novaPessoa, ...atuais]);
            const campo = alvoModalPessoa === 'proprietario' ? 'proprietarioIds' : 'usufrutuarioIds';
            set(campo)([...form[campo], novaPessoa.id]);
            setAlvoModalPessoa(null);
          }}
        />
      )}
    </Shell>
  );
}
