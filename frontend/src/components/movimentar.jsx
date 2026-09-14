import React, { useEffect, useState } from "react";
import { AlertCircle, LoaderCircle, PackagePlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../api/authenticatedFetch";
import { useAuth } from "../features/auth/AuthContext";
import { Feedback } from "./ui/Feedback";

function RegistarMovimento() {
  const navigate = useNavigate();
  const { usuario } = useAuth();

  const [produtos, setProdutos] = useState([]);
  const [produtoSelecionado, setProdutoSelecionado] = useState("");
  const [apresentacaoSelecionada, setApresentacaoSelecionada] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [tipoMovimento, setTipoMovimento] = useState("");
  const [motivo, setMotivo] = useState("");

  const tipos = ["Entrada", "Saida"];
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);

  // Carregar produtos do backend
  useEffect(() => {
    fetch(`${API_URL}/produtos`)
      .then((res) => res.json())
      .then((data) => {
        if (data.sucesso) {
          setProdutos(data.produtos || []);
        } else {
          throw new Error(data.erro || "Não foi possível carregar os produtos.");
        }
      })
      .catch((err) => setErro(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setErro(""); setMensagem("");
    if (!produtoSelecionado) { setErro("Selecione um produto."); return; }

    if (!tipoMovimento) {
      setErro("Selecione o tipo de movimento."); return;
    }
    if (tipoMovimento === "Saida" && !motivo.trim()) { setErro("Selecione o motivo da saída."); return; }

    if (!quantidade || Number(quantidade) <= 0) {
      setErro("Digite uma quantidade válida."); return;
    }

    const produto = produtos.find((p) => p.id === Number(produtoSelecionado));
    if (!produto) {
      setErro("O produto selecionado é inválido."); return;
    }

    const apresentacao = produto.apresentacoes?.find((a) => a.id === Number(apresentacaoSelecionada));
    const quantidadeBase = Number(quantidade) * Number(apresentacao?.fator_conversao || 1);
    if (tipoMovimento === "Saida" && quantidadeBase > produto.quantidade) {
      setErro("A quantidade é maior do que o stock disponível."); return;
    }

    setEnviando(true); try {
      const resposta = await fetch(`${API_URL}/movimentos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_Produto: Number(produto.id),                  
          apresentacao_id: apresentacao?.id || null,
          tipo: tipoMovimento.toLowerCase(),       
          quantidade: Number(quantidade),  
          motivo: motivo.trim() || undefined,
        }),
      });

      const data = await resposta.json();

      if (data.sucesso) {
        setMensagem(`${tipoMovimento === "Entrada" ? "Entrada" : "Saída"} registada com sucesso.`);

        setProdutoSelecionado("");
        setApresentacaoSelecionada("");
        setQuantidade("");
        setTipoMovimento("");
        setMotivo("");
        
        setTimeout(() => {
          navigate(-1);
        }, 1500);
      } else {
        setErro(data.erro || "Não foi possível registar o movimento.");
      }
    } catch (err) {
      setErro(err.message || "Não foi possível registar o movimento.");
    } finally { setEnviando(false); }
  };

  return (
    <div className="fixed inset-0 bg-gray-200 bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-gray-900 font-bold text-center">Registar movimento</h2>
          <button
            type="button" aria-label="Fechar" onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            X
          </button>
        </div>

        {loading ? <div className="grid min-h-64 place-items-center p-8 text-center" role="status"><div><LoaderCircle className="mx-auto animate-spin text-indigo-600" size={32}/><p className="mt-3 font-semibold text-slate-800">A carregar produtos</p></div></div> : erro && !produtos.length ? <div className="p-6 text-center sm:p-10"><span className="mx-auto grid size-14 place-items-center rounded-2xl bg-red-50 text-red-600"><AlertCircle size={27}/></span><h3 className="mt-4 text-lg font-bold text-slate-900">Não foi possível carregar os produtos</h3><p className="mt-2 text-sm text-slate-600">{erro}</p><button type="button" onClick={() => navigate(-1)} className="mt-6 rounded-xl border border-slate-300 bg-white px-5 py-2.5 font-semibold text-slate-700 hover:bg-slate-50">Voltar</button></div> : !produtos.length ? <div className="p-6 text-center sm:p-10"><span className="mx-auto grid size-14 place-items-center rounded-2xl bg-indigo-50 text-indigo-600"><PackagePlus size={27}/></span><h3 className="mt-4 text-lg font-bold text-slate-900">Ainda não existem produtos</h3><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-600">Para registar uma entrada ou saída de stock, primeiro é necessário adicionar um produto à empresa.</p>{usuario?.role === "operador" ? <p className="mt-5 rounded-xl bg-amber-50 p-3 text-sm font-medium text-amber-800">Peça ao administrador ou gestor da empresa para registar o primeiro produto.</p> : <button type="button" onClick={() => navigate("/adicionarProduto")} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 font-semibold text-white hover:bg-indigo-700"><PackagePlus size={18}/>Registar primeiro produto</button>}</div> : <form className="p-6" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-4">
            {/* Produto */}
            <div>
              <label className="block text-gray-700 mb-2">Produto:</label>
              <select
                value={produtoSelecionado}
                onChange={(e) => { setProdutoSelecionado(e.target.value); setApresentacaoSelecionada(""); }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              >
                <option value="">{loading ? "A carregar produtos..." : "Selecione o produto"}</option>
                {produtos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome} (Disponível: {p.quantidade})
                  </option>
                ))}
              </select>
            </div>
            {produtoSelecionado && (() => { const p = produtos.find((item) => item.id === Number(produtoSelecionado)); return <div><label className="block text-gray-700 mb-2">Movimentar por:</label><select value={apresentacaoSelecionada} onChange={(e) => setApresentacaoSelecionada(e.target.value)} className="w-full rounded-lg border border-gray-300 px-4 py-2"><option value="">{p?.unidade_base || "Unidade"}</option>{p?.apresentacoes?.map((a) => <option key={a.id} value={a.id}>{a.nome} (1 = {a.fator_conversao} {p.unidade_base || "unidades"})</option>)}</select></div>; })()}
            {tipoMovimento === "Saida" && <div><label className="block text-gray-700 mb-2">Motivo da saída:</label><select value={motivo} onChange={(e)=>setMotivo(e.target.value)} className="w-full rounded-lg border border-gray-300 px-4 py-2" required><option value="">Selecione o motivo</option><option>Produto danificado</option><option>Produto expirado</option><option>Uso interno</option><option>Oferta ou amostra</option><option>Ajuste de inventário</option><option>Devolução ao fornecedor</option><option>Outro</option></select><p className="mt-1 text-xs text-slate-500">Esta saída reduz o stock, mas não entra no faturamento.</p></div>}

            {/* Tipo de movimento */}
            <div>
              <label className="block text-gray-700 mb-2">Tipo de Movimento:</label>
              <select
                value={tipoMovimento}
                onChange={(e) => setTipoMovimento(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              >
                <option value="">Selecione o tipo</option>
                {tipos.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Quantidade */}
            <div>
              <label className="block text-gray-700 mb-2">Quantidade:</label>
              <input
                type="number"
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                min="1"
              />
            </div>
          </div>
          <Feedback tipo="sucesso" className="mt-4">{mensagem}</Feedback><Feedback tipo="erro" className="mt-4">{erro}</Feedback>
          
          {/* Botões */}
          <div className="flex gap-3 mt-6">
            <button
              type="submit"
              disabled={enviando || loading} className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition disabled:opacity-60"
            >
              {enviando ? "A registar..." : "Registar"}
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition"
            >
              Cancelar
            </button>
          </div>
        </form>}
      </div>
    </div>
  );
}

export default RegistarMovimento;
