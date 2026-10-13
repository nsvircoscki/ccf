import logoCcf from '../emissaoDocumentos/assets/logo-ccf.jpg';
import marcaDagua from '../emissaoDocumentos/assets/marca-dagua.jpg';
import { escapeHtml, nomeCompletoServico } from '../emissaoDocumentos/documentosUtils.js';

const formatarValor = (valor) => Number(valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Proposta de valores (orçamento formalizado) em A4, aberta para imprimir ou
// salvar em PDF. Antes ficava na tela OS/Contrato.
// itens: [{ nome (sigla do serviço), valor }]; total: número.
export function abrirPropostaPdf({ numero, cliente, matricula, area, municipio, itens, total, responsavel = 'Eng. Charles Costi', observacoes = '' }) {
    const linhasServicos = itens
      .map((item, index) => `
                    <tr>
                      <td class="col-item item-number">${index + 1}</td>
                      <td class="col-desc">${escapeHtml(nomeCompletoServico(item.nome))}</td>
                      <td class="col-unid item-number">1</td>
                      <td>R$ ${escapeHtml(formatarValor(item.valor))}</td>
                    </tr>`)
      .join('');
    const printWindow = window.open('', '_blank', 'width=900,height=700');

    if (!printWindow) {
      alert('Permita pop-ups no navegador para gerar o PDF.');
      return false;
    }

    printWindow.document.write(`
      <!doctype html>
      <html lang="pt-BR">
        <head>
          <meta charset="UTF-8" />
          <title>Proposta de Serviços - ${escapeHtml(cliente)}</title>
          <style>
            @page { size: A4; margin: 0; }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            html, body { height: 297mm; }
            body { background: #525659; display: flex; justify-content: center; padding: 40px 20px; font-family: Arial, sans-serif; color: #000; }
            .page-a4 { width: 210mm; height: 297mm; background: #fff url('${marcaDagua}') no-repeat center / 100% 100%; position: relative; box-shadow: 0 4px 12px rgba(0,0,0,0.4); padding: 12mm 18mm; overflow: hidden; }
            .content-wrapper { position: relative; z-index: 1; display: flex; flex-direction: column; height: 100%; }
            .doc-header { display: flex; justify-content: space-between; margin-bottom: 2mm; }
            .doc-header img { max-width: 150px; }
            .doc-header strong { font-size: 10pt; margin-top: 6mm; }
            .doc-divider { border-top: 1px solid #000; margin-bottom: 5mm; }
            .doc-info, .greeting { font-size: 11pt; margin-bottom: 5mm; line-height: 1.3; }
            .budget-table { width: 100%; border-collapse: collapse; margin-bottom: 1mm; font-size: 11pt; }
            .budget-table th { border: solid #000; border-width: 2px 0; padding: 4px 0; text-align: center; }
            .budget-table td { padding: 10px 0; text-align: center; }
            .col-item { width: 15%; text-align: center; padding-left: 5px; }
            .col-desc { width: 50%; text-align: left; }
            .col-unid { width: 15%; text-align: center; }
            .item-number { color: #b05030; font-weight: bold; }
            .total-row td { border-top: 2px solid #000; border-bottom: 3px solid #000; padding: 2px 0; font-weight: bold; }
            .observations, .closing { font-size: 10.5pt; line-height: 1.2; margin-bottom: 8mm; }
            .observations { white-space: pre-line; }
            .doc-footer { margin-top: auto; }
            .signatures { display: flex; justify-content: space-between; margin-bottom: 10mm; }
            .sig-box { width: 45%; font-size: 10pt; line-height: 1.15; border-top: 2px solid #000; padding-top: 3px; }
            .sig-box strong { display: block; margin-bottom: 3px; }
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
                <strong>${escapeHtml(numero)}</strong>
              </header>
              <div class="doc-divider"></div>

              <div class="doc-info"><strong>Para: &nbsp;&nbsp;&nbsp;${escapeHtml(cliente)}</strong></div>
              <div class="greeting">Prezado,<br>Conforme solicitado, segue abaixo proposta de valores de Prestação de Serviços:</div>

              <table class="budget-table">
                <thead>
                  <tr><th class="col-item">ITEM</th><th class="col-desc">DESCRIÇÃO</th><th class="col-unid">UNIDADE</th><th>VALOR<br>(R$)</th></tr>
                </thead>
                <tbody>${linhasServicos}
                  <tr class="total-row"><td colspan="3">TOTAL</td><td>R$ ${escapeHtml(formatarValor(total))}</td></tr>
                </tbody>
              </table>

              <section class="observations">
                <strong>Obs. (Especificações):</strong><br>
                Matrícula: ${escapeHtml(matricula)} &nbsp;|&nbsp; Área Informada: ${escapeHtml(area)} &nbsp;|&nbsp; Município/UF: ${escapeHtml(municipio)}<br>
                Responsável Técnico: ${escapeHtml(responsavel)}<br>
                ${observacoes ? escapeHtml(observacoes) : ''}
                <div style="margin-top: 15mm;">Pagamento: A combinar.<br>Validade da proposta: 10 dias.</div>
              </section>

              <div class="closing">Coloco-me à disposição para maiores esclarecimentos que se fizerem necessários.<br>Atenciosamente,</div>

              <footer class="doc-footer">
                <div class="signatures">
                  <div class="sig-box">
                    <strong>Assinatura do Cliente</strong>
                  </div>
                  <div class="sig-box" style="text-align: right;">
                    <strong>Eng. CHARLES COSTI</strong><br>CCF Consultores Ltda.<br>Eng. Florestal<br>Eng. de Segurança do Trabalho<br>Esp. em Gestão Ambiental<br>Esp. em Licenciamento Ambiental<br>Esp. em Georreferenciamento de Imóveis RL
                  </div>
                </div>
                <address class="contact-info">
                  Rua Carlos Bayerl, 214 - Progresso - CEP: 89.281-066 _ São Bento do Sul/SC<br>
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
    return true;
}
