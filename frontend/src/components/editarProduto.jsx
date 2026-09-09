import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { X } from "lucide-react";
import { API_URL } from "../api/authenticatedFetch";

const formularioInicial = {
  nome: "",
  idCategoria: "",
  precoFornecedor: "",
  preco: "",
  idFornecedor: "",
  quantidade: "",
  codigo_barras: "",
};

export default function EditarProduto() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(formularioInicial);
  const [categorias, setCategorias] = useState([]);
  const [fornecedores, setFornecedores] = useState([]);
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    let ativo = true;

    const carregar = async () => {
      try {
        const [produtoResponse, categoriasResponse, fornecedoresResponse] = await Promise.all([
          fetch(`${API_URL}/produtos/${id}`),
          fetch(`${API_URL}/categorias`),
          fetch(`${API_URL}/fornecedores`),
        ]);
        const [produtoData, categoriasData, fornecedoresData] = await Promise.all([
          produtoResponse.json(),
          categoriasResponse.json(),
          fornecedoresResponse.json(),
        ]);

        if (!produtoResponse.ok) throw new Error(produtoData.erro || "Produto não encontrado.");
        if (!categoriasResponse.ok) throw new Error(categoriasData.erro || "Não foi possível carregar as categorias.");
        if (!fornecedoresResponse.ok) throw new Error(fornecedoresData.erro || "Não foi possível carregar os fornecedores.");
        if (!ativo) return;

        const produto = produtoData.produto;
        setForm({
          nome: produto.nome || "",
          idCategoria: String(produto.idCategoria ?? ""),
          precoFornecedor: String(produto.precoFornecedor ?? ""),
          preco: String(produto.preco ?? ""),
          idFornecedor: String(produto.idFornecedor ?? ""),
          quantidade: String(produto.quantidade ?? ""),
          codigo_barras: produto.codigo_barras || "",
        });
        setCategorias(categoriasData.categorias || []);
        setFornecedores(fornecedoresData.fornecedores || []);
      } catch (error) {
        if (ativo) setErro(error.message);
      } finally {
        if (ativo) setLoading(false);
      }
    };

    carregar();
    return () => { ativo = false; };
  }, [id]);

  const mudar = (campo) => (event) => {
    setForm((atual) => ({ ...atual, [campo]: event.target.value }));
  };

  const guardar = async (event) => {
    event.preventDefault();
    setErro("");

    if (!form.nome.trim()) return setErro("Informe o nome do produto.");
    if (!form.idCategoria || !form.idFornecedor) return setErro("Selecione a categoria e o fornecedor.");
    if (Number(form.precoFornecedor) <= 0 || Number(form.preco) <= 0) return setErro("Os preços devem ser maiores que zero.");
    if (!Number.isInteger(Number(form.quantidade)) || Number(form.quantidade) < 0) return setErro("A quantidade deve ser um número inteiro igual ou maior que zero.");

    setSalvando(true);
    try {
      const response = await fetch(`${API_URL}/produtos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: form.nome.trim(),
          idCategoria: Number(form.idCategoria),
          precoFornecedor: Number(form.precoFornecedor),
          preco: Number(form.preco),
          idFornecedor: Number(form.idFornecedor),
          quantidade: Number(form.quantidade),
          codigo_barras: form.codigo_barras.trim() || null,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.erro || "Não foi possível atualizar o produto.");
      navigate("/produtos", { replace: true });
    } catch (error) {
      setErro(error.message);
    } finally {
      setSalvando(false);
    }
  };

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
    <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-xl">
      <div className="flex items-center justify-between border-b border-gray-200 p-6">
        <div><h2 className="font-bold text-gray-900">Editar produto</h2><p className="text-sm text-gray-500">Atualize os dados do produto.</p></div>
        <button type="button" aria-label="Fechar" onClick={() => navigate("/produtos")} className="rounded-lg p-2 hover:bg-gray-100"><X className="h-5 w-5" /></button>
      </div>

      <form className="space-y-5 p-6" onSubmit={guardar}>
        {erro && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{erro}</p>}
        {loading ? <p className="py-6 text-center text-gray-500">A carregar produto...</p> : <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="block text-sm font-medium text-gray-700 md:col-span-2">Nome do produto *<input value={form.nome} onChange={mudar("nome")} required className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500" /></label>
          <label className="block text-sm font-medium text-gray-700 md:col-span-2">Código de barras<input value={form.codigo_barras} onChange={mudar("codigo_barras")} placeholder="Leia ou digite o código" className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2" /></label>
          <label className="block text-sm font-medium text-gray-700">Categoria *<select value={form.idCategoria} onChange={mudar("idCategoria")} required className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500"><option value="">Selecione</option>{categorias.map((categoria) => <option key={categoria.id} value={categoria.id}>{categoria.nome}</option>)}</select></label>
          <label className="block text-sm font-medium text-gray-700">Fornecedor *<select value={form.idFornecedor} onChange={mudar("idFornecedor")} required className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500"><option value="">Selecione</option>{fornecedores.map((fornecedor) => <option key={fornecedor.id} value={fornecedor.id}>{fornecedor.nome}</option>)}</select></label>
          <label className="block text-sm font-medium text-gray-700">Preço do fornecedor *<input type="number" min="0.01" step="0.01" value={form.precoFornecedor} onChange={mudar("precoFornecedor")} required className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500" /></label>
          <label className="block text-sm font-medium text-gray-700">Preço de venda *<input type="number" min="0.01" step="0.01" value={form.preco} onChange={mudar("preco")} required className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500" /></label>
          <label className="block text-sm font-medium text-gray-700 md:col-span-2">Quantidade *<input type="number" min="0" step="1" value={form.quantidade} onChange={mudar("quantidade")} required className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500" /></label>
        </div>}
        <div className="flex gap-3"><button type="submit" disabled={loading || salvando} className="flex-1 rounded-lg bg-indigo-600 py-2 text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50">{salvando ? "A atualizar..." : "Atualizar produto"}</button><button type="button" onClick={() => navigate("/produtos")} className="flex-1 rounded-lg bg-gray-100 py-2 text-gray-700 hover:bg-gray-200">Cancelar</button></div>
      </form>
    </div>
  </div>;
}
