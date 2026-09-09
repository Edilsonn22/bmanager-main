import { useEffect, useState } from "react";
import { Barcode, PackagePlus, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../api/authenticatedFetch";
import { Feedback } from "./ui/Feedback";

const inicial = { nome: "", codigo_barras: "", idCategoria: "", idFornecedor: "", precoFornecedor: "", preco: "", quantidade: "" };

export default function AdicionarProduto() {
  const navigate = useNavigate();
  const [form, setForm] = useState(inicial);
  const [categorias, setCategorias] = useState([]);
  const [fornecedores, setFornecedores] = useState([]);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const mudar = (campo) => (evento) => setForm((atual) => ({ ...atual, [campo]: evento.target.value }));

  useEffect(() => {
    let ativo = true;
    Promise.all([
      fetch(`${API_URL}/categorias`).then(async (r) => ({ ok: r.ok, data: await r.json() })),
      fetch(`${API_URL}/fornecedores`).then(async (r) => ({ ok: r.ok, data: await r.json() })),
    ]).then(([categoriasResult, fornecedoresResult]) => {
      if (!categoriasResult.ok || !categoriasResult.data.sucesso) throw new Error(categoriasResult.data.erro || "Não foi possível carregar as categorias.");
      if (!fornecedoresResult.ok || !fornecedoresResult.data.sucesso) throw new Error(fornecedoresResult.data.erro || "Não foi possível carregar os fornecedores.");
      if (ativo) { setCategorias(categoriasResult.data.categorias || []); setFornecedores(fornecedoresResult.data.fornecedores || []); }
    }).catch((error) => ativo && setErro(error.message)).finally(() => ativo && setCarregando(false));
    return () => { ativo = false; };
  }, []);

  const guardar = async (evento) => {
    evento.preventDefault(); setErro(""); setSucesso("");
    if (!form.idCategoria) return setErro("Selecione uma categoria.");
    if (!form.idFornecedor) return setErro("Selecione um fornecedor.");
    if (Number(form.precoFornecedor) <= 0 || Number(form.preco) <= 0) return setErro("Os preços devem ser maiores que zero.");
    if (!Number.isInteger(Number(form.quantidade)) || Number(form.quantidade) < 0) return setErro("A quantidade deve ser um número inteiro igual ou maior que zero.");
    setSalvando(true);
    try {
      const response = await fetch(`${API_URL}/produtos`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, nome: form.nome.trim(), codigo_barras: form.codigo_barras.trim() || null, idCategoria: Number(form.idCategoria), idFornecedor: Number(form.idFornecedor), precoFornecedor: Number(form.precoFornecedor), preco: Number(form.preco), quantidade: Number(form.quantidade) }) });
      const data = await response.json();
      if (!response.ok || !data.sucesso) throw new Error(data.erro || "Não foi possível adicionar o produto.");
      setSucesso("Produto adicionado com sucesso."); setForm(inicial);
      window.setTimeout(() => navigate("/produtos", { replace: true }), 700);
    } catch (error) { setErro(error.message); }
    finally { setSalvando(false); }
  };

  return <div className="fixed inset-0 z-[80] grid place-items-center overflow-y-auto bg-slate-950/45 p-3 sm:p-5">
    <section role="dialog" aria-modal="true" aria-labelledby="novo-produto-title" className="my-auto w-full max-w-2xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
      <header className="flex items-center justify-between border-b border-gray-200 px-5 py-4 sm:px-6"><div className="flex min-w-0 items-center gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-lg bg-indigo-50 text-indigo-600"><PackagePlus size={21}/></span><div className="min-w-0"><h1 id="novo-produto-title" className="font-bold text-gray-900">Adicionar produto</h1><p className="text-sm text-gray-500">Preencha os dados de identificação, preços e stock.</p></div></div><button type="button" onClick={() => navigate("/produtos")} aria-label="Fechar" className="ml-3 rounded-lg p-2 text-gray-500 hover:bg-gray-100"><X size={20}/></button></header>
      <form onSubmit={guardar} className="max-h-[calc(100dvh-8rem)] overflow-y-auto p-5 sm:p-6">
        <div className="mb-5 space-y-3"><Feedback tipo="erro">{erro}</Feedback><Feedback tipo="sucesso">{sucesso}</Feedback></div>
        <fieldset disabled={carregando || salvando} className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-gray-700 sm:col-span-2">Nome do produto *<input autoFocus value={form.nome} onChange={mudar("nome")} required placeholder="Ex.: Arroz 5 kg" className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"/></label>
          <label className="text-sm font-medium text-gray-700 sm:col-span-2">Código de barras <div className="relative mt-1"><Barcode className="absolute left-3 top-3 h-5 w-5 text-gray-400"/><input value={form.codigo_barras} onChange={mudar("codigo_barras")} placeholder="Leia ou digite o código" className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"/></div><small className="mt-1 block font-normal text-gray-500">Opcional. Pode usar um leitor USB para preencher este campo.</small></label>
          <label className="text-sm font-medium text-gray-700">Categoria *<select value={form.idCategoria} onChange={mudar("idCategoria")} required className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5"><option value="">Selecione uma categoria</option>{categorias.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}</select>{!carregando && !categorias.length && <small className="mt-1 block font-normal text-amber-600">Crie uma categoria antes de continuar.</small>}</label>
          <label className="text-sm font-medium text-gray-700">Fornecedor *<select value={form.idFornecedor} onChange={mudar("idFornecedor")} required className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5"><option value="">Selecione um fornecedor</option>{fornecedores.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}</select>{!carregando && !fornecedores.length && <small className="mt-1 block font-normal text-amber-600">Registe um fornecedor antes de continuar.</small>}</label>
          <label className="text-sm font-medium text-gray-700">Preço do fornecedor *<div className="relative mt-1"><input type="number" min="0.01" step="0.01" value={form.precoFornecedor} onChange={mudar("precoFornecedor")} required placeholder="0,00" className="w-full rounded-lg border border-gray-300 px-3 py-2.5 pr-14"/><span className="absolute right-3 top-3 text-xs font-semibold text-gray-400">MZN</span></div></label>
          <label className="text-sm font-medium text-gray-700">Preço de venda *<div className="relative mt-1"><input type="number" min="0.01" step="0.01" value={form.preco} onChange={mudar("preco")} required placeholder="0,00" className="w-full rounded-lg border border-gray-300 px-3 py-2.5 pr-14"/><span className="absolute right-3 top-3 text-xs font-semibold text-gray-400">MZN</span></div></label>
          <label className="text-sm font-medium text-gray-700 sm:col-span-2">Quantidade inicial *<input type="number" min="0" step="1" value={form.quantidade} onChange={mudar("quantidade")} required placeholder="0" className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5"/><small className="mt-1 block font-normal text-gray-500">Use zero se ainda não recebeu stock.</small></label>
        </fieldset>
        <footer className="mt-6 flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:justify-end"><button type="button" onClick={() => navigate("/produtos")} disabled={salvando} className="w-full rounded-lg border border-gray-300 bg-white px-5 py-2.5 font-semibold text-gray-700 hover:bg-gray-50 sm:w-auto">Cancelar</button><button type="submit" disabled={carregando || salvando || !categorias.length || !fornecedores.length} className="w-full rounded-lg bg-indigo-600 px-5 py-2.5 font-bold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto">{salvando ? "A adicionar..." : carregando ? "A carregar..." : "Adicionar produto"}</button></footer>
      </form>
    </section>
  </div>;
}
