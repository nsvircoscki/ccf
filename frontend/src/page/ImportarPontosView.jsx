import { useState } from 'react';
import * as XLSX from 'xlsx';
import { FileSpreadsheet, Upload, Download, ArrowLeft } from 'lucide-react';
import { C, MONT, SANS } from '../components/cadastros/CadastroKit.jsx';

// Quebra uma linha CSV respeitando aspas — um campo entre aspas pode conter
// vírgula sem que ela conte como separador (ex.: "Rua A, 123").
function quebrarLinhaCsv(linha) {
  const campos = [];
  let atual = '';
  let dentroDeAspas = false;

  for (let i = 0; i < linha.length; i++) {
    const c = linha[i];
    if (c === '"') {
      dentroDeAspas = !dentroDeAspas;
    } else if (c === ',' && !dentroDeAspas) {
      campos.push(atual);
      atual = '';
    } else {
      atual += c;
    }
  }
  campos.push(atual);
  return campos;
}

function parseCsv(texto) {
  const linhas = texto.split(/\r?\n/).filter((l) => l.trim() !== '');
  if (linhas.length === 0) return { colunas: [], linhas: [] };

  const colunas = quebrarLinhaCsv(linhas[0]);
  const dados = linhas.slice(1).map(quebrarLinhaCsv);
  return { colunas, linhas: dados };
}

export default function ImportarPontosView({ onBack }) {
  const accent = C.accent;
  const [nomeArquivo, setNomeArquivo] = useState('');
  const [tabela, setTabela] = useState(null);
  const [erro, setErro] = useState('');

  const lerArquivo = (file) => {
    if (!file) return;
    setErro('');
    const leitor = new FileReader();
    leitor.onload = (evento) => {
      try {
        const resultado = parseCsv(String(evento.target.result));
        if (resultado.colunas.length === 0) {
          setErro('Não foi possível ler nenhuma coluna nesse arquivo.');
          setTabela(null);
          return;
        }
        setTabela(resultado);
        setNomeArquivo(file.name);
      } catch {
        setErro('Erro ao ler o arquivo. Confira se é um .txt/.csv separado por vírgulas.');
        setTabela(null);
      }
    };
    leitor.onerror = () => setErro('Erro ao ler o arquivo.');
    leitor.readAsText(file, 'utf-8');
  };

  const baixarExcel = () => {
    if (!tabela) return;
    const aoa = [tabela.colunas, ...tabela.linhas];
    const planilha = XLSX.utils.aoa_to_sheet(aoa);
    const livro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(livro, planilha, 'Pontos');
    const nomeBase = nomeArquivo.replace(/\.[^.]+$/, '') || 'pontos';
    XLSX.writeFile(livro, `${nomeBase}.xlsx`);
  };

  return (
    <div style={{ position: 'relative', flex: 1, minHeight: 0, background: C.bg, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <header style={{
        background: '#fff', borderBottom: `1px solid ${C.border}`, height: 64, flexShrink: 0,
        display: 'flex', alignItems: 'center', gap: 16, padding: '0 28px',
      }}>
        <button onClick={onBack} aria-label="Voltar" style={{
          width: 38, height: 38, borderRadius: 10, border: `1px solid ${C.border}`, background: '#fff',
          cursor: 'pointer', color: C.label, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <ArrowLeft size={16} />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontFamily: MONT, fontWeight: 700, fontSize: 17, color: C.text, margin: 0, letterSpacing: '-0.01em' }}>Importar Pontos</h1>
          <p style={{ fontFamily: SANS, fontSize: 12.5, color: accent, margin: 0, fontWeight: 600 }}>
            Converte a exportação do levantamento (GNSS/RTK) em tabela
          </p>
        </div>
      </header>

      <main className="scroll" style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '26px 28px 60px', boxSizing: 'border-box' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 14, padding: '18px 20px',
          borderRadius: 14, border: `1.5px dashed ${C.border}`, background: C.card, marginBottom: 18,
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12, background: `${accent}14`, color: accent,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <FileSpreadsheet size={22} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: MONT, fontWeight: 700, fontSize: 13.5, color: C.text }}>
              {nomeArquivo || 'Nenhum arquivo selecionado'}
            </div>
            <div style={{ fontFamily: SANS, fontSize: 12, color: C.muted, marginTop: 2 }}>
              Arquivo .txt ou .csv exportado do receptor GNSS, separado por vírgulas
            </div>
          </div>
          <label style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 10,
            background: accent, color: '#fff', fontFamily: MONT, fontWeight: 700, fontSize: 12.5,
            cursor: 'pointer', flexShrink: 0,
          }}>
            <Upload size={15} />
            Escolher arquivo
            <input
              type="file" accept=".txt,.csv" style={{ display: 'none' }}
              onChange={(e) => lerArquivo(e.target.files?.[0])}
            />
          </label>
        </div>

        {erro && (
          <div style={{ padding: '12px 16px', borderRadius: 10, background: '#fef2f2', color: C.danger, fontFamily: SANS, fontSize: 13, marginBottom: 18 }}>
            {erro}
          </div>
        )}

        {tabela && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontFamily: SANS, fontSize: 12.5, color: C.muted }}>
                {tabela.linhas.length} ponto(s) · {tabela.colunas.length} coluna(s)
              </span>
              <button
                type="button" onClick={baixarExcel}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '9px 16px', borderRadius: 10,
                  border: `1.5px solid ${accent}`, background: '#fff', color: accent,
                  fontFamily: MONT, fontWeight: 700, fontSize: 12.5, cursor: 'pointer',
                }}
              >
                <Download size={15} />
                Baixar como Excel
              </button>
            </div>

            <div style={{ overflowX: 'auto', border: `1px solid ${C.border}`, borderRadius: 12, background: C.card }}>
              <table style={{ borderCollapse: 'collapse', fontFamily: SANS, fontSize: 12, whiteSpace: 'nowrap' }}>
                <thead>
                  <tr>
                    {tabela.colunas.map((coluna, indice) => (
                      <th key={indice} style={{
                        position: 'sticky', top: 0, background: '#F4F6FA', textAlign: 'left',
                        padding: '10px 12px', borderBottom: `1.5px solid ${C.border}`,
                        fontFamily: MONT, fontWeight: 700, fontSize: 10.5, color: C.label,
                        letterSpacing: '0.04em', textTransform: 'uppercase',
                      }}>
                        {coluna || `Col. ${indice + 1}`}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tabela.linhas.map((linha, indiceLinha) => (
                    <tr key={indiceLinha} style={{ background: indiceLinha % 2 === 0 ? '#fff' : '#FAFBFD' }}>
                      {tabela.colunas.map((_, indiceColuna) => (
                        <td key={indiceColuna} style={{ padding: '8px 12px', borderBottom: `1px solid ${C.borderSoft}`, color: C.text }}>
                          {linha[indiceColuna] ?? ''}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
