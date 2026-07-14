import React, { useState } from 'react';
import { servicoService } from '../services/servicoService';
import { 
  ArrowLeft, 
  FolderPlus, 
  MapPin, 
  Globe, 
  Image as ImageIcon, 
  FileText, 
  Save, 
  Map, 
  Check, 
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

const TODOS_PROCESSOS = [
  "Retificação", "Desmembramento", "Unificação", "Usucapião", 
  "Alteração de Divisas", "CAR", "Certificação INCRA", "Escritura", 
  "Conferência", "Cadastral", "Locação", "Movimentação de Terra"
];

export default function CadastroServicoView() {
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState(null);

  const [form, setForm] = useState({
    numeroServico: `20260714-${Math.floor(100 + Math.random() * 900)}-TOP`,
    tipoCliente: 'PF',
    nomeCliente: '',
    contato: '',
    documento: '',
    area: '',
    unidadeArea: 'ha',
    municipio: 'São Bento do Sul',
    linhaSecaKm: '',
    rioKm: '',
    observacoes: '',
    tiposProcesso: []
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleProcessoToggle = (processo) => {
    setForm(prev => {
      const jaSelecionado = prev.tiposProcesso.includes(processo);
      const novaLista = jaSelecionado
        ? prev.tiposProcesso.filter(item => item !== processo)
        : [...prev.tiposProcesso, processo];
      return { ...prev, tiposProcesso: novaLista };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.tiposProcesso.length === 0) {
      alert("Selecione pelo menos um Tipo de Processo para este serviço.");
      return;
    }

    try {
      setLoading(true);
      const payload = {
        ...form,
        area: form.area ? parseFloat(form.area) : null,
        linhaSecaKm: form.linhaSecaKm ? parseFloat(form.linhaSecaKm) : null,
        rioKm: form.rioKm ? parseFloat(form.rioKm) : null,
      };

      await servicoService.cadastrar(payload);
      setMensagem({ tipo: 'sucesso', texto: 'Serviço cadastrado e encaminhado para orçamento técnico.' });
    } catch (error) {
      setMensagem({ tipo: 'erro', texto: 'Erro ao registrar serviço. Verifique os logs do sistema.' });
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans pb-16 text-slate-600">
      
      {/* Cabeçalho Técnico e Limpo */}
      <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button className="text-slate-500 hover:text-slate-800 hover:bg-slate-100 p-2 rounded-lg transition border border-transparent">
            <ArrowLeft size={18} />
          </button>
          <div className="h-4 w-[1px] bg-slate-200 my-auto"></div>
          <div>
            <h1 className="text-base font-bold text-slate-800 tracking-tight">Cadastro Técnico de Serviço</h1>
            <p className="text-[11px] text-slate-400">Entrada de dados topográficos e parametrização de processos</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
          <span className="text-xs font-medium text-slate-500">Fase 1: Captação & Geoprocessamento</span>
        </div>
      </header>

      {/* Alertas de Retorno (Sobebrio e sem exageros) */}
      {mensagem && (
        <div className={`max-w-[1550px] mx-auto mt-6 px-4 py-3 rounded-lg text-xs font-medium border flex items-center gap-2 ${mensagem.tipo === 'sucesso' ? 'bg-emerald-50/60 border-emerald-200 text-emerald-800' : 'bg-rose-50/60 border-rose-200 text-rose-800'}`}>
          {mensagem.tipo === 'sucesso' ? <CheckCircle2 size={16} className="text-emerald-600" /> : <AlertCircle size={16} className="text-rose-600" />}
          <span>{mensagem.texto}</span>
        </div>
      )}

      {/* Grid Principal */}
      <main className="max-w-[1550px] mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* COLUNA ESQUERDA (7 cols): Visualizador Geográfico */}
        <div className="lg:col-span-7 flex flex-col">
          <div className="bg-white p-5 rounded-xl border border-slate-200 flex-1 flex flex-col min-h-[600px] shadow-[0_1px_3px_0_rgba(0,0,0,0.02)]">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Map size={16} className="text-slate-400" />
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Projeção Geográfica</span>
              </div>
              <span className="text-[11px] font-mono bg-slate-50 text-slate-400 px-2.5 py-1 rounded border border-slate-200/60">
                Aguardando importação KML/Raster
              </span>
            </div>

            {/* Canvas do Mapa */}
            <div className="bg-slate-900/95 rounded-lg border border-slate-800 flex-1 flex flex-col items-center justify-center text-slate-400 p-6 relative overflow-hidden">
              <div className="text-center z-10 max-w-sm">
                <Map size={36} className="text-slate-600 mx-auto mb-3 stroke-[1.5]" />
                <p className="text-xs font-semibold text-slate-300 mb-1">Área de Renderização de Polígonos</p>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Conecte o arquivo vetorial (<span className="text-slate-400 font-mono">.kml</span>) ou imagem georreferenciada para projetar limites, vértices e confrontações na interface.
                </p>
              </div>
            </div>

            {/* Legenda do Sistema (Compacta e Técnica) */}
            <div className="mt-4 pt-3 border-t border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">Camadas de Referência Visual:</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-medium text-slate-600">
                <div className="flex items-center gap-2 bg-slate-50/80 px-2.5 py-1.5 rounded border border-slate-150"><span className="w-2.5 h-2.5 bg-yellow-400 rounded-sm"></span> Imóvel</div>
                <div className="flex items-center gap-2 bg-slate-50/80 px-2.5 py-1.5 rounded border border-slate-150"><span className="w-2.5 h-2.5 bg-emerald-400 rounded-sm"></span> Imóveis CCF</div>
                <div className="flex items-center gap-2 bg-slate-50/80 px-2.5 py-1.5 rounded border border-slate-150"><span className="w-2.5 h-2.5 bg-slate-200 border border-slate-400 rounded-sm"></span> CAR</div>
                <div className="flex items-center gap-2 bg-slate-50/80 px-2.5 py-1.5 rounded border border-slate-150"><span className="w-2.5 h-2.5 bg-blue-600 rounded-sm"></span> Hidrografia</div>
                <div className="flex items-center gap-2 bg-slate-50/80 px-2.5 py-1.5 rounded border border-slate-150"><span className="w-2.5 h-2.5 bg-fuchsia-500 rounded-sm"></span> SIGEF (3ª)</div>
                <div className="flex items-center gap-2 bg-slate-50/80 px-2.5 py-1.5 rounded border border-slate-150"><span className="w-2.5 h-2.5 bg-red-600 rounded-sm"></span> Ruas</div>
                <div className="flex items-center gap-2 bg-slate-50/80 px-2.5 py-1.5 rounded border border-slate-150"><span className="w-2.5 h-2.5 bg-cyan-300 rounded-sm"></span> SNCI (1ª/2ª)</div>
                <div className="flex items-center gap-2 bg-slate-50/80 px-2.5 py-1.5 rounded border border-slate-150"><span className="w-2.5 h-2.5 bg-purple-700 rounded-sm"></span> Lim. Municipal</div>
              </div>
            </div>

          </div>
        </div>

        {/* COLUNA DIREITA (5 cols): Formulário & Automações */}
        <div className="lg:col-span-5 flex flex-col">
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-slate-200 flex flex-col gap-5 shadow-[0_1px_3px_0_rgba(0,0,0,0.02)]">
            
            {/* Secção 1: Identificação e Pasta */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Código do Serviço</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  name="numeroServico" 
                  value={form.numeroServico} 
                  onChange={handleChange}
                  required
                  className="flex-1 bg-white border border-slate-300 rounded px-3 py-1.5 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-slate-500 transition"
                />
                <button 
                  type="button"
                  onClick={() => alert(`Solicitando criação de estrutura de pastas para: ${form.numeroServico}`)}
                  className="bg-slate-50 hover:bg-slate-100 text-slate-700 px-3 py-1.5 rounded text-xs font-medium transition border border-slate-300 flex items-center gap-1.5 whitespace-nowrap"
                >
                  <FolderPlus size={14} className="text-slate-500" />
                  <span>Criar Pasta</span>
                </button>
              </div>
            </div>

            {/* Secção 2: Dados do Cliente */}
            <div className="border-t border-slate-100 pt-4">
              <div className="flex items-center justify-between mb-2.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Cliente / Contratante</label>
                <div className="flex gap-3 text-xs font-medium text-slate-600">
                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input type="radio" name="tipoCliente" value="PF" checked={form.tipoCliente === 'PF'} onChange={handleChange} className="text-slate-800 focus:ring-0" /> P. Física
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input type="radio" name="tipoCliente" value="PJ" checked={form.tipoCliente === 'PJ'} onChange={handleChange} className="text-slate-800 focus:ring-0" /> P. Jurídica
                  </label>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <input 
                  type="text" 
                  name="nomeCliente" 
                  value={form.nomeCliente} 
                  onChange={handleChange}
                  placeholder="Nome do proprietário ou Razão Social..."
                  required
                  className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-slate-500 transition"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input 
                    type="text" 
                    name="contato" 
                    value={form.contato} 
                    onChange={handleChange}
                    placeholder="Contato (WhatsApp / Fone)"
                    className="bg-white border border-slate-300 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-slate-500 transition"
                  />
                  <input 
                    type="text" 
                    name="documento" 
                    value={form.documento} 
                    onChange={handleChange}
                    placeholder={form.tipoCliente === 'PF' ? 'CPF' : 'CNPJ'}
                    className="bg-white border border-slate-300 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-slate-500 transition"
                  />
                </div>
              </div>
            </div>

            {/* Secção 3: Dados Técnicos */}
            <div className="border-t border-slate-100 pt-4 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Área Medida</label>
                <div className="flex border border-slate-300 rounded overflow-hidden focus-within:border-slate-500 transition">
                  <input 
                    type="number" 
                    step="0.01"
                    name="area" 
                    value={form.area} 
                    onChange={handleChange}
                    placeholder="0.00"
                    className="w-full bg-white px-2.5 py-1.5 text-xs font-mono focus:outline-none"
                  />
                  <select 
                    name="unidadeArea" 
                    value={form.unidadeArea} 
                    onChange={handleChange}
                    className="bg-slate-50 border-l border-slate-300 px-2 py-1.5 text-xs font-bold text-slate-600 focus:outline-none cursor-pointer"
                  >
                    <option value="ha">ha</option>
                    <option value="m²">m²</option>
                    <option value="alq">alq</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Município</label>
                <select 
                  name="municipio" 
                  value={form.municipio} 
                  onChange={handleChange}
                  className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:border-slate-500 transition cursor-pointer"
                >
                  <option value="São Bento do Sul">São Bento do Sul</option>
                  <option value="Campo Alegre">Campo Alegre</option>
                  <option value="Rio Negrinho">Rio Negrinho</option>
                  <option value="Corupá">Corupá</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Perímetro: L. Seca</label>
                <div className="relative">
                  <input 
                    type="number" step="0.001" name="linhaSecaKm" value={form.linhaSecaKm} onChange={handleChange} placeholder="0.000"
                    className="w-full bg-white border border-slate-300 rounded px-2.5 py-1 text-xs font-mono pr-8 focus:outline-none focus:border-slate-500 transition"
                  />
                  <span className="absolute right-2.5 top-1.5 text-[11px] font-bold text-slate-400">km</span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Perímetro: Rio</label>
                <div className="relative">
                  <input 
                    type="number" step="0.001" name="rioKm" value={form.rioKm} onChange={handleChange} placeholder="0.000"
                    className="w-full bg-white border border-slate-300 rounded px-2.5 py-1 text-xs font-mono pr-8 focus:outline-none focus:border-slate-500 transition"
                  />
                  <span className="absolute right-2.5 top-1.5 text-[11px] font-bold text-slate-400">km</span>
                </div>
              </div>
            </div>

            {/* Secção 4: Seleção de Processos (Esteiras Técnicas) */}
            <div className="border-t border-slate-100 pt-4">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                  Esteiras do Processo <span className="text-rose-600 font-normal">*</span>
                </label>
                <span className="text-[11px] font-mono font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  {form.tiposProcesso.length} {form.tiposProcesso.length === 1 ? 'item' : 'itens'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mb-3">
                Selecione os procedimentos de engenharia e regularização que comporão este serviço.
              </p>

              <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto p-2 bg-slate-50/60 rounded border border-slate-200/80">
                {TODOS_PROCESSOS.map(processo => {
                  const checked = form.tiposProcesso.includes(processo);
                  return (
                    <div 
                      key={processo} 
                      onClick={() => handleProcessoToggle(processo)}
                      className={`flex items-center gap-2 p-2 rounded cursor-pointer text-xs transition select-none border ${
                        checked 
                          ? 'bg-white text-slate-900 border-slate-400 font-medium shadow-[0_1px_2px_0_rgba(0,0,0,0.05)]' 
                          : 'bg-transparent hover:bg-slate-100/80 text-slate-600 border-transparent'
                      }`}
                    >
                      <div className={`w-3.5 h-3.5 rounded-sm flex items-center justify-center transition border ${checked ? 'bg-slate-800 border-slate-800 text-white' : 'border-slate-300 bg-white'}`}>
                        {checked && <Check size={10} strokeWidth={3} />}
                      </div>
                      <span className="truncate">{processo}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Secção 5: Ações Técnicas e Finalização */}
            <div className="border-t border-slate-100 pt-4 flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-2">
                <button type="button" className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 py-2 px-3 rounded text-xs font-medium flex items-center justify-center gap-1.5 transition">
                  <MapPin size={14} className="text-slate-500" />
                  <span>Selecionar KML</span>
                </button>
                <button type="button" className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 py-2 px-3 rounded text-xs font-medium flex items-center justify-center gap-1.5 transition">
                  <Globe size={14} className="text-slate-500" />
                  <span>Google Earth Pro</span>
                </button>
                <button type="button" className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 py-2 px-3 rounded text-xs font-medium flex items-center justify-center gap-1.5 transition">
                  <ImageIcon size={14} className="text-slate-500" />
                  <span>Importar Imagem</span>
                </button>
                <button 
                  type="button" 
                  onClick={() => alert("Abrindo painel de notas técnicas.")}
                  className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 py-2 px-3 rounded text-xs font-medium flex items-center justify-center gap-1.5 transition"
                >
                  <FileText size={14} className="text-slate-500" />
                  <span>Observações</span>
                </button>
              </div>

              {/* Botão Salvar Principal */}
              <button 
                type="submit" 
                disabled={loading}
                className="w-full mt-1 bg-slate-800 hover:bg-slate-900 text-white py-3 rounded text-xs font-bold uppercase tracking-wider transition flex items-center justify-center gap-2 disabled:bg-slate-400 cursor-pointer shadow-sm"
              >
                <Save size={15} />
                <span>{loading ? 'Salvando Registro...' : 'Salvar Cadastro do Serviço'}</span>
              </button>
            </div>

          </form>
        </div>

      </main>
    </div>
  );
}