import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Archive, ArchiveRestore, Edit2, PackagePlus } from "lucide-react";
import { useAuth } from "../features/auth/AuthContext";
import { API_URL } from "../api/authenticatedFetch";
import { ConfirmDialog, Feedback } from "./ui/Feedback";

function Productos() {
  const { usuario } = useAuth();
  const podeGerir = ["admin", "gestor"].includes(usuario?.role);
  const podeVerPrecoFornecedor = ["admin", "gestor"].includes(usuario?.role);
  const podeVerAcoes = ["admin", "gestor"].includes(usuario?.role);
  const podeExcluir = usuario?.role === "admin";
  const [produtos, setProdutos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [fornecedores, setFornecedores] = useState([]);
  const [pesquisa, setPesquisa] = useState("");
  const [categoriaSelecionada, setCategoriaSelecionada] = useState("");
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [produtoExcluir, setProdutoExcluir] = useState(null);
  const [removendo, setRemovendo] = useState(false);
  const [mostrarArquivados, setMostrarArquivados] = useState(false);



  const formatarMzn = (valor) =>
    `${Number(valor || 0).toLocaleString("pt-MZ", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} MZN`;

  const carregarDados = useCallback(async () => {
    setLoading(true); setErro("");
    try {
      const respostas = await Promise.all([fetch(`${API_URL}/produtos${mostrarArquivados ? "?estado=arquivados" : ""}`), fetch(`${API_URL}/categorias`), fetch(`${API_URL}/fornecedores`)]);
      const dados = await Promise.all(respostas.map((res) => res.json().then((body) => ({ res, body }))));
      const falha = dados.find(({ res, body }) => !res.ok || body.sucesso === false);
      if (falha) throw new Error(falha.body.erro || "Não foi possível carregar os dados.");
      setProdutos(dados[0].body.produtos || []); setCategorias(dados[1].body.categorias || []); setFornecedores(dados[2].body.fornecedores || []);
    } catch (error) { setErro(error.message || "Não foi possível carregar os produtos."); }
    finally { setLoading(false); }
  }, [mostrarArquivados]);

  useEffect(() => { carregarDados(); }, [carregarDados]);

  const handleDelete = async () => {
    if (!produtoExcluir) return;
    setRemovendo(true); setErro(""); setSucesso("");
    try {
      const response = await fetch(`${API_URL}/produtos/${produtoExcluir.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.erro || "Não foi possível excluir o produto.");
      setProdutos((atuais) => atuais.filter((p) => Number(p.id) !== Number(produtoExcluir.id)));
      setSucesso("Produto arquivado. O histórico de vendas e movimentos foi preservado."); setProdutoExcluir(null);
    } catch (error) { setErro(error.message); }
    finally { setRemovendo(false); }
  };

  const GetStatus = (quantidade, estoqueMinimo = 5) => {
    if (quantidade <= estoqueMinimo)
      return { text: "Baixo", class: "bg-red-100 text-red-700" };
    else if (quantidade <= estoqueMinimo * 1.5)
      return { text: "Médio", class: "bg-yellow-100 text-yellow-700" };
    else return { text: "Bom", class: "bg-green-100 text-green-700" };
  };

  const restaurarProduto = async (produto) => {
    setRemovendo(true); setErro(""); setSucesso("");
    try {
      const response = await fetch(`${API_URL}/produtos/${produto.id}/restaurar`, { method: "PATCH" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.erro || "Não foi possível restaurar o produto.");
      setProdutos((atuais) => atuais.filter((p) => Number(p.id) !== Number(produto.id)));
      setSucesso("Produto restaurado e novamente disponível para vendas e movimentos.");
    } catch (error) { setErro(error.message); }
    finally { setRemovendo(false); }
  };

  const formatarStock = (produto) => {
    const embalagem = produto.apresentacoes?.[0];
    if (!embalagem) return `${produto.quantidade} ${produto.unidade_base || "Unidade"}(s)`;
    const fator = Number(embalagem.fator_conversao);
    const inteiras = Math.floor(Number(produto.quantidade) / fator);
    const soltas = Number(produto.quantidade) % fator;
    return `${inteiras} ${embalagem.nome}(s)${soltas ? ` + ${soltas} ${produto.unidade_base || "Unidade"}(s)` : ""}`;
  };

  const produtosFiltrados = produtos.filter((p) => {
    const termo = pesquisa.trim().toLocaleLowerCase("pt-MZ");
    const correspondePesquisa = !termo
      || p.nome.toLocaleLowerCase("pt-MZ").includes(termo)
      || String(p.codigo_barras || "").toLocaleLowerCase("pt-MZ").includes(termo)
      || (p.apresentacoes || []).some((apresentacao) =>
        String(apresentacao.codigo_barras || "").toLocaleLowerCase("pt-MZ").includes(termo),
      );

    const correspondeCategoria =
      categoriaSelecionada === "" ||
      Number(p.idCategoria) === Number(categoriaSelecionada);

    return correspondePesquisa && correspondeCategoria;
  });

  return (
    <main className="h-screen min-w-0 flex-1 overflow-auto bg-gray-50 p-4 sm:p-6 lg:p-7">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Produtos</h1>
          <p className="text-gray-600 mb-">
            Gerencie os produtos do seu stock
          </p>
        </div>

        {podeGerir && (
          <Link to="/adicionarProduto" className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-white transition hover:bg-indigo-700"><PackagePlus size={19}/>Adicionar produto</Link>
        )}
      </div>
      <Feedback tipo="erro" className="mb-4" onClose={() => setErro("")}>{erro}</Feedback>
      <Feedback tipo="sucesso" className="mb-4" onClose={() => setSucesso("")}>{sucesso}</Feedback>

      <div className="mb-5 inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm" role="group" aria-label="Estado dos produtos">
        <button type="button" onClick={() => setMostrarArquivados(false)} className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${!mostrarArquivados ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50"}`}>Produtos ativos</button>
        <button type="button" onClick={() => setMostrarArquivados(true)} className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${mostrarArquivados ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50"}`}>Arquivados</button>
      </div>

      {/* Pesquisa */}
      <div className="mb-5 flex flex-col gap-3 md:flex-row">
        {/* Pesquisa por nome */}
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Pesquisar por nome ou código de barras..."
            value={pesquisa}
            onChange={(e) => setPesquisa(e.target.value)}
            className="
        w-full
        rounded-lg
        border
        border-gray-300
        py-2
        pl-4
        pr-4
        outline-none
        focus:border-transparent
        focus:ring-2
        focus:ring-indigo-500
      "
          />
        </div>

        {/* Pesquisa por categoria */}
        <div className="w-full md:w-64">
          <select
            value={categoriaSelecionada}
            onChange={(e) => setCategoriaSelecionada(e.target.value)}
            className="
        w-full
        rounded-lg
        border
        border-gray-300
        bg-white
        px-4
        py-2
        text-gray-700
        outline-none
        focus:border-transparent
        focus:ring-2
        focus:ring-indigo-500
      "
          >
            <option value="" className="text-gray-500">Todas as categorias</option>

            {categorias.map((categoria) => (
              <option key={categoria.id} value={categoria.id}>
                {categoria.nome}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div></div>

      {/* Tabela */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] table-auto">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="min-w-56 px-6 py-3 text-left text-xs uppercase tracking-wider">
                  Produto
                </th>
                <th className="px-6 py-3 text-center text-xs uppercase tracking-wider">
                  Categoria
                </th>
                <th className="px-6 py-3 text-center text-xs uppercase tracking-wider">
                  Fornecedor
                </th>
                <th className="px-6 py-3 text-center text-xs uppercase tracking-wider">
                  Quantidade
                </th>
                <th className="px-6 py-3 text-center text-xs uppercase tracking-wider">
                  Status
                </th>
                {podeVerPrecoFornecedor && (
                  <th className="px-6 py-3 text-center text-xs uppercase tracking-wider">
                    Custo de compra
                  </th>
                )}
                <th className="px-6 py-3 text-center text-xs uppercase tracking-wider">
                  Preço de venda
                </th>
                {podeVerAcoes && (
                  <th className="px-6 py-3 text-center text-xs uppercase tracking-wider">
                    Ações
                  </th>
                )}
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200 text-center text-xs">
              {produtosFiltrados.map((produto) => {
                const categoria = categorias.find(
                  (c) => Number(c.id) === Number(produto.idCategoria),
                );

                const fornecedor = fornecedores.find(
                  (f) => Number(f.id) === Number(produto.idFornecedor),
                );

                return (
                  <tr key={produto.id} className="transition-colors hover:bg-slate-50/70">
                    <td className="min-w-56 max-w-80 px-6 py-4 text-left">
                      <strong className="block break-words text-sm font-semibold leading-5 text-slate-900" title={produto.nome}>{produto.nome}</strong>
                      <small className="mt-0.5 block text-slate-400">Código #{produto.id}</small>
                    </td>

                    <td className="px-6 py-3">
                      {categoria ? categoria.nome : "Sem categoria"}
                    </td>

                    <td className="px-6 py-3">
                      {fornecedor ? fornecedor.nome : "Sem fornecedor"}
                    </td>

                    <td className="px-6 py-3"><span>{formatarStock(produto)}</span>{produto.apresentacoes?.[0] && <small className="block text-slate-500">{produto.quantidade} unidades base</small>}</td>

                    <td className="px-6 py-3">
                      <span
                        className={`inline-block px-2 py-1 rounded-full text-sm ${GetStatus(produto.quantidade).class}`}
                      >
                        {GetStatus(produto.quantidade).text}
                      </span>
                    </td>
                    {podeVerPrecoFornecedor && (
                      <td className="px-6 py-3 whitespace-nowrap">
                        <strong className="font-semibold text-slate-800">{formatarMzn(produto.precoFornecedor)}</strong>
                        <small className="block text-slate-500">por {produto.unidade_base || "unidade"}</small>
                        {produto.apresentacoes?.[0] && <small className="mt-1 block font-medium text-amber-700">{formatarMzn(produto.apresentacoes[0].custo)} por {produto.apresentacoes[0].nome}</small>}
                      </td>
                    )}

                    <td className="px-6 py-3 whitespace-nowrap"><strong className="font-semibold text-slate-900">{formatarMzn(produto.preco)}</strong><small className="block text-slate-500">por {produto.unidade_base || "unidade"}</small>{Boolean(produto.apresentacoes?.[0]?.vendavel) && <small className="mt-1 block font-semibold text-indigo-600">{formatarMzn(produto.apresentacoes[0].preco)} por {produto.apresentacoes[0].nome}</small>}</td>

                    <td className="px-6 py-3 text-center flex justify-center">
                      {podeGerir && !mostrarArquivados && (
                        <Link to={`/editarProduto/${produto.id}`}>
                          <button type="button" aria-label={`Editar ${produto.nome}`} className="p-2 hover:bg-gray-100 rounded-lg transition">
                            <Edit2 className="w-4 h-4 text-gray-600" />
                          </button>
                        </Link>
                      )}

                      {podeExcluir && !mostrarArquivados && (
                        <button
                          type="button"
                          aria-label={`Arquivar ${produto.nome}`}
                          onClick={() => setProdutoExcluir(produto)}
                          className="rounded-lg p-2 transition hover:bg-amber-50"
                        >
                          <Archive className="h-4 w-4 text-amber-700" />
                        </button>
                      )}
                      {podeExcluir && mostrarArquivados && <button type="button" disabled={removendo} aria-label={`Restaurar ${produto.nome}`} onClick={() => restaurarProduto(produto)} className="rounded-lg p-2 text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-50"><ArchiveRestore className="h-4 w-4"/></button>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {loading && <p className="py-8 text-center text-gray-500" role="status">A carregar produtos...</p>}
          {!loading && !erro && produtosFiltrados.length === 0 && (
            <div className="px-4 py-10 text-center">{mostrarArquivados ? <Archive className="mx-auto h-10 w-10 text-slate-300"/> : <PackagePlus className="mx-auto h-10 w-10 text-slate-300"/>}<p className="mt-3 font-semibold text-slate-700">{pesquisa || categoriaSelecionada ? "Nenhum produto corresponde aos filtros." : mostrarArquivados ? "Não existem produtos arquivados." : "Ainda não existem produtos."}</p>{podeGerir && !mostrarArquivados && !pesquisa && !categoriaSelecionada && <Link to="/adicionarProduto" className="mt-3 inline-flex font-semibold text-indigo-600 hover:underline">Adicionar o primeiro produto</Link>}</div>
          )}
        </div>
      </div>
      <ConfirmDialog aberto={Boolean(produtoExcluir)} titulo="Arquivar produto?" descricao={`“${produtoExcluir?.nome || ""}” deixará de aparecer em vendas, stock atual e alertas. O histórico será preservado e poderá restaurar o produto depois.`} confirmarLabel="Arquivar produto" ocupada={removendo} onCancelar={() => !removendo && setProdutoExcluir(null)} onConfirmar={handleDelete}/>
    </main>
  );
}

export default Productos;
