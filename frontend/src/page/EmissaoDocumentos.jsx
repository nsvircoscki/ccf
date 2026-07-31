import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  Download,
  FileBadge,
  MapPin,
  Plus,
  UserRound,
} from 'lucide-react';

import {
  AnimatedDropdown,
  ContractModal,
  FieldIcon,
  OrcamentoDocumentoModal,
  ReadOnlyField,
} from './emissaoDocumentos/DocumentosComponents.jsx';
import { clientesDocumentos } from './emissaoDocumentos/documentosData.js';
import { cardStyle, escapeHtml, fieldBase, labelStyle } from './emissaoDocumentos/documentosUtils.js';

function EmissaoDocumentos() {
  const [modalContratoAberto, setModalContratoAberto] = useState(false);
  const [modalOrcamentoAberto, setModalOrcamentoAberto] = useState(false);
  const [clienteSelecionado, setClienteSelecionado] = useState(clientesDocumentos[0]);
  const [servicosSelecionados, setServicosSelecionados] = useState(clientesDocumentos[0].servicos);
  const [valorGlobal, setValorGlobal] = useState(clientesDocumentos[0].valorGlobal);
  const [responsavel, setResponsavel] = useState('');
  const [observacoes, setObservacoes] = useState('');

  const clientes = useMemo(() => clientesDocumentos.map((cliente) => cliente.nome), []);

  const handleClienteChange = (value) => {
    const clienteEncontrado = clientesDocumentos.find((cliente) => cliente.nome === value);
    if (!clienteEncontrado) return;
    setClienteSelecionado(clienteEncontrado);
    setServicosSelecionados(clienteEncontrado.servicos);
    setValorGlobal(clienteEncontrado.valorGlobal);
  };

  const handleClienteFieldChange = (field, value) => {
    setClienteSelecionado((current) => ({ ...current, [field]: value }));
  };

  const handleAplicarServicos = (servicos, totalFormatado) => {
    setServicosSelecionados(servicos);
    setValorGlobal(totalFormatado.replace('R$', '').trim());
    setModalOrcamentoAberto(false);
  };

  const gerarPdf = () => {
    const linhasServicos = servicosSelecionados.map((servico) => `<li>${escapeHtml(servico)}</li>`).join('');
    const printWindow = window.open('', '_blank', 'width=900,height=700');

    if (!printWindow) {
      alert('Permita pop-ups no navegador para gerar o PDF.');
      return;
    }

    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>Ordem de Servico - ${escapeHtml(clienteSelecionado.nome)}</title>
          <style>
            @page { size: A4; margin: 18mm; }
            * { box-sizing: border-box; }
            body { margin: 0; font-family: Arial, sans-serif; color: #0f172a; }
            header { border-bottom: 3px solid #0f172a; padding-bottom: 16px; margin-bottom: 24px; }
            h1 { margin: 0; font-size: 24px; text-transform: uppercase; }
            h2 { margin: 24px 0 10px; font-size: 14px; text-transform: uppercase; }
            p { margin: 5px 0; font-size: 13px; line-height: 1.5; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
            .box { border: 1px solid #cbd5e1; border-radius: 10px; padding: 12px; }
            .label { color: #64748b; font-size: 10px; font-weight: 700; text-transform: uppercase; }
            .value { margin-top: 4px; font-size: 14px; font-weight: 700; }
            ul { margin: 8px 0 0 18px; padding: 0; }
            li { margin-bottom: 5px; font-size: 13px; }
            footer { margin-top: 42px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
            .assinatura { border-top: 1px solid #0f172a; text-align: center; padding-top: 8px; font-size: 12px; }
          </style>
        </head>
        <body>
          <header>
            <h1>Ordem de Servico Tecnica</h1>
            <p>Documento gerado pela tela de Emissao de Documentos.</p>
          </header>
          <section class="grid">
            <div class="box"><div class="label">Cliente</div><div class="value">${escapeHtml(clienteSelecionado.nome)}</div></div>
            <div class="box"><div class="label">Matricula</div><div class="value">${escapeHtml(clienteSelecionado.matricula)}</div></div>
            <div class="box"><div class="label">Area Informada</div><div class="value">${escapeHtml(clienteSelecionado.area)}</div></div>
            <div class="box"><div class="label">Municipio/UF</div><div class="value">${escapeHtml(clienteSelecionado.municipio)}</div></div>
            <div class="box"><div class="label">Responsavel Tecnico</div><div class="value">${escapeHtml(responsavel || 'Nao informado')}</div></div>
            <div class="box"><div class="label">Valor Global</div><div class="value">R$ ${escapeHtml(valorGlobal)}</div></div>
          </section>
          <h2>Servicos Selecionados</h2>
          <div class="box"><ul>${linhasServicos}</ul></div>
          <h2>Observacoes</h2>
          <div class="box"><p>${escapeHtml(observacoes || 'Sem observacoes adicionais.')}</p></div>
          <footer>
            <div class="assinatura">Responsavel Tecnico</div>
            <div class="assinatura">Cliente</div>
          </footer>
          <script>window.onload = () => { window.focus(); window.print(); };</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div style={{ height: '100%', minHeight: 0, background: '#F4F6FA', padding: '28px', color: '#061733', overflowY: 'auto' }}>
      <div style={{ maxWidth: '1180px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '18px', paddingBottom: '12px', borderBottom: '1px solid #DDE5F2' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#061733', color: '#FFFFFF', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><FileBadge size={21} /></span>
            <div><h1 style={{ margin: 0, fontSize: '22px', fontWeight: 900 }}>Emissao de Documentos</h1><p style={{ margin: '3px 0 0', fontSize: '13px', color: '#64748B', fontWeight: 600 }}>Geracao visual de OS tecnica e contrato formal</p></div>
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', borderRadius: '999px', background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#047857', padding: '10px 16px', fontSize: '12px', fontWeight: 900 }}>
            <CheckCircle2 size={16} fill="#10B981" color="#10B981" /> PRONTO PARA EMISSAO DE OS
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.95fr', gap: '18px', alignItems: 'stretch' }}>
          <section style={{ ...cardStyle, padding: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '11px' }}><span style={{ width: '30px', height: '30px', borderRadius: '10px', background: '#061733', color: '#FFFFFF', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>1</span><h2 style={{ margin: 0, fontSize: '14px', textTransform: 'uppercase', letterSpacing: 0, fontWeight: 900 }}>Conferencia de Dados Minimos</h2></div>
              <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 800 }}>Cliente selecionavel</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 0.75fr', gap: '14px' }}>
              <label style={labelStyle}>Nome do Cliente<AnimatedDropdown value={clienteSelecionado.nome} onChange={handleClienteChange} options={clientes.map((cliente) => ({ value: cliente, label: cliente }))} searchable /></label>
              <label style={labelStyle}>Matricula<input value={clienteSelecionado.matricula} onChange={(event) => handleClienteFieldChange('matricula', event.target.value)} style={fieldBase} /></label>
              <label style={labelStyle}>Area Informada<input value={clienteSelecionado.area} onChange={(event) => handleClienteFieldChange('area', event.target.value)} style={fieldBase} /></label>
              <ReadOnlyField label="Municipio/UF" value={clienteSelecionado.municipio} icon={MapPin} />
            </div>

            <div style={{ marginTop: '20px', paddingTop: '18px', borderTop: '1px solid #E5EBF5' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: '#334155', fontSize: '12px', fontWeight: 900, textTransform: 'uppercase' }}><BriefcaseBusiness size={16} color="#475569" /> Servicos Selecionados</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {servicosSelecionados.map((servico) => (
                  <span key={servico} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', borderRadius: '12px', background: '#061733', color: '#FFFFFF', padding: '10px 13px', fontSize: '13px', fontWeight: 900 }}>
                    <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#22C55E' }} />{servico}
                  </span>
                ))}
                <button type="button" onClick={() => setModalOrcamentoAberto(true)} aria-label="Adicionar servico" style={{ minWidth: '46px', height: '42px', borderRadius: '12px', border: '1px dashed #94A3B8', background: '#E2E8F0', color: '#334155', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={21} strokeWidth={2.6} /></button>
              </div>
            </div>
          </section>

          <section style={{ ...cardStyle, padding: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '11px', marginBottom: '20px' }}><span style={{ width: '30px', height: '30px', borderRadius: '10px', background: '#061733', color: '#FFFFFF', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>2</span><h2 style={{ margin: 0, fontSize: '14px', textTransform: 'uppercase', letterSpacing: 0, fontWeight: 900 }}>Configuracoes Tecnicas da OS</h2></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <label style={labelStyle}>Colaborador Tecnico Responsavel<div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><FieldIcon icon={UserRound} /><select value={responsavel} onChange={(event) => setResponsavel(event.target.value)} style={fieldBase}><option value="" disabled>Selecione o colaborador...</option><option>Eng. Carlos Henrique</option><option>Tec. Mariana Souza</option><option>Topografo Rafael Lima</option></select></div></label>
              <label style={labelStyle}>Valor Global da Obra (R$)<input value={valorGlobal} onChange={(event) => setValorGlobal(event.target.value)} inputMode="decimal" style={fieldBase} /></label>
              <label style={labelStyle}>Observacoes Adicionais do Rodape<textarea value={observacoes} onChange={(event) => setObservacoes(event.target.value)} placeholder="Digite observacoes internas ou restricoes de campo..." style={{ ...fieldBase, minHeight: '104px', resize: 'vertical', padding: '13px', lineHeight: 1.45, fontWeight: 600 }} /></label>
            </div>
          </section>
        </div>

        <section style={{ ...cardStyle, padding: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '11px', marginBottom: '18px' }}><span style={{ width: '30px', height: '30px', borderRadius: '10px', background: '#061733', color: '#FFFFFF', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>3</span><h2 style={{ margin: 0, fontSize: '14px', textTransform: 'uppercase', letterSpacing: 0, fontWeight: 900 }}>Acoes de Documentos</h2></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <button type="button" onClick={gerarPdf} style={{ minHeight: '88px', borderRadius: '16px', border: 'none', background: '#0F172A', color: '#FFFFFF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', padding: '18px 20px', boxShadow: '0 14px 28px rgba(15, 23, 42, 0.18)' }}><span style={{ display: 'flex', alignItems: 'center', gap: '13px', textAlign: 'left' }}><span style={{ width: '42px', height: '42px', borderRadius: '13px', background: 'rgba(255,255,255,0.12)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><Download size={21} /></span><span><strong style={{ display: 'block', fontSize: '15px' }}>Gerar Ordem de Servico (PDF)</strong><small style={{ display: 'block', marginTop: '4px', color: '#CBD5E1', fontWeight: 700 }}>Abre a impressao para salvar em PDF</small></span></span><BadgeCheck size={24} color="#34D399" /></button>
            <button type="button" onClick={() => setModalContratoAberto(true)} style={{ minHeight: '88px', borderRadius: '16px', border: '1px solid #FDBA74', background: '#FFF7ED', color: '#9A3412', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', padding: '18px 20px' }}><span style={{ display: 'flex', alignItems: 'center', gap: '13px', textAlign: 'left' }}><span style={{ width: '42px', height: '42px', borderRadius: '13px', background: '#FFEDD5', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><Building2 size={21} /></span><span><strong style={{ display: 'block', fontSize: '15px' }}>Gerar Contrato Padrao (DOCX)</strong><small style={{ display: 'block', marginTop: '4px', color: '#C2410C', fontWeight: 800 }}>Requer validacao juridica complementar</small></span></span><AlertTriangle size={23} /></button>
          </div>
        </section>
      </div>

      {modalContratoAberto ? <ContractModal onClose={() => setModalContratoAberto(false)} /> : null}
      {modalOrcamentoAberto ? (
        <OrcamentoDocumentoModal
          cliente={clienteSelecionado}
          servicosSelecionados={servicosSelecionados}
          onClose={() => setModalOrcamentoAberto(false)}
          onConfirm={handleAplicarServicos}
          onClienteChange={handleClienteFieldChange}
        />
      ) : null}
    </div>
  );
}

export default EmissaoDocumentos;
