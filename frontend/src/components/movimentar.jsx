import React, { useEffect, useState } from "react";
import { AlertCircle, LoaderCircle, PackagePlus, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../api/authenticatedFetch";
import { useAuth } from "../features/auth/AuthContext";
import { Feedback } from "./ui/Feedback";

function RegistarMovimento() {
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const [produtos, setProdutos] = useState([]);
  const [produtoSelecionado, setProdutoSelecionado] = useState("");
  const [pesquisaProduto, setPesquisaProduto] = useState("");
  const [mostrarProdutos, setMostrarProdutos] = useState(false);
  const [apresentacaoSelecionada, setApresentacaoSelecionada] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [tipoMovimento, setTipoMovimento] = useState("");
  const [motivo, setMotivo] = useState("");

  const tipos = ["Entrada", "Saida"];
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);

  const produtosFiltrados = produtos.filter((produto) => {
    const termo = pesquisaProduto.trim().toLocaleLowerCase("pt-MZ");
    return (
      !termo ||
      String(produto.nome || "").toLocaleLowerCase("pt-MZ").includes(termo) ||
      String(produto.codigo_barras || "")
        .toLocaleLowerCase("pt-MZ")
        .includes(termo) ||
      (produto.apresentacoes || []).some((apresentacao) =>
        String(apresentacao.codigo_barras || "")
          .toLocaleLowerCase("pt-MZ")
          .includes(termo),
      )
    );
  });

  // Carregar produtos do backend
  useEffect(() => {
    fetch(`${API_URL}/produtos`)
      .then((res) => res.json())
      .then((data) => {
        if (data.sucesso) {
          setProdutos(data.produtos || []);
        } else {
          throw new Error(
            data.erro || "Não foi possível carregar os produtos.",
          );
        }
      })
      .catch((err) => setErro(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setErro("");
    setMensagem("");
    if (!produtoSelecionado) {
      setErro("Selecione um produto.");
      return;
    }

    if (!tipoMovimento) {
      setErro("Selecione o tipo de movimento.");
      return;
    }
    if (tipoMovimento === "Saida" && !motivo.trim()) {
      setErro("Selecione o motivo da saída.");
      return;
    }

    if (!quantidade || Number(quantidade) <= 0) {
      setErro("Digite uma quantidade válida.");
      return;
    }

    const produto = produtos.find((p) => p.id === Number(produtoSelecionado));
    if (!produto) {
      setErro("O produto selecionado é inválido.");
      return;
    }

    const apresentacao = produto.apresentacoes?.find(
      (a) => a.id === Number(apresentacaoSelecionada),
    );
    const quantidadeBase =
      Number(quantidade) * Number(apresentacao?.fator_conversao || 1);
    if (tipoMovimento === "Saida" && quantidadeBase > produto.quantidade) {
      setErro("A quantidade é maior do que o stock disponível.");
      return;
    }

    setEnviando(true);
    try {
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
        setMensagem(
          `${tipoMovimento === "Entrada" ? "Entrada" : "Saída"} registada com sucesso.`,
        );

        setProdutoSelecionado("");
        setPesquisaProduto("");
        setMostrarProdutos(false);
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
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-200 bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-gray-900 font-bold text-center">
            Registar movimento
          </h2>
          <button
            type="button"
            aria-label="Fechar"
            onClick={() => navigate(-1)}
            className="p- h-5 w-5 hover:bg-gray-100 rounded-lg"
          >
            X
          </button>
          
        </div>

        {loading ? (
          <div
            className="grid min-h-64 place-items-center p-8 text-center"
            role="status"
          >
            <div>
              <LoaderCircle
                className="mx-auto animate-spin text-indigo-600"
                size={32}
              />
              <p className="mt-3 font-semibold text-slate-800">
                A carregar produtos
              </p>
            </div>
          </div>
        ) : erro && !produtos.length ? (
          <div className="p-6 text-center sm:p-10">
            <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-red-50 text-red-600">
              <AlertCircle size={27} />
            </span>
            <h3 className="mt-4 text-lg font-bold text-slate-900">
              Não foi possível carregar os produtos
            </h3>
            <p className="mt-2 text-sm text-slate-600">{erro}</p>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="mt-6 rounded-xl border border-slate-300 bg-white px-5 py-2.5 font-semibold text-slate-700 hover:bg-slate-50"
            >
              Voltar
            </button>
          </div>
        ) : !produtos.length ? (
          <div className="p-6 text-center sm:p-10">
            <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-indigo-50 text-indigo-600">
              <PackagePlus size={27} />
            </span>
            <h3 className="mt-4 text-lg font-bold text-slate-900">
              Ainda não existem produtos
            </h3>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-600">
              Para registar uma entrada ou saída de stock, primeiro é necessário
              adicionar um produto à empresa.
            </p>
            {usuario?.role === "operador" ? (
              <p className="mt-5 rounded-xl bg-amber-50 p-3 text-sm font-medium text-amber-800">
                Peça ao administrador ou gestor da empresa para registar o
                primeiro produto.
              </p>
            ) : (
              <button
                type="button"
                onClick={() => navigate("/adicionarProduto")}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 font-semibold text-white hover:bg-indigo-700"
              >
                <PackagePlus size={18} />
                Registar primeiro produto
              </button>
            )}
          </div>
        ) : (
          <form className="p-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-4">
              {/* Produto */}
              <div>
                <label className="block text-gray-700 mb-2">Produto:</label>
                {produtoSelecionado ? (
                  (() => {
                    const produto = produtos.find(
                      (item) => item.id === Number(produtoSelecionado),
                    );
                    return (
                      <div className="flex items-center justify-between gap-3 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-gray-900">
                            {produto?.nome}
                          </p>
                          <p className="text-sm text-gray-600">
                            Disponível: {produto?.quantidade}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setProdutoSelecionado("");
                            setPesquisaProduto("");
                            setMostrarProdutos(true);
                            setApresentacaoSelecionada("");
                          }}
                          className="shrink-0 text-sm font-semibold text-indigo-700 hover:text-indigo-900"
                        >
                          Alterar
                        </button>
                      </div>
                    );
                  })()
                ) : (
                  <div className="relative">
                    <Search
                      size={18}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="search"
                      value={pesquisaProduto}
                      onChange={(e) => {
                        setPesquisaProduto(e.target.value);
                        setMostrarProdutos(true);
                      }}
                      onFocus={() => setMostrarProdutos(true)}
                      placeholder="Pesquisar por nome ou código de barras..."
                      aria-label="Pesquisar produto por nome ou código de barras"
                      className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 outline-none focus:border-transparent focus:ring-2 focus:ring-indigo-500"
                    />
                    {mostrarProdutos && (
                      <div
                        className="absolute z-10 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg"
                        aria-label="Produtos encontrados"
                      >
                        {produtosFiltrados.length ? (
                          produtosFiltrados.map((produto) => (
                            <button
                              key={produto.id}
                              type="button"
                              onClick={() => {
                                setProdutoSelecionado(String(produto.id));
                                setPesquisaProduto("");
                                setMostrarProdutos(false);
                                setApresentacaoSelecionada("");
                              }}
                              className="flex w-full items-center justify-between gap-3 border-b border-gray-100 px-4 py-3 text-left last:border-b-0 hover:bg-indigo-50"
                            >
                              <span className="min-w-0 truncate font-medium text-gray-900">
                                {produto.nome}
                              </span>
                              <span className="shrink-0 text-sm text-gray-500">
                                Stock: {produto.quantidade}
                              </span>
                            </button>
                          ))
                        ) : (
                          <p className="px-4 py-3 text-sm text-gray-500">
                            Nenhum produto encontrado.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
              {produtoSelecionado &&
                (() => {
                  const p = produtos.find(
                    (item) => item.id === Number(produtoSelecionado),
                  );
                  return (
                    <div>
                      <label className="block text-gray-700 mb-2">
                        Movimentar por:
                      </label>
                      <select
                        value={apresentacaoSelecionada}
                        onChange={(e) =>
                          setApresentacaoSelecionada(e.target.value)
                        }
                        className="w-full rounded-lg border border-gray-300 px-4 py-2"
                      >
                        <option value="">{p?.unidade_base || "Unidade"}</option>
                        {p?.apresentacoes?.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.nome} (1 = {a.fator_conversao}{" "}
                            {p.unidade_base || "unidades"})
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })()}
              {tipoMovimento === "Saida" && (
                <div>
                  <label className="block text-gray-700 mb-2">
                    Motivo da saída:
                  </label>
                  <select
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2"
                    required
                  >
                    <option value="">Selecione o motivo</option>
                    <option>Produto danificado</option>
                    <option>Produto expirado</option>
                    <option>Uso interno</option>
                    <option>Oferta ou amostra</option>
                    <option>Ajuste de inventário</option>
                    <option>Devolução ao fornecedor</option>
                    <option>Outro</option>
                  </select>
                  <p className="mt-1 text-xs text-slate-500">
                    Esta saída reduz o stock, mas não entra no faturamento.
                  </p>
                </div>
              )}

              {/* Tipo de movimento */}
              <div>
                <label className="block text-gray-700 mb-2">
                  Tipo de Movimento:
                </label>
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
            <Feedback tipo="sucesso" className="mt-4">
              {mensagem}
            </Feedback>
            <Feedback tipo="erro" className="mt-4">
              {erro}
            </Feedback>

            {/* Botões */}
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={enviando || loading}
                className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition disabled:opacity-60"
              >
                {enviando ? "A registar..." : "Registar"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default RegistarMovimento;
