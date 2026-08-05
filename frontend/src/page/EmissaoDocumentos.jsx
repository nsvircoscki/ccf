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
} from './emissaoDocumentos/DocumentosComponents.jsx';
import { clientesDocumentos, municipiosSugeridos } from './emissaoDocumentos/documentosData.js';
import { cardStyle, escapeHtml, fieldBase, labelStyle } from './emissaoDocumentos/documentosUtils.js';
import logoCcf from './emissaoDocumentos/assets/logo-ccf.jpg';
import marcaDagua from './emissaoDocumentos/assets/marca-dagua.jpg';

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
    const numeroOrcamento = `OS-${String(clienteSelecionado.matricula || '').replace(/\D/g, '') || Date.now().toString().slice(-6)}`;
    const linhasServicos = servicosSelecionados
      .map(
        (servico, index) => `
                    <tr>
                      <td class="col-item item-number">${index + 1}</td>
                      <td class="col-desc">${escapeHtml(servico)}</td>
                      <td class="col-unid item-number">1</td>
                      <td></td>
                    </tr>`,
      )
      .join('');
    const printWindow = window.open('', '_blank', 'width=900,height=700');

    if (!printWindow) {
      alert('Permita pop-ups no navegador para gerar o PDF.');
      return;
    }

    printWindow.document.write(`
      <!doctype html>
      <html lang="pt-BR">
        <head>
          <meta charset="UTF-8" />
          <title>Ordem de Servico - ${escapeHtml(clienteSelecionado.nome)}</title>
          <style>
            @page { size: A4; margin: 0; }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            html, body { height: 297mm; }
            body { background: #525659; display: flex; justify-content: center; padding: 40px 20px; font-family: Arial, sans-serif; color: #000; }
            .page-a4 { width: 210mm; height: 297mm; background: #fff url('${marcaDagua}') no-repeat center / 100% 100%; position: relative; box-shadow: 0 4px 12px rgba(0,0,0,0.4); padding: 12mm 18mm; overflow: hidden; }
            .content-wrapper { position: relative; z-index: 1; display: flex; flex-direction: column; height: 100%; }
            .doc-header { display: flex; justify-content: space-between; margin-bottom: 6mm; }
            .doc-header img { max-width: 150px; }
            .doc-header strong { font-size: 10pt; margin-top: 6mm; }
            .doc-info, .greeting { font-size: 11pt; margin-bottom: 5mm; line-height: 1.3; }
            .budget-table { width: 100%; border-collapse: collapse; margin-bottom: 1mm; font-size: 11pt; }
            .budget-table th { border: solid #000; border-width: 2px 0; padding: 4px 0; }
            .budget-table td { padding: 10px 0; text-align: center; }
            .col-item { width: 15%; text-align: left; padding-left: 5px; }
            .col-desc { width: 50%; text-align: left; }
            .col-unid { width: 15%; }
            .item-number { color: #b05030; font-weight: bold; }
            .total-row td { border-top: 2px solid #000; border-bottom: 3px solid #000; padding: 2px 0; font-weight: bold; }
            .observations, .closing { font-size: 10.5pt; line-height: 1.2; margin-bottom: 8mm; }
            .doc-footer { margin-top: auto; }
            .signatures { display: flex; justify-content: space-between; margin-bottom: 10mm; }
            .sig-box { width: 45%; font-size: 10pt; line-height: 1.15; border-top: 2px solid #000; padding-top: 3px; }
            .contact-info { text-align: center; font-size: 9.5pt; border-top: 1px solid #000; padding-top: 10px; }
            @media print {
              body { background: transparent; padding: 0; }
              .page-a4 { box-shadow: none; width: 100%; height: 297mm; padding: 12mm 18mm; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <div class="page-a4">
            <div class="content-wrapper">
              <header class="doc-header">
                <img src="${logoCcf}" alt="Logotipo CCF" />
                <strong>${escapeHtml(numeroOrcamento)}</strong>
              </header>

              <div class="doc-info"><strong>Para: &nbsp;&nbsp;&nbsp;${escapeHtml(clienteSelecionado.nome)}</strong></div>
              <div class="greeting">Prezado,<br>Conforme solicitado, segue abaixo proposta de valores de Prestacao de Servicos:</div>

              <table class="budget-table">
                <thead>
                  <tr><th class="col-item">ITEM</th><th class="col-desc">DESCRICAO</th><th class="col-unid">UNIDADE</th><th>VALOR<br>(R$)</th></tr>
                </thead>
                <tbody>${linhasServicos}
                  <tr class="total-row"><td colspan="3">TOTAL</td><td>R$ ${escapeHtml(valorGlobal)}</td></tr>
                </tbody>
              </table>

              <section class="observations">
                <strong>Obs. (Especificacoes):</strong><br>
                Matricula: ${escapeHtml(clienteSelecionado.matricula)} &nbsp;|&nbsp; Area Informada: ${escapeHtml(clienteSelecionado.area)} &nbsp;|&nbsp; Municipio/UF: ${escapeHtml(clienteSelecionado.municipio)}<br>
                Responsavel Tecnico: ${escapeHtml(responsavel || 'Nao informado')}<br>
                ${escapeHtml(observacoes || 'Sem observacoes adicionais.')}
                <div style="margin-top: 15mm;">Pagamento: A combinar.<br>Validade da proposta: 10 dias.</div>
              </section>

              <div class="closing">Coloco-me a disposicao para maiores esclarecimentos que se fizerem necessarios.<br>Atenciosamente,</div>

              <footer class="doc-footer">
                <div class="signatures">
                  <div class="sig-box">
                    <strong>Eng. CHARLES COSTI</strong><br>CCF Consultores Ltda.<br>Eng. Florestal<br>Eng. de Seguranca do Trabalho<br>Esp. em Gestao Ambiental<br>Esp. em Licenciamento Ambiental<br>Esp. em Georreferenciamento de Imoveis RL
                  </div>
                  <div class="sig-box" style="text-align: right;">Aprovacao</div>
                </div>
                <address class="contact-info">
                  Rua Carlos Bayerl, 214 - Progresso - CEP: 89.281-066 _ Sao Bento do Sul/SC<br>
                  Fone: (47) 3633-3711 - <a href="mailto:ccfconsultores@hotmail.com" style="color: #00f;">ccfconsultores@hotmail.com</a>
                </address>
              </footer>
            </div>
          </div>
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
              <label style={labelStyle}>
                Municipio/UF
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {/* <FieldIcon icon={MapPin} /> */}
                  <input value={clienteSelecionado.municipio} list="municipios-documentos" onChange={(event) => handleClienteFieldChange('municipio', event.target.value)} style={fieldBase} />
                  <datalist id="municipios-documentos">{municipiosSugeridos.map((item) => <option key={item} value={item} />)}</datalist>
                </div>
              </label>
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
