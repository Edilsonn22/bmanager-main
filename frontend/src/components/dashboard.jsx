import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  Package,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ArrowLeftRight,
} from "lucide-react";

import { useAuth } from "../features/auth/AuthContext";
import { API_URL } from "../api/authenticatedFetch";

function Dashboard() {
  // =====================================================
  // AUTENTICAÇÃO
  // =====================================================

  const { usuario } = useAuth();

  // =====================================================
  // PERMISSÕES
  // =====================================================

  // Admin e Gestor podem ver o valor do estoque.
  // Operador NÃO pode ver.
  const podeVerEstatistica = ["admin", "gestor"].includes(usuario?.role);

  // =====================================================
  // ESTATÍSTICAS PADRÃO
  // =====================================================

  const defaultStats = [
    {
      label: "Total Produtos",
      value: "0",
      icon: Package,
      color: "text-blue-500",
      bg: "bg-blue-50",
    },

    {
      label: "Valor do Estoque",
      value: "0 Mzn",
      icon: DollarSign,
      color: "text-green-500",
      bg: "bg-green-50",
    },

    {
      label: "Entradas",
      value: "0 Unidades",
      icon: TrendingUp,
      color: "text-emerald-500",
      bg: "bg-emerald-50",
    },

    {
      label: "Saídas",
      value: "0 Unidades",
      icon: TrendingDown,
      color: "text-orange-500",
      bg: "bg-orange-50",
    },
  ];

  // =====================================================
  // STATES
  // =====================================================

  const [lowStockItems, setLowStockItems] = useState([]);

  const [stats, setStats] = useState(defaultStats);

  const [recentMovements, setRecentMovements] = useState([]);

  const [loading, setLoading] = useState(true);

  const [erro, setErro] = useState("");

  // =====================================================
  // FORMATAR MOEDA
  // =====================================================

  const formatarMzn = (valor) => {
    return `${Number(valor || 0).toLocaleString("pt-MZ")} Mzn`;
  };

  // =====================================================
  // TOKEN
  // =====================================================

  const getToken = useCallback(() => {
    return localStorage.getItem("token");
  }, []);

  // =====================================================
  // HEADERS AUTENTICADOS
  // =====================================================

  const getAuthHeaders = useCallback(() => {
    const token = getToken();

    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  }, [getToken]);

  // =====================================================
  // CARREGAR DASHBOARD
  // =====================================================

  useEffect(() => {
    const carregarDashboard = async () => {
      try {
        setLoading(true);
        setErro("");

        const token = getToken();

        // -----------------------------------------------
        // VERIFICAR TOKEN
        // -----------------------------------------------

        if (!token) {
          setErro("Você não está autenticado.");
          return;
        }

        // =================================================
        // PRODUTOS
        // =================================================

        const produtosResponse = await fetch(`${API_URL}/produtos`, {
          headers: getAuthHeaders(),
        });

        // -----------------------------------------------
        // TOKEN EXPIRADO
        // -----------------------------------------------

        if (produtosResponse.status === 401) {
          throw new Error("Sessão expirada. Faça login novamente.");
        }

        // -----------------------------------------------
        // ERRO API
        // -----------------------------------------------

        if (!produtosResponse.ok) {
          throw new Error("Erro ao carregar produtos.");
        }

        // -----------------------------------------------
        // RESPOSTA
        // -----------------------------------------------

        const produtosData = await produtosResponse.json();

        if (!produtosData.sucesso) {
          throw new Error(produtosData.message || "Erro ao carregar produtos.");
        }

        const produtos = produtosData.produtos || [];

        // =================================================
        // ESTOQUE BAIXO
        // =================================================

        const lowStock = produtos
          .filter((p) => {
            const quantidade = Number(p.quantidade || 0);

            const minimo = Number(p.estoqueMinimo ?? 5);

            return quantidade <= minimo;
          })
          .map((p) => ({
            id: p.id,

            name: p.nome,

            current: Number(p.quantidade || 0),

            minimum: Number(p.estoqueMinimo ?? 5),
          }));

        setLowStockItems(lowStock);

        // =================================================
        // TOTAL DE PRODUTOS
        // =================================================

        const totalProdutos = produtos.length;

        // =================================================
        // VALOR DO ESTOQUE
        // =================================================

        const valorEstoque = produtos.reduce(
          (acc, p) => acc + Number(p.preco || 0) * Number(p.quantidade || 0),
          0,
        );

        // =================================================
        // MOVIMENTOS
        // =================================================

        const movimentosResponse = await fetch(`${API_URL}/movimentos`, {
          headers: getAuthHeaders(),
        });

        // -----------------------------------------------
        // TOKEN EXPIRADO
        // -----------------------------------------------

        if (movimentosResponse.status === 401) {
          throw new Error("Sessão expirada. Faça login novamente.");
        }

        // -----------------------------------------------
        // ERRO
        // -----------------------------------------------

        if (!movimentosResponse.ok) {
          throw new Error("Erro ao carregar movimentos.");
        }

        // -----------------------------------------------
        // RESPOSTA
        // -----------------------------------------------

        const movimentosData = await movimentosResponse.json();

        const movimentos = movimentosData.movimentos || [];

        // =================================================
        // TOTAL DE ENTRADAS
        // =================================================

        const totalEntradas = movimentos
          .filter((m) => m.tipo === "entrada")
          .reduce((total, m) => total + Number(m.quantidade || 0), 0);

        // =================================================
        // TOTAL DE SAÍDAS
        // =================================================

        const totalSaidas = movimentos
          .filter((m) => m.tipo === "saida")
          .reduce((total, m) => total + Number(m.quantidade || 0), 0);

        // =================================================
        // ATUALIZAR ESTATÍSTICAS
        // =================================================

        setStats([
          {
            label: "Total Produtos",
            value: totalProdutos,
            icon: Package,
            color: "text-blue-500",
            bg: "bg-blue-50",
          },

          {
            label: "Valor do Estoque",
            value: formatarMzn(valorEstoque),
            icon: DollarSign,
            color: "text-green-500",
            bg: "bg-green-50",
          },

          {
            label: "Entradas",
            value: `${totalEntradas} Unidades`,
            icon: TrendingUp,
            color: "text-emerald-500",
            bg: "bg-emerald-50",
          },

          {
            label: "Saídas",
            value: `${totalSaidas} Unidades`,
            icon: TrendingDown,
            color: "text-orange-500",
            bg: "bg-orange-50",
          },
        ]);

        // =================================================
        // MOVIMENTOS RECENTES
        // =================================================

        const recent = movimentos.slice(0, 5).map((m) => ({
          id: m.id,

          name: m.nomeProduto || m.produto_nome || `Produto #${m.id_Produto}`,

          action: `${
            m.tipo === "entrada" ? "Entrada" : "Saída"
          }: ${m.quantidade}`,

          date: new Date(m.created_at).toLocaleDateString("pt-MZ"),

          icon: m.tipo === "entrada" ? TrendingUp : TrendingDown,

          color: m.tipo === "entrada" ? "text-emerald-500" : "text-orange-500",

          bg: m.tipo === "entrada" ? "bg-emerald-50" : "bg-orange-50",
        }));

        setRecentMovements(recent);
      } catch (error) {
        console.error("Erro no dashboard:", error);

        setErro(error.message || "Erro ao carregar dashboard.");
      } finally {
        setLoading(false);
      }
    };

    carregarDashboard();
  }, [getAuthHeaders, getToken]);

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div
        className="
          flex
          h-screen
          flex-1
          items-center
          justify-center
          bg-gray-50
        "
      >
        <div className="text-gray-500">Carregando dashboard...</div>
      </div>
    );
  }

  // =====================================================
  // ERRO
  // =====================================================

  if (erro) {
    return (
      <div
        className="
          flex
          h-screen
          flex-1
          items-center
          justify-center
          bg-gray-50
          p-4
        "
      >
        <div
          className="
            w-full
            max-w-md
            rounded-xl
            bg-white
            p-8
            text-center
            shadow-sm
          "
        >
          <AlertTriangle className="mx-auto mb-3 text-red-500" size={40} />

          <h2
            className="
              text-lg
              font-semibold
              text-gray-900
            "
          >
            Não foi possível carregar o dashboard
          </h2>

          <p
            className="
              mt-2
              text-gray-500
            "
          >
            {erro}
          </p>
        </div>
      </div>
    );
  }

  // =====================================================
  // DASHBOARD
  // =====================================================

  return (
    <div
      className="
        flex-1
        h-screen
        overflow-auto
        bg-gray-50
        p-4
        pt-20
        sm:p-5
        sm:pt-20
        md:p-7
        md:pt-6
      "
    >
      {/* =================================================
          HEADER
      ================================================= */}

      <div
        className="
          mb-6
          flex
          flex-col
          gap-4

          sm:flex-row
          sm:items-center
          sm:justify-between

          md:mb-8
        "
      >
        <div>
          <h2
            className="
              text-xl
              font-bold
              text-gray-900

              sm:text-2xl
            "
          >
            Visão geral do painel
          </h2>

          <p
            className="
    mt-1
    text-sm
    text-gray-700
    sm:text-base
  "
          >
            Bem vindo de volta,{" "}
            <span className="font-semibold text-black">{usuario.nome}</span>!
            Faça a gestão do seu estoque.
          </p>
        </div>

        <Link to="/movimentar" className="w-full sm:w-auto">
          <button
            className="
              flex
              w-full
              items-center
              justify-center
              gap-2

              rounded-lg

              bg-green-600

              px-3
              py-2

              text-white

              transition

              hover:bg-green-700

              sm:w-auto
            "
          >
            <svg
              className="h-5 w-5"
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

      {/* =================================================
          ESTATÍSTICAS
      ================================================= */}

      <div
        className=" 
          mb-8
          grid
          grid-cols-1
          gap-4

          sm:grid-cols-2
          
          lg:grid-cols-4

          md:mb-10
        "
      >
        {stats
          .filter(
            (stat) => stat.label !== "Valor do Estoque" || podeVerEstatistica,
          )
          .map((stat) => (
            <div
              key={stat.label}
              className="
                flex
                flex-col
                items-center

                rounded-md
                bg-white

                p-4

                shadow-sm
              "
            >
              <div
                className={`
                  mb-2
                  flex
                  h-12
                  w-12
                  items-center
                  justify-center
                  rounded-lg
                  ${stat.bg}
                `}
              >
                <stat.icon
                  className={`
                    h-6
                    w-6
                    ${stat.color}
                  `}
                />
              </div>

              <p
                className="
                  text-sm
                  text-gray-600
                "
              >
                {stat.label}
              </p>

              <p
                className="
                  text-center
                  text-lg
                  font-bold
                  text-gray-900
                "
              >
                {stat.value}
              </p>
            </div>
          ))}
      </div>

      {/* =================================================
          ALERTA DE ESTOQUE BAIXO
      ================================================= */}

      <div
        className="
          mb-6
          rounded-md
          bg-white
          p-4

          sm:p-5

          md:mb-8
        "
      >
        <div
          className="
            mb-4
            flex
            items-center
            gap-2
          "
        >
          <AlertTriangle
            className="
              h-6
              w-6
              flex-shrink-0
              text-red-500
              bg-red-100
              rounded-lg
            "
          />

          <h3
            className="
              font-semibold
              text-gray-900
            "
          >
            Alerta de Estoque Baixo
          </h3>
        </div>

        {lowStockItems.length === 0 ? (
          <p
            className="
              text-sm
              text-gray-500
            "
          >
            Nenhum produto com estoque baixo.
          </p>
        ) : (
          lowStockItems.map((item) => (
            <div
              key={item.id}
              className="
                  mb-3
                  w-full
                  rounded-xl
                  bg-red-50

                  px-3
                  py-3

                  sm:px-4
                "
            >
              <div
                className="
                    flex
                    flex-col
                    gap-3

                    sm:flex-row
                    sm:items-center
                    sm:justify-between
                  "
              >
                <div>
                  <p
                    className="
                        font-medium
                        text-gray-900
                      "
                  >
                    {item.name}
                  </p>

                  <p
                    className="
                        text-sm
                        text-gray-600
                      "
                  >
                    Atual: {item.current}
                    {" | "}
                    Mínimo: {item.minimum}
                  </p>
                </div>

                <span
                  className="
                      w-fit
                      rounded-full
                      bg-red-500

                      px-3
                      py-2

                      text-xs
                      font-semibold
                      text-white
                    "
                >
                  Estoque baixo
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* =================================================
          MOVIMENTOS RECENTES
      ================================================= */}

      <div
        className="
          rounded-md
          bg-white
          p-4

          sm:p-5
        "
      >
        <div
          className="
            mb-4
            flex
            items-center
            gap-2
          "
        >
          <ArrowLeftRight
            className="
              h-5
              w-5
              flex-shrink-0
              text-yellow-500
            "
          />

          <h3
            className="
              font-semibold
              text-gray-900
            "
          >
            Top 5 de Movimentos de Estoque Recentes
          </h3>
        </div>

        
        {recentMovements.length === 0 ? (
          <p
            className="
              text-sm
              text-gray-500
            "
          >
            Nenhum movimento recente.
          </p>
        ) : (
          recentMovements.map((item) => (
            <div
              key={item.id}
              className="
                  mb-2
                  flex
                  flex-col
                  gap-3

                  rounded-lg
                  px-2
                  py-3

                  sm:flex-row
                  sm:items-center
                  sm:justify-between
                  sm:px-4
                "
            >
              {/* ESQUERDA */}

              <div
                className="
                    flex
                    min-w-0
                    items-center
                    gap-2
                  "
              >
                <div
                  className={`
                      flex
                      h-8
                      w-8
                      flex-shrink-0
                      items-center
                      justify-center
                      rounded-md
                      ${item.bg}
                    `}
                >
                  <item.icon
                    className={`
                        h-4
                        w-4
                        ${item.color}
                      `}
                  />
                </div>

                <div className="min-w-0">
                  <p
                    className="
                        truncate
                        font-medium
                        text-gray-900
                      "
                  >
                    {item.name}
                  </p>

                  <p
                    className="
                        text-sm
                        text-gray-600
                      "
                  >
                    {item.action}
                  </p>
                </div>
              </div>

              {/* DATA */}

              <span
                className="
                    pl-10
                    text-sm
                    text-gray-700

                    sm:pl-0
                  "
              >
                {item.date}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Dashboard;
