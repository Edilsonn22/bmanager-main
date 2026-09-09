import { useCallback, useEffect, useMemo, useState } from "react";
import { API_URL } from "../api/authenticatedFetch";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  AreaChart,
  Area,
} from "recharts";

import {
  Filter,
  X,
  DollarSign,
  TrendingUp,
  Wallet,
  Package,
  AlertTriangle,
  PackageX,
  Boxes,
  Award,
  ArrowUpCircle,
  ArrowDownCircle,
  FileSpreadsheet,
  FileText,
} from "lucide-react";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const ABAS = [
  {
    id: "vendas",
    label: "Vendas",
    icon: TrendingUp,
  },
  {
    id: "produtos",
    label: "Stock / Produtos",
    icon: Package,
  },
  {
    id: "financeiro",
    label: "Financeiro",
    icon: Wallet,
  },
];

const LIMITE_STOCK_BAIXO = 5;

function Relatorios() {
  const [abaAtiva, setAbaAtiva] = useState("vendas");

  const [produtos, setProdutos] = useState([]);
  const [movimentos, setMovimentos] = useState([]);
  const [categorias, setCategorias] = useState([]);

  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  // =====================================================
  // FILTROS
  // =====================================================

  const [filtroDataInicio, setFiltroDataInicio] = useState("");
  const [filtroDataFim, setFiltroDataFim] = useState("");
  const [filtroProdutoId, setFiltroProdutoId] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");

  // =====================================================
  // FUNÇÕES AUXILIARES
  // =====================================================

  const getStock = (produto) =>
    Number(produto?.stock ?? produto?.quantidade ?? 0);

  const formatarMzn = (valor) => {
    return `${Number(valor || 0).toLocaleString("pt-MZ")} Mzn`;
  };

  // =====================================================
  // ID DA CATEGORIA
  // =====================================================

  const getCategoriaId = (produto) => {
    if (!produto) return "";

    return (
      produto.idCategoria ??
      produto.categoriaId ??
      produto.categoria_id ??
      produto.id_categoria ??
      produto.categoria?.id ??
      ""
    );
  };

  // =====================================================
  // NOME DA CATEGORIA
  // =====================================================

  const getCategoriaNome = useCallback((produto) => {
    if (!produto) {
      return "Sem categoria";
    }

    /*
     * PRIMEIRO:
     * Categoria enviada diretamente pelo backend.
     */
    if (produto.categoriaNome && String(produto.categoriaNome).trim() !== "") {
      return produto.categoriaNome;
    }

    /*
     * Outros nomes possíveis.
     */
    if (produto.nomeCategoria && String(produto.nomeCategoria).trim() !== "") {
      return produto.nomeCategoria;
    }

    if (
      produto.categoria_nome &&
      String(produto.categoria_nome).trim() !== ""
    ) {
      return produto.categoria_nome;
    }

    /*
     * Caso venha objeto categoria.
     */
    if (
      produto.categoria?.nome &&
      String(produto.categoria.nome).trim() !== ""
    ) {
      return produto.categoria.nome;
    }

    /*
     * Procurar pelo ID na lista de categorias.
     */
    const categoriaId = getCategoriaId(produto);

    if (categoriaId !== "") {
      const categoria = categorias.find(
        (c) => String(c.id) === String(categoriaId),
      );

      if (categoria?.nome) {
        return categoria.nome;
      }
    }

    return "Sem categoria";
  }, [categorias]);

  // =====================================================
  // ID DO PRODUTO DO MOVIMENTO
  // =====================================================

  const getMovimentoProdutoId = (movimento) => {
    return (
      movimento?.produtoId ??
      movimento?.produto_id ??
      movimento?.id_Produto ??
      movimento?.idProduto ??
      ""
    );
  };

  // =====================================================
  // PRODUTO DO MOVIMENTO
  // =====================================================

  const getProdutoDoMovimento = useCallback((movimento) => {
    const produtoId = getMovimentoProdutoId(movimento);

    return produtos.find((produto) => String(produto.id) === String(produtoId));
  }, [produtos]);

  // =====================================================
  // CATEGORIA DO MOVIMENTO
  // =====================================================

  const getCategoriaMovimento = useCallback((movimento) => {
    /*
     * Agora o backend já envia categoriaNome.
     * Então usamos primeiro essa informação.
     */
    if (
      movimento?.categoriaNome &&
      String(movimento.categoriaNome).trim() !== ""
    ) {
      return movimento.categoriaNome;
    }

    if (
      movimento?.nomeCategoria &&
      String(movimento.nomeCategoria).trim() !== ""
    ) {
      return movimento.nomeCategoria;
    }

    /*
     * Depois procuramos pelo produto.
     */
    const produto = getProdutoDoMovimento(movimento);

    if (produto) {
      return getCategoriaNome(produto);
    }

    /*
     * Última tentativa pelo ID da categoria.
     */
    const categoriaId =
      movimento?.categoriaId ??
      movimento?.idCategoria ??
      movimento?.categoria_id ??
      movimento?.id_categoria;

    if (categoriaId) {
      const categoria = categorias.find(
        (c) => String(c.id) === String(categoriaId),
      );

      if (categoria?.nome) {
        return categoria.nome;
      }
    }

    return "Sem categoria";
  }, [categorias, getCategoriaNome, getProdutoDoMovimento]);

  // =====================================================
  // CARREGAR DADOS
  // =====================================================

  useEffect(() => {
    const carregarDados = async () => {
      try {
        setLoading(true);
        setErro("");

        const response = await fetch(
          `${API_URL}/financeiro/resumo`,
        );

        const data = await response.json();

        if (!response.ok || !data.sucesso) {
          throw new Error(
            data.erro || "Erro ao carregar dados dos relatórios.",
          );
        }

        setProdutos(data.produtos || []);
        setMovimentos(data.movimentos || []);
      } catch (error) {
        console.error("Erro ao carregar relatórios:", error);

        setErro(error.message || "Erro ao carregar dados dos relatórios.");
      } finally {
        setLoading(false);
      }
    };

    carregarDados();
  }, []);

  // =====================================================
  // CARREGAR CATEGORIAS
  // =====================================================

  useEffect(() => {
    const carregarCategorias = async () => {
      try {
        const response = await fetch(`${API_URL}/categorias`);

        const data = await response.json();

        if (!response.ok || !data.sucesso) {
          throw new Error(data.erro || "Erro ao carregar categorias.");
        }

        setCategorias(data.categorias || []);
      } catch (error) {
        console.error("Erro ao listar categorias:", error);
      }
    };

    carregarCategorias();
  }, []);

  // =====================================================
  // CATEGORIAS DISPONÍVEIS
  // =====================================================

  const categoriasDisponiveis = useMemo(() => {
    const mapa = new Map();

    categorias.forEach((categoria) => {
      mapa.set(String(categoria.id), categoria);
    });

    produtos.forEach((produto) => {
      const id = getCategoriaId(produto);

      const nome = getCategoriaNome(produto);

      if (id && nome !== "Sem categoria") {
        mapa.set(String(id), {
          id,
          nome,
        });
      }
    });

    return Array.from(mapa.values());
  }, [categorias, produtos, getCategoriaNome]);

  // =====================================================
  // PRODUTOS FILTRADOS
  // =====================================================

  const produtosFiltrados = useMemo(() => {
    return produtos.filter((produto) => {
      if (filtroProdutoId && String(produto.id) !== String(filtroProdutoId)) {
        return false;
      }

      if (filtroCategoria) {
        const categoriaId = getCategoriaId(produto);

        if (String(categoriaId) !== String(filtroCategoria)) {
          return false;
        }
      }

      return true;
    });
  }, [produtos, filtroProdutoId, filtroCategoria]);

  // =====================================================
  // FILTRO DE DATA
  // =====================================================

  const dentroDoPeriodo = useCallback((dataStr) => {
    if (!dataStr) {
      return false;
    }

    if (!filtroDataInicio && !filtroDataFim) {
      return true;
    }

    const data = new Date(dataStr);

    if (Number.isNaN(data.getTime())) {
      return false;
    }

    data.setHours(0, 0, 0, 0);

    if (filtroDataInicio) {
      const inicio = new Date(`${filtroDataInicio}T00:00:00`);

      if (data < inicio) {
        return false;
      }
    }

    if (filtroDataFim) {
      const fim = new Date(`${filtroDataFim}T23:59:59`);

      if (data > fim) {
        return false;
      }
    }

    return true;
  }, [filtroDataInicio, filtroDataFim]);

  // =====================================================
  // LIMPAR FILTROS
  // =====================================================

  const limparFiltros = () => {
    setFiltroDataInicio("");
    setFiltroDataFim("");
    setFiltroProdutoId("");
    setFiltroCategoria("");
  };

  const temFiltrosAtivos =
    filtroDataInicio || filtroDataFim || filtroProdutoId || filtroCategoria;

  // =====================================================
  // MOVIMENTOS FILTRADOS
  // =====================================================

  const movimentosFiltrados = useMemo(() => {
    return movimentos.filter((movimento) => {
      if (!dentroDoPeriodo(movimento.created_at)) {
        return false;
      }

      const movProdutoId = getMovimentoProdutoId(movimento);

      if (filtroProdutoId && String(movProdutoId) !== String(filtroProdutoId)) {
        return false;
      }

      if (filtroCategoria) {
        const produto = produtos.find(
          (p) => String(p.id) === String(movProdutoId),
        );

        if (!produto) {
          return false;
        }

        const categoriaId = getCategoriaId(produto);

        if (String(categoriaId) !== String(filtroCategoria)) {
          return false;
        }
      }

      return true;
    });
  }, [
    movimentos,
    produtos,
    filtroProdutoId,
    filtroCategoria,
    dentroDoPeriodo,
  ]);

  // =====================================================
  // VENDAS
  // =====================================================

  const vendasFiltradas = useMemo(() => {
    return movimentosFiltrados.filter(
      (movimento) => movimento.tipo === "saida",
    );
  }, [movimentosFiltrados]);

  // =====================================================
  // GRÁFICO DE VENDAS
  // =====================================================

  const dadosGraficoVendas = useMemo(() => {
    const agrupado = {};

    vendasFiltradas.forEach((movimento) => {
      const data = new Date(movimento.created_at);

      if (Number.isNaN(data.getTime())) {
        return;
      }

      const chave = data.toISOString().split("T")[0];

      const produto = getProdutoDoMovimento(movimento);

      const quantidade = Number(movimento.quantidade || 0);

      const preco = Number(movimento.preco_unitario ?? produto?.preco ?? 0);

      const valor = quantidade * preco;

      if (!agrupado[chave]) {
        agrupado[chave] = 0;
      }

      agrupado[chave] += valor;
    });

    return Object.entries(agrupado)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([data, total]) => {
        const [, mes, dia] = data.split("-");

        return {
          data: `${dia}/${mes}`,
          total,
        };
      });
  }, [vendasFiltradas, getProdutoDoMovimento]);

  // =====================================================
  // GRÁFICO DE STOCK
  // =====================================================

  const dadosGraficoStock = useMemo(() => {
    const agrupado = {};

    produtosFiltrados.forEach((produto) => {
      const categoria = getCategoriaNome(produto);

      if (!agrupado[categoria]) {
        agrupado[categoria] = 0;
      }

      agrupado[categoria] += getStock(produto);
    });

    return Object.entries(agrupado)
      .map(([categoria, stock]) => ({
        categoria,
        stock,
      }))
      .sort((a, b) => b.stock - a.stock);
  }, [produtosFiltrados, getCategoriaNome]);

  // =====================================================
  // ESTATÍSTICAS DE VENDAS
  // =====================================================

  const statsVendas = useMemo(() => {
    let receitaTotal = 0;
    let quantidadeTotal = 0;

    const quantidadePorProduto = {};

    vendasFiltradas.forEach((movimento) => {
      const produto = getProdutoDoMovimento(movimento);

      if (!produto) {
        return;
      }

      const quantidade = Number(movimento.quantidade || 0);

      const preco = Number(movimento.preco_unitario ?? produto.preco ?? 0);

      receitaTotal += preco * quantidade;

      quantidadeTotal += quantidade;

      const nome = produto.nome || movimento.nomeProduto || "—";

      quantidadePorProduto[nome] =
        (quantidadePorProduto[nome] || 0) + quantidade;
    });

    const ticketMedio =
      vendasFiltradas.length > 0 ? receitaTotal / vendasFiltradas.length : 0;

    const maisVendido = Object.entries(quantidadePorProduto).sort(
      (a, b) => b[1] - a[1],
    )[0];

    return {
      receitaTotal,
      quantidadeTotal,
      ticketMedio,
      maisVendido: maisVendido ? maisVendido[0] : "—",
    };
  }, [vendasFiltradas, getProdutoDoMovimento]);

  // =====================================================
  // ESTATÍSTICAS DE PRODUTOS
  // =====================================================

  const statsProdutos = useMemo(() => {
    const totalProdutos = produtosFiltrados.length;

    const valorEmStock = produtosFiltrados.reduce(
      (soma, produto) => soma + Number(produto.preco || 0) * getStock(produto),
      0,
    );

    const baixoStock = produtosFiltrados.filter(
      (produto) =>
        getStock(produto) > 0 && getStock(produto) <= LIMITE_STOCK_BAIXO,
    ).length;

    const semStock = produtosFiltrados.filter(
      (produto) => getStock(produto) === 0,
    ).length;

    return {
      totalProdutos,
      valorEmStock,
      baixoStock,
      semStock,
    };
  }, [produtosFiltrados]);

  // =====================================================
  // ESTATÍSTICAS FINANCEIRAS
  // =====================================================

  const statsFinanceiro = useMemo(() => {
    let receitaTotal = 0;
    let custoTotal = 0;

    vendasFiltradas.forEach((movimento) => {
      const produto = getProdutoDoMovimento(movimento);

      if (!produto) {
        return;
      }

      const quantidade = Number(movimento.quantidade || 0);

      receitaTotal += Number(movimento.preco_unitario ?? produto.preco ?? 0) * quantidade;

      custoTotal += Number(movimento.custo_unitario ?? produto.precoFornecedor ?? 0) * quantidade;
    });

    const lucroBruto = receitaTotal - custoTotal;

    const despesas = 0;

    const lucroLiquido = lucroBruto - despesas;

    return {
      receitaTotal,
      custoTotal,
      lucroBruto,
      despesas,
      lucroLiquido,
    };
  }, [vendasFiltradas, getProdutoDoMovimento]);

  // =====================================================
  // GRÁFICO FINANCEIRO
  // =====================================================

  const dadosGraficoFinanceiro = useMemo(() => {
    return [
      {
        nome: "Receita",
        valor: statsFinanceiro.receitaTotal,
      },
      {
        nome: "CPV",
        valor: statsFinanceiro.custoTotal,
      },
      {
        nome: "Lucro Bruto",
        valor: statsFinanceiro.lucroBruto,
      },
    ];
  }, [statsFinanceiro]);

  // =====================================================
  // CARDS
  // =====================================================

  const statsCards = useMemo(() => {
    if (abaAtiva === "vendas") {
      return [
        {
          label: "Receita de Vendas",
          value: formatarMzn(statsVendas.receitaTotal),
          icon: TrendingUp,
          color: "text-green-500",
          bg: "bg-green-50",
        },
        {
          label: "Quantidade Vendida",
          value: statsVendas.quantidadeTotal,
          icon: Boxes,
          color: "text-blue-500",
          bg: "bg-blue-50",
        },
        {
          label: "Média por venda",
          value: formatarMzn(statsVendas.ticketMedio),
          icon: DollarSign,
          color: "text-orange-500",
          bg: "bg-orange-50",
        },
        {
          label: "Produto Mais Vendido",
          value: statsVendas.maisVendido,
          icon: Award,
          color: "text-purple-500",
          bg: "bg-purple-50",
        },
      ];
    }

    if (abaAtiva === "produtos") {
      return [
        {
          label: "Total de Produtos",
          value: statsProdutos.totalProdutos,
          icon: Package,
          color: "text-blue-500",
          bg: "bg-blue-50",
        },
        {
          label: "Valor em Stock",
          value: formatarMzn(statsProdutos.valorEmStock),
          icon: DollarSign,
          color: "text-green-500",
          bg: "bg-green-50",
        },
        {
          label: "Baixo Stock",
          value: statsProdutos.baixoStock,
          icon: AlertTriangle,
          color: "text-orange-500",
          bg: "bg-orange-50",
        },
        {
          label: "Sem Stock",
          value: statsProdutos.semStock,
          icon: PackageX,
          color: "text-red-500",
          bg: "bg-red-50",
        },
      ];
    }

    return [
      {
        label: "Receita de Vendas",
        value: formatarMzn(statsFinanceiro.receitaTotal),
        icon: TrendingUp,
        color: "text-green-500",
        bg: "bg-green-50",
      },
      {
        label: "CPV",
        value: formatarMzn(statsFinanceiro.custoTotal),
        icon: DollarSign,
        color: "text-orange-500",
        bg: "bg-orange-50",
      },
      {
        label: "Lucro Bruto",
        value: formatarMzn(statsFinanceiro.lucroBruto),
        icon: DollarSign,
        color: "text-green-500",
        bg: "bg-green-50",
      },
      {
        label: "Lucro Líquido",
        value: formatarMzn(statsFinanceiro.lucroLiquido),
        icon: Wallet,
        color: "text-blue-500",
        bg: "bg-blue-50",
      },
    ];
  }, [abaAtiva, statsVendas, statsProdutos, statsFinanceiro]);

  // =====================================================
  // NOME DA CATEGORIA SELECIONADA
  // =====================================================

  const categoriaSelecionadaNome = useMemo(() => {
    if (!filtroCategoria) {
      return "Todas as categorias";
    }

    const categoria = categoriasDisponiveis.find(
      (item) => String(item.id) === String(filtroCategoria),
    );

    return categoria?.nome || "Sem categoria";
  }, [filtroCategoria, categoriasDisponiveis]);

  // =====================================================
  // TIPO DO RELATÓRIO
  // =====================================================

  const getTipoRelatorio = () => {
    if (abaAtiva === "vendas") {
      return "Saída";
    }

    if (abaAtiva === "produtos") {
      return "Stock";
    }

    return "Entradas e Saídas";
  };

  // =====================================================
  // FORMATAR DATA
  // =====================================================

  const formatarDataRelatorio = (data) => {
    if (!data) {
      return "Todos";
    }

    const partes = data.split("-");

    if (partes.length !== 3) {
      return data;
    }

    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  };

  const periodoInicio = filtroDataInicio
    ? formatarDataRelatorio(filtroDataInicio)
    : "Todos";

  const periodoFim = filtroDataFim
    ? formatarDataRelatorio(filtroDataFim)
    : "Todos";

  // =====================================================
  // DADOS PARA EXPORTAÇÃO
  // =====================================================

  const dadosExportacao = useMemo(() => {
    if (abaAtiva === "produtos") {
      return produtosFiltrados.map((produto) => ({
        produto: produto.nome || "Produto",

        categoria: getCategoriaNome(produto),

        tipo: "Stock",

        quantidade: getStock(produto),
      }));
    }

    if (abaAtiva === "vendas") {
      return vendasFiltradas.map((movimento) => {
        const produto = getProdutoDoMovimento(movimento);

        return {
          produto: produto?.nome || movimento.nomeProduto || "Produto",

          categoria: getCategoriaMovimento(movimento),

          tipo: "Saída",

          quantidade: Number(movimento.quantidade || 0),
        };
      });
    }

    return movimentosFiltrados.map((movimento) => {
      const produto = getProdutoDoMovimento(movimento);

      return {
        produto: produto?.nome || movimento.nomeProduto || "Produto",

        categoria: getCategoriaMovimento(movimento),

        tipo: movimento.tipo === "saida" ? "Saída" : "Entrada",

        quantidade: Number(movimento.quantidade || 0),
      };
    });
  }, [
    abaAtiva,
    produtosFiltrados,
    vendasFiltradas,
    movimentosFiltrados,
    getCategoriaMovimento,
    getCategoriaNome,
    getProdutoDoMovimento,
  ]);

  // =====================================================
  // TÍTULO DO RELATÓRIO
  // =====================================================

  const getTituloRelatorio = () => {
    if (abaAtiva === "vendas") {
      return "RELATÓRIO DE VENDAS";
    }

    if (abaAtiva === "produtos") {
      return "RELATÓRIO DE ESTOQUE";
    }

    return "RELATÓRIO FINANCEIRO";
  };



  const getResumoExportacao = () => {
    const totalProdutos = new Set(dadosExportacao.map((item) => item.produto))
      .size;

    const totalUnidades = dadosExportacao.reduce(
      (total, item) => total + Number(item.quantidade || 0),
      0,
    );

    return {
      totalProdutos,
      totalUnidades,
    };
  };

  const exportarCSV = () => {
    if (!dadosExportacao.length) return;
    const escapar = (valor) => `"${String(valor ?? "").replace(/"/g, '""')}"`;
    const linhas = [
      ["Produto", "Categoria", "Tipo", "Quantidade"],
      ...dadosExportacao.map((item) => [item.produto, item.categoria, item.tipo, item.quantidade]),
    ];
    const csv = `\uFEFF${linhas.map((linha) => linha.map(escapar).join(";")).join("\n")}`;
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = `${getTituloRelatorio().replace(/\s+/g, "_")}.csv`; link.click(); URL.revokeObjectURL(url);
  };

  // =====================================================
  // EXPORTAR EXCEL
  // =====================================================

  const exportarExcel = async () => {
    try {
      if (dadosExportacao.length === 0) {
        setErro("Não existem dados para exportar com os filtros selecionados.");
        return;
      }

      const { totalProdutos, totalUnidades } = getResumoExportacao();

      const linhas = [
        ["VENDAI"],
        [getTituloRelatorio()],
        [],
        ["Período:", `${periodoInicio} → ${periodoFim}`],
        ["Categoria:", categoriaSelecionadaNome],
        ["Tipo:", getTipoRelatorio()],
        [],
        ["Produto", "Categoria", "Tipo", "Qtd"],
        ...dadosExportacao.map((item) => [
          item.produto,
          item.categoria,
          item.tipo,
          item.quantidade,
        ]),
        [],
        ["Total de produtos:", totalProdutos],
        ["Total de unidades:", totalUnidades],
        [],
        ["Gerado em:", new Date().toLocaleDateString("pt-MZ")],
      ];

      const nomeArquivo =
        abaAtiva === "vendas"
          ? "Relatorio_Vendas.xlsx"
          : abaAtiva === "produtos"
            ? "Relatorio_Estoque.xlsx"
            : "Relatorio_Financeiro.xlsx";

      const { default: escreverExcel } = await import("write-excel-file/browser");
      await escreverExcel(linhas, {
        columns: [{ width: 30 }, { width: 25 }, { width: 20 }, { width: 15 }],
        sheet: "Relatório",
      }).toFile(nomeArquivo);
    } catch (error) {
      console.error("Erro ao exportar Excel:", error);

      setErro("Não foi possível exportar o relatório para Excel.");
    }
  };

  // =====================================================
  // EXPORTAR PDF
  // =====================================================

  const exportarPDF = () => {
    try {
      if (dadosExportacao.length === 0) {
        setErro("Não existem dados para exportar com os filtros selecionados.");
        return;
      }

      const { totalProdutos, totalUnidades } = getResumoExportacao();

      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      // =================================================
      // CABEÇALHO
      // =================================================

      doc.setFont("helvetica", "bold");

      doc.setFontSize(18);

      doc.text("VENDAI", 105, 18, {
        align: "center",
      });

      doc.setFontSize(13);

      doc.text(getTituloRelatorio(), 105, 26, {
        align: "center",
      });

      // Linha superior
      doc.setLineWidth(0.5);

      doc.line(15, 32, 195, 32);

      // =================================================
      // INFORMAÇÕES
      // =================================================

      let y = 43;

      doc.setFontSize(10);

      doc.setFont("helvetica", "normal");

      doc.text("Período:", 15, y);

      doc.setFont("helvetica", "bold");

      doc.text(`${periodoInicio} → ${periodoFim}`, 45, y);

      y += 8;

      doc.setFont("helvetica", "normal");

      doc.text("Categoria:", 15, y);

      doc.setFont("helvetica", "bold");

      doc.text(categoriaSelecionadaNome, 45, y);

      y += 8;

      doc.setFont("helvetica", "normal");

      doc.text("Tipo:", 15, y);

      doc.setFont("helvetica", "bold");

      doc.text(getTipoRelatorio(), 45, y);

      // =================================================
      // TABELA
      // =================================================

      const linhas = dadosExportacao.map((item) => [
        item.produto,
        item.categoria,
        item.tipo,
        item.quantidade,
      ]);

      autoTable(doc, {
        startY: y + 10,

        head: [["Produto", "Categoria", "Tipo", "Qtd"]],

        body: linhas,

        theme: "grid",

        styles: {
          font: "helvetica",
          fontSize: 9,
          cellPadding: 3,
          valign: "middle",
        },

        headStyles: {
          fontStyle: "bold",
          halign: "center",
        },

        columnStyles: {
          0: {
            cellWidth: 55,
          },

          1: {
            cellWidth: 50,
          },

          2: {
            cellWidth: 35,
            halign: "center",
          },

          3: {
            cellWidth: 25,
            halign: "center",
          },
        },

        margin: {
          left: 15,
          right: 15,
        },
      });

      // =================================================
      // RESUMO
      // =================================================

      let resumoY = doc.lastAutoTable.finalY + 10;

      doc.setLineWidth(0.3);

      doc.line(15, resumoY, 195, resumoY);

      resumoY += 9;

      doc.setFont("helvetica", "bold");

      doc.setFontSize(10);

      doc.text(`Total de produtos: ${totalProdutos}`, 15, resumoY);

      resumoY += 7;

      doc.text(`Total de unidades: ${totalUnidades}`, 15, resumoY);

      // =================================================
      // DATA DE GERAÇÃO
      // =================================================

      resumoY += 12;

      doc.setFont("helvetica", "normal");

      doc.text(
        `Gerado em: ${new Date().toLocaleDateString("pt-MZ")}`,
        15,
        resumoY,
      );

      // =================================================
      // RODAPÉ
      // =================================================

      const paginas = doc.internal.getNumberOfPages();

      for (let i = 1; i <= paginas; i++) {
        doc.setPage(i);

        doc.setFontSize(8);

        doc.setTextColor(100, 100, 100);

        doc.text(`BusinessPro - Página ${i} de ${paginas}`, 105, 290, {
          align: "center",
        });
      }

      // =================================================
      // GUARDAR
      // =================================================

      const nomeArquivo =
        abaAtiva === "vendas"
          ? "Relatorio_Vendas.pdf"
          : abaAtiva === "produtos"
            ? "Relatorio_Estoque.pdf"
            : "Relatorio_Financeiro.pdf";

      doc.save(nomeArquivo);
    } catch (error) {
      console.error("Erro ao exportar PDF:", error);

      setErro("Não foi possível exportar o relatório para PDF.");
    }
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="flex-1 h-screen overflow-auto bg-gray-50 p-4 sm:p-6 lg:p-7">
      {/* HEADER */}

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold">Relatórios</h2>

          <p className="text-gray-700 text-sm sm:text-base">
            Análises dinâmicas de vendas, stock e finanças
          </p>
        </div>

        {/* BOTÕES */}

        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={exportarCSV}
            disabled={loading || dadosExportacao.length === 0}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-slate-600 text-white text-sm font-medium hover:bg-slate-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Exportar CSV
          </button>
          <button
            onClick={exportarExcel}
            disabled={loading || dadosExportacao.length === 0}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Exportar Excel
          </button>

          <button
            onClick={exportarPDF}
            disabled={loading || dadosExportacao.length === 0}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileText className="w-4 h-4" />
            Exportar PDF
          </button>
        </div>
      </div>

      {/* ERRO */}

      {erro && (
        <div className="bg-red-100 border border-red-200 text-red-700 p-4 rounded-lg mb-6">
          {erro}
        </div>
      )}

      {/* LOADING */}

      {loading && (
        <div className="bg-white p-4 rounded-lg mb-6 text-gray-500">
          Carregando dados...
        </div>
      )}

      {/* ABAS */}

      <div className="flex gap-2 mb-6 flex-wrap">
        {ABAS.map((aba) => {
          const Icon = aba.icon;

          const ativa = abaAtiva === aba.id;

          return (
            <button
              key={aba.id}
              onClick={() => setAbaAtiva(aba.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                ativa
                  ? "bg-black text-white"
                  : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              <Icon className="w-4 h-4" />

              {aba.label}
            </button>
          );
        })}
      </div>

      {/* FILTROS */}

      <div className="bg-white rounded-xl p-5 mb-7 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-gray-900 font-semibold">
            <Filter className="w-4 h-4" />
            Filtros
          </div>

          {temFiltrosAtivos && (
            <button
              onClick={limparFiltros}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-black"
            >
              <X className="w-3 h-3" />
              Limpar filtros
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              Data início
            </label>

            <input
              type="date"
              value={filtroDataInicio}
              onChange={(e) => setFiltroDataInicio(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Data fim</label>

            <input
              type="date"
              value={filtroDataFim}
              onChange={(e) => setFiltroDataFim(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Produto</label>

            <select
              value={filtroProdutoId}
              onChange={(e) => setFiltroProdutoId(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos os produtos</option>

              {produtos.map((produto) => (
                <option key={produto.id} value={produto.id}>
                  {produto.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">
              Categoria
            </label>

            <select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas as categorias</option>

              {categoriasDisponiveis.map((categoria) => (
                <option key={categoria.id} value={categoria.id}>
                  {categoria.nome}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* CARDS */}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        {statsCards.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.label}
              className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center"
            >
              <div
                className={`w-12 h-12 ${stat.bg} flex items-center justify-center rounded-lg mb-2`}
              >
                <Icon className={`w-6 h-6 ${stat.color}`} />
              </div>

              <p className="text-sm text-gray-500 text-center">{stat.label}</p>

              <p className="text-lg font-bold mt-1 text-center text-gray-800">
                {stat.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* GRÁFICOS */}

      <div className="bg-white rounded-xl p-5 sm:p-6 shadow-sm border border-gray-100 mb-8">
        <div className="mb-5">
          <h3 className="font-semibold text-gray-800 text-lg">
            {abaAtiva === "vendas" && "Evolução das Vendas"}

            {abaAtiva === "produtos" && "Stock por Categoria"}

            {abaAtiva === "financeiro" && "Resumo Financeiro"}
          </h3>

          <p className="text-sm text-gray-500 mt-">
            {abaAtiva === "vendas" &&
              "Valor das vendas realizadas no período selecionado."}

            {abaAtiva === "produtos" &&
              "Quantidade de produtos disponíveis em cada categoria."}

            {abaAtiva === "financeiro" &&
              "Comparação entre receita, custo dos produtos e lucro bruto."}
          </p>
        </div>

        <div className="h-[350px] w-full">
          {abaAtiva === "vendas" &&
            (dadosGraficoVendas.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                Não existem vendas para apresentar no período selecionado.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={dadosGraficoVendas}
                  margin={{
                    top: 10,
                    right: 20,
                    left: 10,
                    bottom: 10,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />

                  <XAxis
                    dataKey="data"
                    tick={{
                      fontSize: 12,
                    }}
                  />

                  <YAxis
                    tick={{
                      fontSize: 12,
                    }}
                    tickFormatter={(value) =>
                      `${Number(value).toLocaleString("pt-MZ")}`
                    }
                  />

                  <Tooltip
                    formatter={(value) => formatarMzn(value)}
                    labelFormatter={(label) => `Data: ${label}`}
                  />

                  <Area
                    type="monotone"
                    dataKey="total"
                    name="Vendas"
                    stroke="#10B981"
                    fill="#D1FAE5"
                    strokeWidth={3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ))}

          {abaAtiva === "produtos" &&
            (dadosGraficoStock.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                Não existem produtos para apresentar.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={dadosGraficoStock}
                  margin={{
                    top: 10,
                    right: 20,
                    left: 10,
                    bottom: 10,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />

                  <XAxis
                    dataKey="categoria"
                    tick={{
                      fontSize: 12,
                    }}
                  />

                  <YAxis
                    allowDecimals={false}
                    tick={{
                      fontSize: 12,
                    }}
                  />

                  <Tooltip formatter={(value) => `${value} unidades`} />

                  <Legend />

                  <Bar
                    dataKey="stock"
                    name="Quantidade em Stock"
                    fill="#3B82F6"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ))}

          {abaAtiva === "financeiro" && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={dadosGraficoFinanceiro}
                margin={{
                  top: 10,
                  right: 20,
                  left: 10,
                  bottom: 10,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />

                <XAxis
                  dataKey="nome"
                  tick={{
                    fontSize: 12,
                  }}
                />

                <YAxis
                  tick={{
                    fontSize: 12,
                  }}
                />

                <Tooltip formatter={(value) => formatarMzn(value)} />

                <Legend />

                <Bar
                  dataKey="valor"
                  name="Valor"
                  fill="#10B981"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* TABELA */}

      <div className="bg-white rounded-xl p-5 sm:p-6 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-800 mb-">
          {abaAtiva === "vendas" && "Histórico de Vendas"}

          {abaAtiva === "produtos" && "Produtos em Stock"}

          {abaAtiva === "financeiro" && "Transações Financeiras"}
        </h3>

        <p className="text-sm text-gray-500 mb-6">
          Detalhamento dos registros filtrados
        </p>

        <div className="overflow-x-auto">
          {abaAtiva === "produtos" ? (
            <TabelaProdutos
              produtos={produtosFiltrados}
              getStock={getStock}
              getCategoria={getCategoriaNome}
              formatarMzn={formatarMzn}
            />
          ) : (
            <TabelaMovimentos
              movimentos={
                abaAtiva === "vendas" ? vendasFiltradas : movimentosFiltrados
              }
              produtos={produtos}
              categorias={categorias}
              getCategoriaMovimento={getCategoriaMovimento}
              mostrarTipo={abaAtiva === "financeiro"}
              formatarMzn={formatarMzn}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// =====================================================
// TABELA PRODUTOS
// =====================================================

function TabelaProdutos({ produtos, getStock, getCategoria, formatarMzn }) {
  return (
    <table className="w-full text-left border-collapse">
      <thead>
        <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase">
          <th className="p-3">Produto</th>

          <th className="p-3">Categoria</th>

          <th className="p-3 text-center">Stock</th>

          <th className="p-3 text-right">Preço</th>

          <th className="p-3 text-right">Valor em Stock</th>
        </tr>
      </thead>

      <tbody className="divide-y divide-gray-100 text-sm">
        {produtos.length === 0 ? (
          <tr>
            <td colSpan="5" className="p-4 text-center text-gray-500">
              Nenhum produto encontrado.
            </td>
          </tr>
        ) : (
          produtos.map((produto) => {
            const stock = getStock(produto);

            const preco = Number(produto.preco || 0);

            return (
              <tr key={produto.id} className="hover:bg-gray-50 transition">
                <td className="p-3 font-medium text-gray-800">
                  {produto.nome}
                </td>

                <td className="p-3 text-gray-500">{getCategoria(produto)}</td>

                <td className="p-3 text-center">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      stock === 0
                        ? "bg-red-100 text-red-700"
                        : stock <= LIMITE_STOCK_BAIXO
                          ? "bg-orange-100 text-orange-700"
                          : "bg-green-100 text-green-700"
                    }`}
                  >
                    {stock}
                  </span>
                </td>

                <td className="p-3 text-right">{formatarMzn(preco)}</td>

                <td className="p-3 text-right font-semibold text-gray-800">
                  {formatarMzn(preco * stock)}
                </td>
              </tr>
            );
          })
        )}
      </tbody>
    </table>
  );
}



function TabelaMovimentos({
  movimentos,
  produtos,
  getCategoriaMovimento,
  mostrarTipo,
  formatarMzn,
}) {
  return (
    <table className="w-full text-left border-collapse">
      <thead>
        <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase">
          <th className="p-3">Data</th>

          {mostrarTipo && <th className="p-3">Tipo</th>}

          <th className="p-3">Produto</th>

          <th className="p-3">Categoria</th>

          <th className="p-3 text-center">Quantidade</th>

          <th className="p-3 text-right">Valor Total</th>
        </tr>
      </thead>

      <tbody className="divide-y divide-gray-100 text-sm">
        {movimentos.length === 0 ? (
          <tr>
            <td
              colSpan={mostrarTipo ? 6 : 5}
              className="p-4 text-center text-gray-500"
            >
              Nenhuma transação encontrada.
            </td>
          </tr>
        ) : (
          movimentos.map((movimento) => {
            const movProdutoId =
              movimento.produtoId ??
              movimento.produto_id ??
              movimento.id_Produto;

            const produto = produtos.find(
              (p) => String(p.id) === String(movProdutoId),
            );

            const quantidade = Number(movimento.quantidade || 0);

            const preco = movimento.tipo === "saida"
              ? Number(movimento.preco_unitario ?? produto?.preco ?? 0)
              : Number(movimento.custo_unitario ?? produto?.precoFornecedor ?? 0);

            const categoria = getCategoriaMovimento(movimento);

            return (
              <tr key={movimento.id} className="hover:bg-gray-50 transition">
                <td className="p-3 text-gray-500 whitespace-nowrap">
                  {movimento.created_at
                    ? new Date(movimento.created_at).toLocaleDateString("pt-MZ")
                    : "-"}
                </td>

                {mostrarTipo && (
                  <td className="p-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                        movimento.tipo === "saida"
                          ? "bg-red-100 text-red-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {movimento.tipo === "saida" ? (
                        <ArrowDownCircle className="w-3 h-3" />
                      ) : (
                        <ArrowUpCircle className="w-3 h-3" />
                      )}

                      {movimento.tipo === "saida" ? "Venda" : "Entrada"}
                    </span>
                  </td>
                )}

                <td className="p-3 font-medium text-gray-800">
                  {movimento.nomeProduto || produto?.nome || "Produto"}
                </td>

                <td className="p-3 text-gray-500">{categoria}</td>

                <td className="p-3 text-center">{quantidade}</td>

                <td className="p-3 text-right font-semibold text-gray-800">
                  {formatarMzn(preco * quantidade)}
                </td>
              </tr>
            );
          })
        )}
      </tbody>
    </table>
  );
}

export default Relatorios;
