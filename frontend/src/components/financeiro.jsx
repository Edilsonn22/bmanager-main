import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { API_URL } from "../api/authenticatedFetch";

import {
  DollarSign,
  TrendingUp,
  Wallet,
  ShoppingCart,
  ArrowUpCircle,
  ArrowDownCircle,
  Receipt,
} from "lucide-react";

function Financeiro() {
  const [stats, setStats] = useState([
    {
      label: "Receita de Vendas",
      value: "0 Mzn",
      icon: TrendingUp,
      color: "text-green-500",
      bg: "bg-green-50",
    },
    {
      label: "Custo dos Produtos Vendidos",
      value: "0 Mzn",
      icon: DollarSign,
      color: "text-orange-500",
      bg: "bg-orange-50",
    },
    {
      label: "Lucro Bruto",
      value: "0 Mzn",
      icon: DollarSign,
      color: "text-green-500",
      bg: "bg-green-50",
    },
    {
      label: "Lucro Líquido",
      value: "0 Mzn",
      icon: Wallet,
      color: "text-blue-500",
      bg: "bg-blue-50",
    },
  ]);

  const [produtos, setProdutos] = useState([]);
  const [movimentos, setMovimentos] = useState([]);

  const [receitas, setReceitas] = useState(0);
  const [custos, setCustos] = useState(0);
  const [lucroBruto, setLucroBruto] = useState(0);

  // Por enquanto não temos despesas operacionais
  const [despesas, setDespesas] = useState(0);
  const [lucroLiquido, setLucroLiquido] = useState(0);

  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  /*
   * Formatar valores em MZN
   */
  const formatarMzn = (valor) => {
    return `${Number(valor || 0).toLocaleString("pt-MZ")} Mzn`;
  };

  /*
   * Buscar produtos e movimentos
   */
  useEffect(() => {
    const carregarDados = async () => {
      try {
        setLoading(true);
        setErro("");

        const response = await fetch(`${API_URL}/financeiro/resumo`);
        const data = await response.json();
        if (!response.ok || !data.sucesso) throw new Error(data.erro || "Erro ao carregar dados financeiros.");
        setProdutos(data.produtos || []);
        setMovimentos(data.movimentos || []);

      } catch (error) {
        console.error("Erro financeiro:", error);
        setErro(error.message || "Erro ao carregar dados financeiros.");
      } finally {
        setLoading(false);
      }
    };

    carregarDados();
  }, []);

  /*
   * Calcular dados financeiros
   */
  useEffect(() => {
    if (!produtos.length && !movimentos.length) {
      setReceitas(0);
      setCustos(0);
      setLucroBruto(0);
      setLucroLiquido(0);
      return;
    }

    let receitaTotal = 0;
    let custoTotal = 0;

    /*
     * Apenas movimentos do tipo "saida"
     * representam vendas.
     */
    const vendas = movimentos.filter(
      (movimento) => movimento.tipo === "saida"
    );

    vendas.forEach((movimento) => {
      const produto = produtos.find(
        (p) => Number(p.id) === Number(movimento.produtoId)
      );
      if (!produto) {
        return;
      }

      const quantidadeVendida = Number(movimento.quantidade || 0);

      /*
       * preco = preço de venda
       * precoFornecedor = preço de compra
       */
      const precoVenda = Number(movimento.preco_unitario ?? produto.preco ?? 0);
      const precoFornecedor = Number(
        movimento.custo_unitario ?? produto.precoFornecedor ?? 0
      );

      receitaTotal += precoVenda * quantidadeVendida;

      /*
       * Custo:
       * preço do fornecedor × quantidade vendida
       */
      custoTotal += precoFornecedor * quantidadeVendida;
    });


    const lucroBrutoCalculado =
      receitaTotal - custoTotal;

    const despesasCalculadas = 0;


    const lucroLiquidoCalculado =
      lucroBrutoCalculado - despesasCalculadas;

    setReceitas(receitaTotal);
    setCustos(custoTotal);
    setLucroBruto(lucroBrutoCalculado);
    setDespesas(despesasCalculadas);
    setLucroLiquido(lucroLiquidoCalculado);

    /*
     * Atualizar cards
     */
    setStats([
      {
        label: "Receita de Vendas",
        value: formatarMzn(receitaTotal),
        icon: TrendingUp,
        color: "text-green-500",
        bg: "bg-green-50",
      },
      {
        label: "CPV",
        value: formatarMzn(custoTotal),
        icon: DollarSign,
        color: "text-orange-500",
        bg: "bg-orange-50",
      },
      {
        label: "Lucro Bruto",
        value: formatarMzn(lucroBrutoCalculado),
        icon: DollarSign,
        color: "text-green-500",
        bg: "bg-green-50",
      },
      {
        label: "Lucro Líquido",
        value: formatarMzn(lucroLiquidoCalculado),
        icon: Wallet,
        color: "text-blue-500",
        bg: "bg-blue-50",
      },
    ]);
  }, [produtos, movimentos]);

  /*
   * Últimos movimentos
   */
  const movimentosRecentes = movimentos.slice(0, 10);



  return (
    <div className="flex-1 h-screen overflow-auto p-7 py-6 bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold">Gestão Financeira</h2>

          <p className="text-gray-700 text-sm sm:text-base">
            Gerencie as finanças do seu negócio!
          </p>
        </div>

        <Link to="/movimentar">
          <button className="bg-black text-white px-3 py-2 rounded-lg hover:bg-black/70 transition flex items-center gap-2">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 4v16m8-8H4"
              />
            </svg>
            Movimentar
          </button>
        </Link>
      </div>

      {/* Erro */}
      {erro && (
        <div className="bg-red-100 text-red-700 border border-red-200 rounded-lg p-4 mb-6">
          {erro}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="bg-white rounded-lg p-4 mb-6 text-gray-500">
          Carregando informações financeiras...
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-7 mb-10">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.label}
              className="bg-white p-5 rounded-md shadow-sm flex flex-col items-center"
            >
              <div
                className={`w-12 h-12 ${stat.bg} flex items-center justify-center rounded-lg mb-2`}
              >
                <Icon className={`w-6 h-6 ${stat.color}`} />
              </div>

              <p className="text-sm text-gray-600 text-center">{stat.label}</p>

              <p className="text-lg font-bold mt-1">{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* Demonstração de resultados */}
      <div className="bg-white rounded-md p-5 text-gray-900 mb-7">
        <h3 className="font-semibold text-gray-900">
          Demonstração de Resultados
        </h3>

        <p className="text-gray-500 text-md mb-5">
          Análise Financeira Detalhada
        </p>

        {/* Receita */}
        <div className="bg-green-50 rounded-2xl p-4 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <DollarSign className="text-green-600" />

            <h2>Receitas de Vendas</h2>
          </div>

          <strong className="text-green-700">{formatarMzn(receitas)}</strong>
        </div>

        {/* Custos */}
        <div className="bg-orange-50 rounded-2xl p-4 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShoppingCart className="text-orange-600" />

            <h2>Custo dos Produtos Vendidos</h2>
          </div>

          <strong className="text-orange-700">{formatarMzn(custos)}</strong>
        </div>

        {/* Lucro bruto */}
        <div className="bg-green-50 rounded-2xl p-4 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <DollarSign className="text-green-600" />
            <h2>Lucro Bruto</h2>
          </div>

          <strong className="text-green-700">{formatarMzn(lucroBruto)}</strong>
        </div>

        {/* Despesas */}
        <div className="bg-red-50 rounded-2xl p-4 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Receipt className="text-red-600" />

            <h2>Despesas Operacionais</h2>
          </div>

          <strong className="text-red-700">{formatarMzn(despesas)}</strong>
        </div>

        
        <div className="bg-blue-100 rounded-2xl p-4 font-bold flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Wallet className="text-blue-600 mb-1" />
            <h2>Lucro Líquido</h2>

            {/*<p className="text-sm font-normal text-gray-600">
              Lucro Bruto - Despesas
            </p>*/}
          </div>

          <strong className="text-blue-700">{formatarMzn(lucroLiquido)}</strong>
        </div>
      </div>

      {/* Transações */}
      <div className="bg-white rounded-md p-5">
        <h2 className="font-semibold text-gray-900 mb-1">Transações</h2>

        <p className="text-gray-500 mb-7">
          Visualizar e gerir todas as transações financeiras
        </p>

        <div className="p- border-b mb-4 border-gray-200 ">
          <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-center text-xs uppercase tracking-wider">
                    Data
                  </th>

                  <th className="px-6 py-3 text-center text-xs uppercase tracking-wider">
                    Tipo
                  </th>

                  <th className="px-6 py-3 text-center text-xs uppercase tracking-wider">
                    Produto
                  </th>

                  <th className="px-6 py-3 text-center text-xs uppercase tracking-wider">
                    Quantidade
                  </th>

                  <th className="px-6 py-3 text-center text-xs uppercase tracking-wider">
                    Valor
                  </th>

                  <th className="px-6 py-3 text-center text-xs uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-gray-200 text-center text-xs">
                {movimentosRecentes.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center"
                    >
                      Nenhuma transação encontrada.
                    </td>
                  </tr>
                ) : (
                  movimentosRecentes.map((movimento) => {
                    const produto = produtos.find(
                      (p) => Number(p.id) === Number(movimento.produtoId),
                    );

                    const quantidade = Number(movimento.quantidade || 0);

                    const preco = movimento.tipo === "saida"
                      ? Number(movimento.preco_unitario ?? produto?.preco ?? 0)
                      : Number(movimento.custo_unitario ?? produto?.precoFornecedor ?? 0);

                    const valor = preco * quantidade;

                    return (
                      <tr key={movimento.id} className=" hover:bg-gray-50">
                        <td className="p-4 text-center">
                          {new Date(movimento.created_at).toLocaleDateString(
                            "pt-MZ",
                          )}
                        </td>

                        <td className="p-4 text-center">
                          {movimento.tipo === "saida" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                              <ArrowDownCircle className="w-3 h-3" />
                              Venda
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                              <ArrowUpCircle className="w-3 h-3" />
                              Entrada
                            </span>
                          )}
                        </td>

                        <td className="p-4 text-center">
                          {movimento.nomeProduto}
                        </td>

                        <td className="p-4 text-center">{quantidade}</td>

                        <td className="p-4 text-center   font-semibold">
                          {formatarMzn(valor)}
                        </td>

                        <td className="p-4 text-center">
                          <button className="text-gray-500 hover:text-black">
                            Ver
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Financeiro;
