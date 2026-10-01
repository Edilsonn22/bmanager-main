import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Banknote,
  ChevronRight,
  CircleX,
  CreditCard,
  CircleCheck,
  History,
  LoaderCircle,
  Maximize2,
  Minus,
  Package,
  PackageSearch,
  Plus,
  RefreshCw,
  Search,
  ShoppingCart,
  Smartphone,
  Trash2,
  UserRound,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";
import { API_URL } from "../api/authenticatedFetch";
import { useAuth } from "../features/auth/AuthContext";
import {
  atualizarVendaOffline,
  carregarSnapshotOffline,
  guardarSnapshotOffline,
  guardarVendaOffline,
  listarVendasOffline,
  removerVendaOffline,
} from "../features/offline/offlineStore";
import { Feedback } from "./ui/Feedback";
import { ProductPhoto } from "./ui/ProductPhoto";
import QRCode from "qrcode";
import {
  carregarScannerGuardado,
  guardarScanner,
  removerScanner,
} from "../utils/scannerSession";

const formatar = (valor) =>
  `${Number(valor || 0).toLocaleString("pt-MZ", {
    minimumFractionDigits: 2,
  })} MZN`;

const pagamentoLabel = (forma) =>
  ({
    dinheiro: "Dinheiro",
    mpesa: "M-Pesa",
    emola: "e-Mola",
    cartao: "Cartão",
    transferencia: "Transferência",
    credito: "Crédito",
  })[forma] || forma;

const METODOS_PAGAMENTO = new Set([
  "dinheiro",
  "mpesa",
  "emola",
  "cartao",
  "transferencia",
  "credito",
]);

const sessaoOfflineValida = () => {
  const token = localStorage.getItem("bmanager.token");
  if (!token) return false;
  try {
    const payload = JSON.parse(
      atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")),
    );
    return Number(payload.exp) * 1000 > Date.now();
  } catch {
    return false;
  }
};

export default function NovaVenda() {
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const buscaRef = useRef(null);
  const pagamentoRef = useRef(null);
  const sincronizacaoEmCurso = useRef(false);

  const [produtos, setProdutos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState("todos");
  const [clientes, setClientes] = useState([]);
  const [busca, setBusca] = useState("");

  const [itens, setItens] = useState(() => {
    try {
      return (JSON.parse(localStorage.getItem("vendai.carrinho")) || []).map(
        (item) => ({
          ...item,
          chave: item.chave || `${item.id}:base`,
          apresentacao_id: item.apresentacao_id || null,
          apresentacao_nome: item.apresentacao_nome || "Unidade",
        }),
      );
    } catch {
      return [];
    }
  });

  const [cliente, setCliente] = useState("");
  const [clienteAvulso, setClienteAvulso] = useState("");
  const [desconto, setDesconto] = useState("");

  const [forma, setForma] = useState(() => {
    const guardada = localStorage.getItem("vendai.metodoPagamento");

    return METODOS_PAGAMENTO.has(guardada) ? guardada : "dinheiro";
  });

  const [recebido, setRecebido] = useState("");
  const [pagamentosVenda, setPagamentosVenda] = useState([]);
  const [etapa, setEtapa] = useState(1);
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [mensagemOffline, setMensagemOffline] = useState("");
  const [online, setOnline] = useState(() => navigator.onLine);
  const [apiDisponivel, setApiDisponivel] = useState(true);
  const [vendasOffline, setVendasOffline] = useState([]);
  const [sincronizando, setSincronizando] = useState(false);
  const [estadoOfflineAberto, setEstadoOfflineAberto] = useState(false);

  const [caixaAberto, setCaixaAberto] = useState(false);
  const [caixaAtual, setCaixaAtual] = useState(null);
  const [modalCaixaAberto, setModalCaixaAberto] = useState(false);
  const [valorAbertura, setValorAbertura] = useState("");
  const [abrindoCaixa, setAbrindoCaixa] = useState(false);
  const [erroCaixa, setErroCaixa] = useState("");

  const [pareamentoAberto, setPareamentoAberto] = useState(false);
  const [pareamentoSessao, setPareamentoSessao] = useState(
    carregarScannerGuardado,
  );
  const [pareamentoQr, setPareamentoQr] = useState("");
  const [pareamentoErro, setPareamentoErro] = useState("");

  useEffect(() => {
    let ativo = true;
    const atualizarOnline = () => setOnline(navigator.onLine);
    window.addEventListener("online", atualizarOnline);
    window.addEventListener("offline", atualizarOnline);

    const aplicarSnapshot = (snapshot) => {
      setProdutos(snapshot.produtos || []);
      setClientes(snapshot.clientes || []);
      setCategorias(snapshot.categorias || []);
      setCaixaAberto(Boolean(snapshot.caixa?.aberto_hoje));
      setCaixaAtual(snapshot.caixa || null);
    };

    const carregarDados = async () => {
      let temSnapshot = false;
      try {
        const [snapshot, fila] = await Promise.all([
          carregarSnapshotOffline(usuario).catch(() => null),
          listarVendasOffline(usuario).catch(() => []),
        ]);
        if (!ativo) return;
        setVendasOffline(fila);
        if (snapshot) {
          temSnapshot = true;
          aplicarSnapshot(snapshot);
        }

        if (!navigator.onLine) {
          if (!snapshot) {
            setErro("Abra esta página com internet pelo menos uma vez para preparar o uso offline.");
          }
          return;
        }

        const respostas = await Promise.all([
          fetch(`${API_URL}/produtos`),
          fetch(`${API_URL}/clientes`),
          fetch(`${API_URL}/caixa`),
          fetch(`${API_URL}/categorias`),
        ]);
        const dados = await Promise.all(respostas.map((resposta) => resposta.json()));
        if (respostas.some((resposta) => !resposta.ok) || dados.some((item) => !item.sucesso)) {
          throw new Error(dados.find((item) => item.erro)?.erro || "Não foi possível carregar os dados.");
        }
        const novoSnapshot = {
          produtos: dados[0].produtos || [],
          clientes: dados[1].clientes || [],
          caixa: dados[2].caixa || null,
          categorias: dados[3].categorias || [],
        };
        await guardarSnapshotOffline(usuario, novoSnapshot);
        if (ativo) {
          setApiDisponivel(true);
          aplicarSnapshot(novoSnapshot);
        }
      } catch (error) {
        if (ativo) setApiDisponivel(false);
        if (ativo && !temSnapshot) {
          setErro(error.message || "Não foi possível carregar os dados guardados.");
        }
      } finally {
        if (ativo) setCarregando(false);
      }
    };

    carregarDados();
    return () => {
      ativo = false;
      window.removeEventListener("online", atualizarOnline);
      window.removeEventListener("offline", atualizarOnline);
    };
  }, [usuario]);

  const sincronizarFilaOffline = useCallback(async () => {
    if (!navigator.onLine || !usuario || sincronizacaoEmCurso.current) return;
    sincronizacaoEmCurso.current = true;
    setSincronizando(true);
    try {
      const fila = await listarVendasOffline(usuario);
      setVendasOffline(fila);
      for (const venda of fila) {
        if (venda.estado === "revisao") {
          const respostaEstado = await fetch(
            `${API_URL}/vendas/offline-status/${venda.idempotencyKey}`,
          );
          if (respostaEstado.ok) {
            const estado = await respostaEstado.json();
            if (estado.estado === "sincronizada") {
              await removerVendaOffline(venda.idempotencyKey);
              continue;
            }
            if (estado.estado === "revisao") continue;
          }
        }

        const resposta = await fetch(`${API_URL}/vendas`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(venda.payload),
        });
        const dados = await resposta.json();
        setApiDisponivel(true);
        if (resposta.status === 202 && dados.requer_revisao) {
          await atualizarVendaOffline(venda.idempotencyKey, {
            estado: "revisao",
            erro: dados.erro,
          });
        } else if (resposta.ok && dados.sucesso) {
          await removerVendaOffline(venda.idempotencyKey);
        } else {
          await atualizarVendaOffline(venda.idempotencyKey, {
            estado: "erro",
            erro: dados.erro || "Não foi possível sincronizar esta venda.",
          });
        }
      }
      setVendasOffline(await listarVendasOffline(usuario));
    } catch {
      setApiDisponivel(false);
      // A fila permanece no dispositivo até a API confirmar cada venda.
    } finally {
      sincronizacaoEmCurso.current = false;
      setSincronizando(false);
    }
  }, [usuario]);

  useEffect(() => {
    if (!online || carregando || !usuario) return undefined;
    const sincronizar = () => sincronizarFilaOffline();
    sincronizar();
    const intervalo = window.setInterval(sincronizar, 15000);
    return () => window.clearInterval(intervalo);
  }, [online, carregando, sincronizarFilaOffline, usuario]);

  useEffect(() => {
    if (!mensagemOffline) return undefined;
    const timeout = window.setTimeout(() => setMensagemOffline(""), 5000);
    return () => window.clearTimeout(timeout);
  }, [mensagemOffline]);

  useEffect(
    () => localStorage.setItem("vendai.carrinho", JSON.stringify(itens)),
    [itens],
  );

  const produtosComStockLocal = useMemo(() => {
    const reservadas = new Map();
    for (const venda of vendasOffline) {
      for (const item of venda.payload.itens || []) {
        const produto = produtos.find((atual) => Number(atual.id) === Number(item.produto_id));
        const apresentacao = produto?.apresentacoes?.find(
          (atual) => Number(atual.id) === Number(item.apresentacao_id),
        );
        const quantidadeBase = Number(item.quantidade) * Number(apresentacao?.fator_conversao || 1);
        reservadas.set(
          Number(item.produto_id),
          (reservadas.get(Number(item.produto_id)) || 0) + quantidadeBase,
        );
      }
    }
    return produtos.map((produto) => ({
      ...produto,
      quantidade: Math.max(
        0,
        Number(produto.quantidade) - (reservadas.get(Number(produto.id)) || 0),
      ),
    }));
  }, [produtos, vendasOffline]);

  const visiveis = useMemo(() => {
    const q = busca.trim().toLowerCase();

    return produtosComStockLocal.filter(
      (p) =>
        Number(p.quantidade) > 0 &&
        (categoriaSelecionada === "todos" ||
          Number(p.idCategoria) === Number(categoriaSelecionada)) &&
        (!q ||
          p.nome.toLowerCase().includes(q) ||
          p.codigo_barras === q ||
          p.apresentacoes?.some((a) => a.codigo_barras === q)),
    );
  }, [produtosComStockLocal, busca, categoriaSelecionada]);

  const subtotal = itens.reduce(
    (s, i) => s + i.quantidade * Number(i.preco),
    0,
  );

  const total = Math.max(0, subtotal - Number(desconto || 0));

  const totalPago = pagamentosVenda.reduce(
    (soma, pagamento) => soma + Number(pagamento.valor),
    0,
  );

  const saldoPendente = Math.max(
    0,
    Math.round((total - totalPago) * 100) / 100,
  );

  const troco = pagamentosVenda.reduce(
    (soma, pagamento) => soma + Number(pagamento.troco || 0),
    0,
  );

  useEffect(() => {
    if (etapa !== 2) return;
    setRecebido("");
    window.setTimeout(() => pagamentoRef.current?.focus(), 0);
  }, [etapa]);

  const adicionar = useCallback(
    (p, apresentacao = null) =>
      setItens((atuais) => {
        const chave = `${p.id}:${apresentacao?.id || "base"}`;
        const fator = Number(apresentacao?.fator_conversao || 1);
        const stock = Math.floor(Number(p.quantidade) / fator);

        const atual = atuais.find((i) => i.chave === chave);

        if (atual) {
          if (atual.quantidade >= stock) {
            setErro(
              `Stock disponível para ${p.nome}: ${stock} ${
                apresentacao?.nome || p.unidade_base || "Unidade"
              }.`,
            );

            return atuais;
          }

          return atuais.map((i) =>
            i.chave === chave ? { ...i, quantidade: i.quantidade + 1 } : i,
          );
        }

        return [
          ...atuais,
          {
            id: p.id,
            chave,
            nome: p.nome,
            tem_imagem: Boolean(p.tem_imagem),
            apresentacao_id: apresentacao?.id || null,
            apresentacao_nome:
              apresentacao?.nome || p.unidade_base || "Unidade",
            preco: Number(apresentacao?.preco || p.preco),
            quantidade: 1,
            stock,
          },
        ];
      }),
    [],
  );

  const adicionarPorCodigo = useCallback(
    (codigo) => {
      const valor = String(codigo || "").trim();

      const produto = produtos.find(
        (item) =>
          item.codigo_barras === valor ||
          item.apresentacoes?.some((a) => a.codigo_barras === valor),
      );

      if (!produto) return false;

      adicionar(
        produto,
        produto.apresentacoes?.find((a) => a.codigo_barras === valor) || null,
      );

      return true;
    },
    [adicionar, produtos],
  );

  const abrirPareamento = async () => {
    setPareamentoAberto(true);
    setPareamentoErro("");
    setPareamentoQr("");

    try {
      if (pareamentoSessao?.url) {
        setPareamentoQr(
          await QRCode.toDataURL(pareamentoSessao.url, {
            width: 320,
            margin: 2,
            errorCorrectionLevel: "M",
          }),
        );

        return;
      }

      const resposta = await fetch(`${API_URL}/scanner/sessoes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          origem: import.meta.env.VITE_PUBLIC_APP_URL || window.location.origin,
        }),
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(dados.erro || "Não foi possível ligar o telemóvel.");
      }

      setPareamentoSessao(dados.sessao);
      guardarScanner(dados.sessao);

      setPareamentoQr(
        await QRCode.toDataURL(dados.sessao.url, {
          width: 320,
          margin: 2,
          errorCorrectionLevel: "M",
        }),
      );
    } catch (error) {
      setPareamentoErro(error.message);
    }
  };

  useEffect(() => {
    if (!pareamentoSessao?.id) return undefined;

    let ativo = true;

    const consultar = async () => {
      try {
        const resposta = await fetch(
          `${API_URL}/scanner/sessoes/${pareamentoSessao.id}/codigos`,
        );

        const dados = await resposta.json();

        if (!resposta.ok) {
          if ([404, 410].includes(resposta.status)) {
            removerScanner();
            setPareamentoSessao(null);
            setPareamentoQr("");
          }

          throw new Error(dados.erro || "Ligação interrompida.");
        }

        dados.codigos?.forEach(({ codigo }) => {
          setBusca(codigo);

          if (adicionarPorCodigo(codigo)) {
            setErro("");
          } else {
            setErro(
              `O código ${codigo} lido no telemóvel não está cadastrado.`,
            );
          }
        });

        if (dados.expirada) {
          removerScanner();
          setPareamentoSessao(null);
          setPareamentoQr("");
          setPareamentoErro("A ligação expirou. Gere um novo QR Code.");
        }
      } catch (error) {
        if (ativo) {
          setPareamentoErro(error.message);
        }
      }
    };

    consultar();

    const intervalo = setInterval(consultar, 450);

    return () => {
      ativo = false;
      clearInterval(intervalo);
    };
  }, [adicionarPorCodigo, pareamentoSessao]);

  const fecharPareamento = () => {
    setPareamentoAberto(false);
  };

  const desligarScanner = () => {
    if (pareamentoSessao?.id) {
      fetch(`${API_URL}/scanner/sessoes/${pareamentoSessao.id}`, {
        method: "DELETE",
      }).catch(() => {});
    }

    removerScanner();

    setPareamentoAberto(false);
    setPareamentoSessao(null);
    setPareamentoQr("");
    setPareamentoErro("");
  };

  const lerCodigo = (evento) => {
    if (evento.key !== "Enter") return;

    evento.preventDefault();

    const codigo = busca.trim();

    if (!adicionarPorCodigo(codigo)) {
      return setErro("Nenhum produto possui este código de barras.");
    }

    setBusca("");
  };

  const quantidade = (chave, delta) =>
    setItens((atuais) =>
      atuais.map((i) =>
        i.chave === chave
          ? {
              ...i,
              quantidade: Math.min(i.stock, Math.max(1, i.quantidade + delta)),
            }
          : i,
      ),
    );

  const avancarPagamento = () => {
    setErro("");

    if (!itens.length) {
      setErro("Adicione pelo menos um produto.");
      return;
    }

    if (caixaAberto) {
      setEtapa(2);
      return;
    }

    setErroCaixa("");
    setValorAbertura("");
    setModalCaixaAberto(true);
  };

  const abrirCaixaEContinuar = async () => {
    const valor = Number(valorAbertura);

    if (valorAbertura === "" || !Number.isFinite(valor) || valor < 0) {
      setErroCaixa("Informe um valor inicial válido.");
      return;
    }

    setAbrindoCaixa(true);
    setErroCaixa("");

    try {
      const resposta = await fetch(`${API_URL}/caixa/abrir`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          valor_abertura: valor,
        }),
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(dados.erro || "Não foi possível abrir o caixa.");
      }

      setCaixaAberto(true);

      setCaixaAtual({
        id: dados.id,
        estado: "aberto",
        aberto_hoje: 1,
        valor_abertura: valor,
      });

      setModalCaixaAberto(false);
      setEtapa(2);
    } catch (error) {
      setErroCaixa(error.message);
    } finally {
      setAbrindoCaixa(false);
    }
  };

  const selecionarMetodoPagamento = (metodo) => {
    setForma(metodo);
    setRecebido("");

    localStorage.setItem("vendai.metodoPagamento", metodo);
  };

  const adicionarPagamento = () => {
    setErro("");

    if (saldoPendente <= 0) return;

    if (forma === "credito" && !cliente) {
      setErro("Selecione um cliente para utilizar crédito.");

      return;
    }

    const informado = Number(recebido);

    if (!Number.isFinite(informado) || informado <= 0) {
      setErro("Informe o valor deste pagamento.");
      return;
    }

    if (forma !== "dinheiro" && informado > saldoPendente) {
      setErro(
        `O valor não pode ser superior ao saldo de ${formatar(saldoPendente)}.`,
      );

      return;
    }

    const valor =
      forma === "dinheiro" ? Math.min(informado, saldoPendente) : informado;

    setPagamentosVenda((atuais) => [
      ...atuais,
      {
        id: `${Date.now()}-${atuais.length}`,
        forma,
        valor: Math.round(valor * 100) / 100,
        valor_recebido: forma === "dinheiro" ? informado : valor,
        troco:
          forma === "dinheiro"
            ? Math.max(0, Math.round((informado - valor) * 100) / 100)
            : 0,
      },
    ]);

    setRecebido("");
    window.setTimeout(() => pagamentoRef.current?.focus(), 0);
  };

  const concluir = async () => {
    setErro("");

    if (saldoPendente > 0) {
      setErro(`Ainda falta pagar ${formatar(saldoPendente)}.`);

      return;
    }

    setEnviando(true);
    setMensagemOffline("");
    const idempotenciaId = crypto.randomUUID();
    const payload = {
      idempotencia_id: idempotenciaId,
      venda_offline: !navigator.onLine,
      itens: itens.map((item) => ({
        produto_id: item.id,
        nome_produto: item.nome,
        apresentacao_id: item.apresentacao_id,
        apresentacao_nome: item.apresentacao_nome,
        quantidade: item.quantidade,
        preco_esperado: Number(item.preco),
      })),
      cliente_id: cliente || null,
      cliente_nome: cliente ? null : clienteAvulso.trim() || null,
      desconto: Number(desconto || 0),
      pagamentos: pagamentosVenda.map(
        ({ forma: metodo, valor, valor_recebido: valorRecebido }) => ({
          forma: metodo,
          valor,
          valor_recebido: valorRecebido,
        }),
      ),
    };

    const guardarNaFila = async () => {
      if (!sessaoOfflineValida()) {
        throw new Error("A sessão expirou. Ligue-se à internet e inicie sessão novamente antes de vender offline.");
      }
      if (!caixaAberto || !caixaAtual) {
        throw new Error("É necessário ter aberto o caixa e carregado os dados antes de vender offline.");
      }
      const venda = {
        idempotencyKey: idempotenciaId,
        criadaEm: Date.now(),
        estado: "pendente",
        total,
        payload: { ...payload, venda_offline: true },
      };
      await guardarVendaOffline(usuario, venda);
      setVendasOffline((atuais) => [...atuais, venda]);
      localStorage.removeItem("vendai.carrinho");
      setItens([]);
      setPagamentosVenda([]);
      setRecebido("");
      setEtapa(1);
      setMensagemOffline("Venda guardada neste dispositivo. Será sincronizada quando a internet voltar.");
    };

    try {
      if (!navigator.onLine) {
        await guardarNaFila();
        return;
      }
      const resposta = await fetch(`${API_URL}/vendas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const dados = await resposta.json();
      if (resposta.status === 202 && dados.requer_revisao) {
        const venda = {
          idempotencyKey: idempotenciaId,
          criadaEm: Date.now(),
          estado: "revisao",
          erro: dados.erro,
          total,
          payload: { ...payload, venda_offline: true },
        };
        await guardarVendaOffline(usuario, venda);
        setVendasOffline((atuais) => [...atuais, venda]);
        setMensagemOffline("Venda registada no dispositivo e enviada para revisão do gestor.");
        setItens([]);
        setPagamentosVenda([]);
        setEtapa(1);
        return;
      }
      if (!resposta.ok) throw new Error(dados.erro || "Não foi possível concluir a venda.");
      localStorage.removeItem("vendai.carrinho");
      setItens([]);
      setPagamentosVenda([]);
      navigate(`/vendas/${dados.venda.id}?concluida=1`, { replace: true });
    } catch (error) {
      if (error instanceof TypeError) {
        setApiDisponivel(false);
        try {
          await guardarNaFila();
          return;
        } catch (erroOffline) {
          setErro(erroOffline.message);
        }
      } else {
        setErro(error.message || "Não foi possível concluir a venda.");
      }
    } finally {
      setEnviando(false);
    }
  };

  return (
    <main className="commerce-page h-dvh w-full min-w-0 flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-6 lg:flex lg:flex-col lg:overflow-hidden lg:p-5 xl:p-6">
      <header className="commerce-header mb-5 flex min-w-0 flex-col gap-4 sm:mb-6 sm:flex-row sm:items-center sm:justify-between lg:mb-3 lg:gap-3">
        <div className="min-w-0">
          <h1 className="mt-1 ml-1 text-2xl font-bold text-slate-900">Nova venda</h1>

          {/*<p className="text-slate-600 lg:text-sm">
            Adicione produtos e conclua o pagamento.
          </p>*/}
        </div>

        <div className="flex w-full gap-2 sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <button
              type="button"
              onClick={() => setEstadoOfflineAberto((aberto) => !aberto)}
              aria-expanded={estadoOfflineAberto}
              aria-controls="estado-sincronizacao"
              aria-label={
                !online || !apiDisponivel
                  ? "Estado offline"
                  : vendasOffline.length
                    ? `${vendasOffline.length} venda(s) por sincronizar`
                    : "Estado online"
              }
              title={
                sincronizando
                  ? "A sincronizar vendas"
                  : !online || !apiDisponivel
                  ? "Offline"
                  : vendasOffline.length
                    ? "Vendas por sincronizar"
                    : "Online"
              }
              className={`flex w-full items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold shadow-sm transition sm:w-auto ${!online || !apiDisponivel ? "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100" : vendasOffline.length ? "border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100" : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"}`}
            >
              {sincronizando ? (
                <RefreshCw className="animate-spin" size={18} />
              ) : !online || !apiDisponivel ? (
                <WifiOff size={18} />
              ) : (
                <Wifi size={18} />
              )}
              <span className="sm:hidden">
                {sincronizando
                  ? "A sincronizar"
                  : !online || !apiDisponivel
                  ? "Offline"
                  : vendasOffline.length
                    ? `${vendasOffline.length} pendente(s)`
                    : "Online"}
              </span>
              {vendasOffline.length > 0 && (
                <span className="hidden rounded-full bg-white px-2 py-0.5 text-xs tabular-nums sm:inline">
                  {vendasOffline.length}
                </span>
              )}
            </button>
            {estadoOfflineAberto && (
              <section
                id="estado-sincronizacao"
                className="absolute right-0 top-full z-[100] mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-xl border border-slate-200 bg-white p-4 text-left shadow-xl"
                aria-label="Estado da ligação e sincronização"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">
                      {sincronizando
                        ? "A sincronizar vendas"
                        : !online || !apiDisponivel
                          ? "Modo offline"
                          : "Ligação online"}
                    </h2>
                    <p className="mt-1 text-xs leading-5 text-slate-600">
                      {!online || !apiDisponivel
                        ? "A usar os dados guardados neste dispositivo."
                        : "A ligação ao sistema está disponível."}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEstadoOfflineAberto(false)}
                    aria-label="Fechar estado da ligação"
                    className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  >
                    <X size={17} />
                  </button>
                </div>
                <div className="mt-3 border-t border-slate-100 pt-3">
                  <p className="text-xs font-semibold text-slate-700">
                    {vendasOffline.length
                      ? `${vendasOffline.length} venda(s) por sincronizar ou rever`
                      : "Sem vendas pendentes"}
                  </p>
                  {vendasOffline.length > 0 && (
                    <>
                      <ul className="mt-2 max-h-40 divide-y divide-slate-100 overflow-y-auto">
                        {vendasOffline.slice(0, 5).map((venda) => (
                          <li key={venda.idempotencyKey} className="flex items-center justify-between gap-3 py-2 text-xs">
                            <span className="text-slate-600">
                              {new Date(venda.criadaEm).toLocaleTimeString("pt-MZ", { hour: "2-digit", minute: "2-digit" })} · {formatar(venda.total)}
                            </span>
                            <span className={venda.estado === "revisao" ? "font-semibold text-amber-700" : venda.estado === "erro" ? "font-semibold text-red-700" : "font-semibold text-indigo-700"}>
                              {venda.estado === "revisao" ? "Revisão" : venda.estado === "erro" ? "Falha" : "Pendente"}
                            </span>
                          </li>
                        ))}
                      </ul>
                      <button
                        type="button"
                        onClick={sincronizarFilaOffline}
                        disabled={!online || enviando}
                        className="mt-3 w-full rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                      >
                        {sincronizando
                          ? "A sincronizar..."
                          : !online || !apiDisponivel
                            ? "Tentar sincronizar"
                            : "Sincronizar agora"}
                      </button>
                    </>
                  )}
                </div>
              </section>
            )}
          </div>
          <Link
            to="/vendas"
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 font-semibold text-gray-700 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:text-indigo-700 hover:shadow-md sm:flex-none"
          >
            <History size={18} />
            Histórico
          </Link>
        </div>
      </header>

      <Feedback tipo="erro" className="mb-4" onClose={() => setErro("")}>
        {erro}
      </Feedback>
      {mensagemOffline && (
        <div className="fixed bottom-4 right-4 z-[180] flex max-w-sm items-start gap-3 rounded-xl border border-emerald-200 bg-white p-4 text-sm text-emerald-800 shadow-xl" role="status" aria-live="polite">
          <CircleCheck className="mt-0.5 shrink-0 text-emerald-600" size={19} />
          <p className="min-w-0 flex-1">{mensagemOffline}</p>
          <button
            type="button"
            onClick={() => setMensagemOffline("")}
            aria-label="Fechar notificação"
            className="-mr-1 -mt-1 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {etapa === 1 ? (
        <div className="grid min-w-0 items-start gap-4 lg:min-h-0 lg:flex-1 lg:items-stretch lg:grid-cols-[minmax(0,1fr)_340px] xl:gap-5 xl:grid-cols-[minmax(0,1fr)_380px] 2xl:grid-cols-[minmax(0,1fr)_400px]">
          <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:flex lg:min-h-0 lg:flex-col">
            <div className="shrink-0 border-b border-slate-100 bg-white p-3 sm:p-4">
              <div className="mb-3 flex max-w-full gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <button
                  type="button"
                  onClick={() => setCategoriaSelecionada("todos")}
                  className={`shrink-0 rounded-full border px-3.5 py-2 text-xs font-bold transition ${
                    categoriaSelecionada === "todos"
                      ? "border-indigo-600 bg-indigo-600 text-white shadow-sm shadow-indigo-200"
                      : "border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:text-indigo-700"
                  }`}
                >
                  Todos os produtos
                </button>

                {categorias.map((categoria) => (
                  <button
                    key={categoria.id}
                    type="button"
                    onClick={() =>
                      setCategoriaSelecionada(String(categoria.id))
                    }
                    className={`shrink-0 rounded-full border px-3.5 py-2 text-xs font-bold transition ${
                      String(categoriaSelecionada) === String(categoria.id)
                        ? "border-indigo-600 bg-indigo-600 text-white shadow-sm shadow-indigo-200"
                        : "border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:text-indigo-700"
                    }`}
                  >
                    {categoria.nome}
                  </button>
                ))}
              </div>

              <div className="relative">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />

                <input
                  ref={buscaRef}
                  autoFocus
                  type="search"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  onKeyDown={lerCodigo}
                  placeholder="Pesquisar nome ou código de barras..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2.5 pl-11 pr-32 text-sm outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 sm:pr-40"
                />

                {busca && (
                  <button
                    type="button"
                    onClick={() => {
                      setBusca("");
                      buscaRef.current?.focus();
                    }}
                    aria-label="Limpar pesquisa"
                    className="absolute right-28 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 sm:right-36"
                  >
                    <CircleX size={18} />
                  </button>
                )}

                <button
                  type="button"
                  onClick={abrirPareamento}
                  aria-label={
                    pareamentoSessao
                      ? "Scanner do telemóvel ligado"
                      : "Ligar telemóvel como leitor"
                  }
                  title={
                    pareamentoSessao
                      ? "Scanner ligado — ver ligação"
                      : "Ligar telemóvel como leitor"
                  }
                  className={`absolute right-2 top-1/2 inline-flex -translate-y-1/2 items-center gap-1 rounded-lg px-2.5 py-2 text-xs font-bold text-white ${
                    pareamentoSessao
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-indigo-600 hover:bg-indigo-700"
                  }`}
                >
                  <Smartphone size={17} />

                  <span className="hidden sm:inline">
                    {pareamentoSessao ? "Ligado" : "Telemóvel"}
                  </span>
                </button>
              </div>

              {/*<div className="mt-2 flex flex-col gap-1 text-[11px] text-gray-500 min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between">
                <span className="min-w-0">
                  {pareamentoSessao
                    ? "Scanner ligado: a aguardar leituras do telemóvel"
                    : "Digite para pesquisar ou leia o código e pressione Enter"}
                </span>

                <span className="shrink-0">
                  {visiveis.length} resultados
                </span>
              </div>*/}
            </div>

            <div className="min-h-72 max-w-full overflow-x-hidden overflow-y-auto bg-slate-50/70 p-2.5 sm:max-h-[calc(100dvh-19rem)] sm:p-3 lg:min-h-0 lg:flex-1 lg:max-h-none">
              {carregando && (
                <p
                  className="py-16 text-center text-sm text-gray-500"
                  role="status"
                >
                  A carregar produtos...
                </p>
              )}

              {!carregando && !visiveis.length && (
                <div className="py-16 text-center">
                  <PackageSearch className="mx-auto h-10 w-10 text-gray-300" />

                  <p className="mt-3 font-semibold text-gray-700">
                    Nenhum produto disponível
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    Verifique a pesquisa ou o nível de stock.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 items-stretch gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6">
                {visiveis.map((p) => {
                  const baixo =
                    Number(p.quantidade) <= Number(p.estoque_minimo || 5);

                  return (
                    <article
                      key={p.id}
                      role="button"
                      tabIndex={0}
                      aria-label={`Adicionar ${p.nome}`}
                      onClick={() => adicionar(p)}
                      onKeyDown={(evento) => {
                        if (
                          evento.currentTarget === evento.target &&
                          ["Enter", " "].includes(evento.key)
                        ) {
                          evento.preventDefault();
                          adicionar(p);
                        }
                      }}
                      className="group relative flex h-full min-w-0 cursor-pointer flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm outline-none transition duration-200 hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-200"
                    >
                      <div className="relative grid aspect-[5/4] w-full place-items-center overflow-hidden border-b border-slate-100 bg-slate-50 text-indigo-500 transition group-hover:bg-indigo-50/60">
                        <ProductPhoto
                          produtoId={p.id}
                          temImagem={Boolean(p.tem_imagem)}
                          alt={p.nome}
                          className="absolute inset-0 h-full w-full object-contain p-2"
                        />

                        <span
                          title={`${p.quantidade} em stock`}
                          className={`absolute right-1 top-1 grid min-w-6 place-items-center rounded-full px-1.5 py-0.5 text-[9px] font-extrabold text-white shadow-sm ${
                            baixo ? "bg-amber-500" : "bg-indigo-600"
                          }`}
                        >
                          {p.quantidade}
                        </span>

                        {!p.tem_imagem && (
                          <span className="grid size-12 place-items-center rounded-xl bg-white text-indigo-600 shadow-sm ring-1 ring-slate-100">
                            <Package size={25} strokeWidth={1.6} />
                          </span>
                        )}

                        <span className="absolute bottom-1.5 right-1.5 hidden size-7 place-items-center rounded-full bg-indigo-600 text-white shadow-md transition group-hover:grid">
                          <Plus size={15} />
                        </span>
                      </div>

                      <div className="flex min-w-0 flex-1 flex-col p-2">
                        <h3
                          className="truncate text-xs font-semibold text-slate-900"
                          title={p.nome}
                        >
                          {p.nome}
                        </h3>

                        <div className="mt-1 flex min-w-0 items-end gap-1">
                          <strong className="min-w-0 truncate text-xs text-emerald-700">
                            {formatar(p.preco)}
                          </strong>

                          <span className="shrink-0 text-[9px] font-medium text-slate-400">
                            / {p.unidade_base || "Unidade"}
                          </span>
                        </div>
                      </div>

                      {p.apresentacoes
                        ?.filter((a) => Boolean(a.vendavel))
                        .map((a) => (
                          <button
                            key={a.id}
                            type="button"
                            onClick={(evento) => {
                              evento.stopPropagation();

                              if (
                                Number(p.quantidade) >=
                                Number(a.fator_conversao)
                              ) {
                                adicionar(p, a);
                              }
                            }}
                            aria-disabled={
                              Number(p.quantidade) < Number(a.fator_conversao)
                            }
                            className={`mx-2 mb-2 w-[calc(100%-1rem)] truncate rounded-md border px-1.5 py-1 text-[9px] font-semibold transition ${
                              Number(p.quantidade) < Number(a.fator_conversao)
                                ? "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400"
                                : "border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                            }`}
                          >
                            + {a.nome} · {formatar(a.preco)}
                          </button>
                        ))}
                    </article>
                  );
                })}
              </div>
            </div>
          </section>

          <Carrinho
            itens={itens}
            subtotal={subtotal}
            total={total}
            desconto={desconto}
            setDesconto={setDesconto}
            quantidade={quantidade}
            remover={(chave) =>
              setItens((v) => v.filter((i) => i.chave !== chave))
            }
            limpar={() => setItens([])}
            avancar={avancarPagamento}
          />
        </div>
      ) : null}

      {etapa === 2 && (
        <div className="fixed inset-0 z-[140] grid place-items-center bg-slate-950/60 p-3 backdrop-blur-sm sm:p-5">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="finalizar-pagamento-title"
            className="commerce-panel flex max-h-[88dvh] w-full max-w-3xl flex-col overflow-hidden shadow-2xl"
            onKeyDown={(evento) => {
              const atalhos = {
                F1: "dinheiro",
                F2: "mpesa",
                F3: "emola",
                F4: "cartao",
              };

              if (atalhos[evento.key]) {
                evento.preventDefault();

                selecionarMetodoPagamento(atalhos[evento.key]);
              }
            }}
          >
            <div className="shrink-0 border-b border-slate-100 bg-white p-3 sm:p-4">
              <div className="flex items-center gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-indigo-100 text-indigo-700">
                  <CreditCard size={20} />
                </span>

                <div>
                  <h2
                    id="finalizar-pagamento-title"
                    className="text-lg font-bold text-slate-900 sm:text-xl"
                  >
                    Finalizar pagamento
                  </h2>

                  <p className="text-sm text-slate-500">
                    Confirme o cliente e a forma de pagamento.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setPagamentosVenda([]);
                    setRecebido("");
                    setEtapa(1);
                  }}
                  aria-label="Fechar pagamento"
                  className="ml-auto rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <CircleX size={22} />
                </button>
              </div>
            </div>

            <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-x-hidden overflow-y-auto overscroll-contain p-3 sm:grid-cols-2 sm:p-4">
              <Feedback
                tipo="erro"
                className="sm:col-span-2"
                onClose={() => setErro("")}
              >
                {erro}
              </Feedback>
              <label className="block text-sm font-semibold text-slate-700">
                <span className="mb-1.5 flex items-center gap-2">
                  <UserRound size={16} className="text-slate-400" />
                  Cliente (opcional)
                </span>

                <select
                  value={cliente}
                  onChange={(e) => {
                    setCliente(e.target.value);

                    if (e.target.value) {
                      setClienteAvulso("");
                    }
                  }}
                  className="w-full rounded-xl border border-slate-300 bg-white p-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                >
                  <option value="">Consumidor final</option>

                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
                    </option>
                  ))}
                </select>
              </label>

              {!cliente && (
                <label className="block text-sm font-semibold text-slate-700">
                  Nome do cliente desta venda
                  <input
                    type="text"
                    maxLength="255"
                    value={clienteAvulso}
                    onChange={(e) => setClienteAvulso(e.target.value)}
                    placeholder="Ex.: Ana Manuel (opcional)"
                    className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white p-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                  <span className="mt-1.5 block text-xs font-normal text-slate-500">
                    O nome ficará apenas nesta venda e não criará um cadastro.
                  </span>
                </label>
              )}

              <div className="block text-sm font-semibold text-slate-700 sm:col-span-2">
                <span className="mb-1.5 flex items-center gap-2">
                  <CreditCard size={16} className="text-slate-400" />
                  Forma de pagamento
                </span>

                {(!online || !apiDisponivel) && (
                  <p className="mb-2 rounded-lg bg-amber-50 p-2 text-xs font-medium text-amber-800">
                    Pode registar qualquer método. Pagamentos externos precisam de confirmação fora do sistema enquanto estiver sem ligação.
                  </p>
                )}

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {[
                    ["dinheiro", "Dinheiro",],
                    ["mpesa", "M-Pesa", ],
                    ["emola", "e-Mola", ],
                    ["cartao", "Cartão", ],
                    ["transferencia", "Transferência", ""],
                    ["credito", "Crédito", ""],
                  ].map(([valor, nome, atalho]) => (
                    <button
                      key={valor}
                      type="button"
                      onClick={() => selecionarMetodoPagamento(valor)}
                      className={`flex min-w-0 items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-left transition ${
                        forma === valor
                          ? "border-indigo-500 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-100"
                            : "border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:text-indigo-700"
                            }`}
                    >
                      <span className="truncate">{nome}</span>
                      {atalho && (
                        <small className="hidden rounded bg-white px-1.5 py-0.5 text-[9px] text-slate-400 ring-1 ring-slate-200 lg:inline">
                          {atalho}
                        </small>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="min-w-0 sm:col-span-2">
                <div className="grid min-w-0 gap-2 min-[520px]:grid-cols-[minmax(0,1fr)_auto] min-[520px]:items-end">
                  <label className="block min-w-0 text-sm font-semibold text-slate-700">
                    {forma === "dinheiro"
                      ? "Valor recebido em dinheiro"
                      : "Valor deste pagamento"}

                    <input
                      type="number"
                      ref={pagamentoRef}
                      min="0.01"
                      step="0.01"
                      value={recebido}
                      onChange={(e) => setRecebido(e.target.value)}
                      onKeyDown={(evento) => {
                        if (evento.key === "Enter") {
                          adicionarPagamento();
                        }
                      }}
                      placeholder={saldoPendente.toFixed(2)}
                      className="mt-1.5 w-full rounded-xl border border-slate-300 p-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={adicionarPagamento}
                    disabled={saldoPendente <= 0}
                    className="inline-flex h-[50px] w-full shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-indigo-200 bg-indigo-50 px-4 text-sm font-bold text-indigo-700 hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-50 min-[520px]:w-auto"
                  >
                    <Plus size={16} />

                    {Number(recebido) >= saldoPendente && saldoPendente > 0
                      ? "Lançar completo"
                      : "Lançar pagamento"}
                  </button>
                </div>

                <div className="mt-2 flex min-h-8 flex-wrap gap-1.5">
                  {["exato", 100, 200, 500, 1000].map((opcao) => {
                    const valor = opcao === "exato" ? saldoPendente : opcao;
                    const indisponivel =
                      saldoPendente <= 0 ||
                      (forma !== "dinheiro" && Number(valor) > saldoPendente);
                    return (
                      <button
                        key={opcao}
                        type="button"
                        disabled={indisponivel}
                        onClick={() => setRecebido(Number(valor).toFixed(2))}
                        className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
                          opcao === "exato"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            : "border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:text-indigo-700"
                        }`}
                      >
                        {opcao === "exato" ? "Valor exato" : `${opcao} MZN`}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-3 sm:col-span-2 sm:p-4">
                <div className="grid gap-3 sm:grid-cols-3">
                  <p className="rounded-xl bg-white/80 p-3 text-slate-600">
                    <span className="block text-xs">Total da venda</span>

                    <strong className="mt-1 block break-words text-lg text-slate-900">
                      {formatar(total)}
                    </strong>
                  </p>

                  <p className="rounded-xl bg-white/80 p-3 text-slate-600">
                    <span className="block text-xs">Valor lançado</span>

                    <strong className="mt-1 block break-words text-lg text-emerald-700">
                      {formatar(totalPago)}
                    </strong>
                  </p>

                  <p className="rounded-xl bg-white/80 p-3 text-slate-600">
                    <span className="block text-xs">Falta pagar</span>

                    <strong
                      className={`mt-1 block break-words text-lg ${
                        saldoPendente > 0
                          ? "text-amber-700"
                          : "text-emerald-700"
                      }`}
                    >
                      {formatar(saldoPendente)}
                    </strong>
                  </p>
                </div>

                {Boolean(pagamentosVenda.length) && (
                  <div className="mt-4 space-y-2 border-t border-indigo-100 pt-4">
                    {pagamentosVenda.map((pagamento) => (
                      <div
                        key={pagamento.id}
                        className="flex min-w-0 items-center gap-3 rounded-xl border border-indigo-100 bg-white p-3"
                      >
                        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-indigo-50 text-indigo-600">
                          <CreditCard size={17} />
                        </span>

                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-slate-800">
                            {pagamentoLabel(pagamento.forma)}
                          </p>

                          <p className="text-xs text-slate-500">
                            {formatar(pagamento.valor)}

                            {Number(pagamento.troco) > 0 &&
                              ` · Troco: ${formatar(pagamento.troco)}`}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            setPagamentosVenda((atuais) =>
                              atuais.filter((item) => item.id !== pagamento.id),
                            )
                          }
                          aria-label={`Remover pagamento em ${pagamentoLabel(
                            pagamento.forma,
                          )}`}
                          className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {troco > 0 && (
                  <p className="mt-3 flex min-w-0 justify-between gap-4 rounded-xl bg-emerald-100/70 p-3 text-emerald-800">
                    <span>Troco total</span>

                    <strong className="break-words text-right">
                      {formatar(troco)}
                    </strong>
                  </p>
                )}
              </div>

              <div className="flex flex-col-reverse gap-3 sm:col-span-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setPagamentosVenda([]);

                    setRecebido("");
                    setEtapa(1);
                  }}
                  disabled={enviando}
                  className="w-full rounded-xl border border-slate-300 bg-white p-3 font-semibold text-slate-700 transition hover:bg-slate-50 sm:w-auto sm:min-w-32"
                >
                  Voltar
                </button>

                <button
                  type="button"
                  disabled={
                    enviando || saldoPendente > 0 || !pagamentosVenda.length
                  }
                  onClick={concluir}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 p-3 font-bold text-white shadow-md shadow-indigo-200 transition hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-lg disabled:translate-y-0 disabled:opacity-50 sm:min-w-52"
                >
                  {enviando ? (
                    <>
                      <LoaderCircle
                        size={18}
                        className="animate-spin"
                        aria-hidden="true"
                      />
                      A concluir…
                    </>
                  ) : (
                    "Concluir venda"
                  )}
                </button>
              </div>
            </div>
          </section>
        </div>
      )}

      {modalCaixaAberto && (
        <div className="fixed inset-0 z-[160] grid place-items-center bg-slate-950/65 p-4 backdrop-blur-sm">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="abrir-caixa-title"
            className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl"
          >
            <header className="flex items-start justify-between gap-4 border-b border-slate-100 p-5 sm:p-6">
              <div className="flex min-w-0 gap-3">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-emerald-100 text-emerald-700">
                  <Banknote size={22} />
                </span>

                <div>
                  <h2
                    id="abrir-caixa-title"
                    className="font-bold text-slate-900"
                  >
                    {caixaAtual?.estado === "aberto" && !caixaAtual?.aberto_hoje
                      ? "Caixa anterior por fechar"
                      : "Abra o caixa para continuar"}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {caixaAtual?.estado === "aberto" && !caixaAtual?.aberto_hoje
                      ? "Regularize o caixa anterior antes de iniciar as vendas de hoje."
                      : "Esta será a abertura do caixa para as atividades de hoje."}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setModalCaixaAberto(false)}
                aria-label="Fechar"
                className="shrink-0 rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <CircleX size={21} />
              </button>
            </header>

            <div className="p-5 sm:p-6">
              {caixaAtual?.estado === "aberto" && !caixaAtual?.aberto_hoje ? (
                <>
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
                    Por segurança, informe o valor contado e feche o caixa
                    anterior. O carrinho ficará guardado para continuar esta
                    venda depois.
                  </div>

                  <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={() => setModalCaixaAberto(false)}
                      className="rounded-xl border border-slate-300 px-4 py-3 font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Continuar na venda
                    </button>

                    <button
                      type="button"
                      onClick={() => navigate("/caixa")}
                      className="rounded-xl bg-amber-600 px-4 py-3 font-bold text-white hover:bg-amber-700"
                    >
                      Fechar caixa anterior
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <label className="block text-sm font-semibold text-slate-700">
                    Valor inicial para trocos
                    <div className="relative mt-2">
                      <input
                        autoFocus
                        type="number"
                        min="0"
                        step="0.01"
                        value={valorAbertura}
                        onChange={(evento) =>
                          setValorAbertura(evento.target.value)
                        }
                        onKeyDown={(evento) => {
                          if (evento.key === "Enter") {
                            abrirCaixaEContinuar();
                          }
                        }}
                        placeholder="0,00"
                        className="w-full rounded-xl border border-slate-300 bg-slate-50 p-3 pr-16 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                      />

                      <span className="absolute right-3 top-3 text-sm font-bold text-slate-400">
                        MZN
                      </span>
                    </div>
                  </label>

                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    Pode informar 0,00 quando não existir dinheiro inicial no
                    caixa.
                  </p>

                  <Feedback tipo="erro" className="mt-4">
                    {erroCaixa}
                  </Feedback>

                  <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={() => setModalCaixaAberto(false)}
                      disabled={abrindoCaixa}
                      className="rounded-xl border border-slate-300 px-4 py-3 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                    >
                      Cancelar
                    </button>

                    <button
                      type="button"
                      onClick={abrirCaixaEContinuar}
                      disabled={abrindoCaixa || valorAbertura === ""}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 font-bold text-white shadow-md shadow-emerald-100 hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {abrindoCaixa ? (
                        <>
                          <LoaderCircle size={18} className="animate-spin" />A
                          abrir...
                        </>
                      ) : (
                        "Abrir caixa e continuar"
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </section>
        </div>
      )}

      {pareamentoAberto && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/80 p-3 backdrop-blur-sm sm:p-6">
          <section
            role="dialog"
            aria-modal="true"
            aria-label="Ligar telemóvel como leitor"
            className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl"
          >
            <header className="flex items-center justify-between border-b border-slate-100 p-5">
              <div>
                <h2 className="font-bold text-slate-900">
                  {pareamentoSessao ? "Scanner ligado" : "Ligar telemóvel"}
                </h2>

                <p className="text-xs text-slate-500">
                  Use o telemóvel como leitor desta venda.
                </p>
              </div>

              <button
                type="button"
                onClick={fecharPareamento}
                aria-label="Fechar ligação"
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <CircleX size={22} />
              </button>
            </header>

            <div className="p-5 text-center">
              {pareamentoQr && !pareamentoErro && (
                <img
                  src={pareamentoQr}
                  alt="QR Code para ligar o telemóvel"
                  className="mx-auto w-full max-w-64 rounded-2xl border border-slate-100"
                />
              )}

              {!pareamentoQr && !pareamentoErro && (
                <div className="grid min-h-64 place-items-center rounded-2xl bg-slate-50 text-sm text-slate-500">
                  A preparar ligação segura...
                </div>
              )}

              <p
                className={`mt-4 rounded-xl p-3 text-sm ${
                  pareamentoErro
                    ? "bg-red-50 text-red-700"
                    : "bg-indigo-50 text-indigo-800"
                }`}
              >
                {pareamentoErro ||
                  "Leia este QR Code com a câmara normal do telemóvel. Depois, cada produto lido será adicionado automaticamente aqui."}
              </p>

              {!pareamentoErro && pareamentoQr && (
                <p className="mt-3 text-xs text-slate-500">
                  Emparelhe uma vez, instale o Vendaí Scanner e faça várias
                  leituras seguidas. A autorização permanece ativa durante 30
                  dias.
                </p>
              )}

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={desligarScanner}
                  className="w-full rounded-xl border border-red-200 py-2.5 font-semibold text-red-700 hover:bg-red-50"
                >
                  Desligar aparelho
                </button>

                <button
                  type="button"
                  onClick={fecharPareamento}
                  className="w-full rounded-xl bg-indigo-600 py-2.5 font-semibold text-white hover:bg-indigo-700"
                >
                  Continuar ligado
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

function Carrinho({
  itens,
  subtotal,
  total,
  desconto,
  setDesconto,
  quantidade,
  remover,
  limpar,
  avancar,
}) {
  const [visaoCompleta, setVisaoCompleta] = useState(false);
  const totalItens = itens.reduce(
    (soma, item) => soma + Number(item.quantidade || 0),
    0,
  );

  return (
    <>
    <aside className="commerce-panel min-w-0 self-start overflow-hidden lg:flex lg:h-full lg:min-h-0 lg:self-stretch lg:flex-col">
      <div className="flex min-w-0 shrink-0 items-center border-b border-gray-100 bg-gradient-to-r from-white to-indigo-50/50 p-3">
        <span className="mr-2.5 grid size-9 shrink-0 place-items-center rounded-lg bg-indigo-100 text-indigo-700">
          <ShoppingCart size={17} />
        </span>

        <div className="min-w-0">
          <h2 className="font-bold text-gray-900">Carrinho</h2>
          <p className="text-xs text-slate-500">
            {totalItens
              ? `${totalItens} ${totalItens === 1 ? "item" : "itens"}`
              : "Nenhum item adicionado"}
          </p>
        </div>

        {Boolean(itens.length) && (
          <div className="ml-auto flex items-center gap-1">
            <button
              type="button"
              onClick={() => setVisaoCompleta(true)}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-50"
              title="Ver todos os produtos do carrinho"
            >
              <Maximize2 size={14} />
              <span className="hidden xl:inline">Ver todos</span>
            </button>
            <button
              type="button"
              onClick={limpar}
              className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
            >
              Limpar
            </button>
          </div>
        )}
      </div>

      <div className="max-h-[52dvh] max-w-full space-y-1.5 overflow-x-hidden overflow-y-auto bg-slate-50/40 p-2 lg:min-h-0 lg:flex-1 lg:max-h-none">
        {!itens.length && (
          <div className="py-12 text-center">
            <ShoppingCart className="mx-auto h-9 w-9 text-gray-300" />

            <p className="mt-3 text-sm font-semibold text-gray-600">
              O carrinho está vazio
            </p>

            <p className="mt-1 text-xs text-gray-400">
              Selecione um produto para começar.
            </p>
          </div>
        )}

        {itens.map((i) => (
          <article
            key={i.chave || `${i.id}:base`}
            className="min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-white p-2 shadow-sm transition hover:border-indigo-200"
          >
            <div className="flex min-w-0 items-center gap-2">
              <div className="relative grid size-9 shrink-0 place-items-center overflow-hidden rounded-md border border-slate-100 bg-slate-50 text-slate-300">
                <Package size={16} strokeWidth={1.6} />
                <ProductPhoto
                  produtoId={i.id}
                  temImagem={Boolean(i.tem_imagem)}
                  alt={i.nome}
                  className="absolute inset-0 h-full w-full object-contain p-1"
                />
              </div>

              <div className="min-w-0 flex-1">
                <strong
                  className="block truncate text-xs text-slate-900"
                  title={i.nome}
                >
                  {i.nome}
                </strong>
                <div className="mt-0.5 flex min-w-0 items-center gap-1 text-[10px]">
                  <span className="max-w-20 truncate rounded bg-indigo-50 px-1 py-0.5 font-semibold text-indigo-700">
                    {i.apresentacao_nome || "Unidade"}
                  </span>
                  <span className="truncate text-slate-500">
                    {formatar(i.preco)} cada
                  </span>
                </div>
              </div>

              <button
                type="button"
                aria-label={`Remover ${i.nome}`}
                onClick={() => remover(i.chave)}
                className="grid size-7 shrink-0 place-items-center rounded-md text-slate-400 transition hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 size={14} />
              </button>
            </div>

            <div className="mt-1.5 flex items-center justify-between gap-2 pl-11">
              <div className="flex h-7 items-center overflow-hidden rounded-md border border-slate-200 bg-slate-50">
                <button
                  type="button"
                  aria-label="Diminuir quantidade"
                  onClick={() => quantidade(i.chave, -1)}
                  className="grid h-full w-7 place-items-center text-slate-600 transition hover:bg-indigo-50 hover:text-indigo-700"
                >
                  <Minus size={13} />
                </button>
                <span className="grid h-full min-w-8 place-items-center border-x border-slate-200 bg-white text-xs font-bold text-slate-800">
                  {i.quantidade}
                </span>
                <button
                  type="button"
                  aria-label="Aumentar quantidade"
                  onClick={() => quantidade(i.chave, 1)}
                  className="grid h-full w-7 place-items-center text-slate-600 transition hover:bg-indigo-50 hover:text-indigo-700"
                >
                  <Plus size={13} />
                </button>
              </div>

              <div className="min-w-0 text-right">
                <b className="block truncate text-xs text-slate-900">
                  {formatar(i.quantidade * i.preco)}
                </b>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="shrink-0 border-t border-slate-100 bg-white p-3">
        <div className="rounded-lg bg-slate-50 px-3 py-2.5">
          <p className="flex min-w-0 justify-between gap-3 text-sm">
            <span>Subtotal</span>

            <span className="min-w-0 break-words text-right">
              {formatar(subtotal)}
            </span>
          </p>

          <p className="mt-2 flex min-w-0 justify-between gap-3 border-t border-slate-200 pt-2 text-base">
            <strong>Total</strong>

            <strong className="min-w-0 break-words text-right">
              {formatar(total)}
            </strong>
          </p>
        </div>

        <label className="mt-2 flex items-center gap-3 text-xs font-semibold text-slate-600">
          <span className="shrink-0">Desconto</span>
          <div className="relative min-w-0 flex-1">
            <input
              type="text"
              inputMode="decimal"
              placeholder="0,00"
              value={desconto}
              onChange={(e) => {
                const valor = e.target.value.replace(",", ".");
                if (/^\d*\.?\d{0,2}$/.test(valor)) setDesconto(valor);
              }}
              className="w-full rounded-lg border border-slate-300 bg-white py-1.5 pl-2 pr-11 text-right text-xs outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-medium text-slate-400">MZN</span>
          </div>
        </label>

        <button
          type="button"
          onClick={avancar}
          disabled={!itens.length}
          className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 p-2.5 text-sm font-bold text-white shadow-md shadow-indigo-200 transition hover:-translate-y-0.5 hover:bg-indigo-700 disabled:translate-y-0 disabled:opacity-50"
        >
          Continuar para pagamento
          <ChevronRight size={18} />
        </button>
      </div>
    </aside>

    {visaoCompleta && (
      <div
        className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/50 p-3 backdrop-blur-sm sm:p-6"
        role="dialog"
        aria-modal="true"
        aria-label="Visão geral do carrinho"
        onMouseDown={(evento) => {
          if (evento.target === evento.currentTarget) setVisaoCompleta(false);
        }}
      >
        <section className="flex max-h-[92dvh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
          <header className="flex shrink-0 items-center gap-3 border-b border-slate-200 px-4 py-3.5 sm:px-5">
            <span className="grid size-10 place-items-center rounded-xl bg-indigo-100 text-indigo-700">
              <ShoppingCart size={19} />
            </span>
            <div className="min-w-0">
              <h2 className="font-bold text-slate-900">Visão geral do carrinho</h2>
              <p className="text-xs text-slate-500">
                {itens.length} {itens.length === 1 ? "produto" : "produtos"} · {totalItens} {totalItens === 1 ? "item" : "itens"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setVisaoCompleta(false)}
              aria-label="Fechar visão geral"
              className="ml-auto grid size-9 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
            >
              <CircleX size={21} />
            </button>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="hidden grid-cols-[minmax(0,1fr)_130px_130px_42px] gap-3 border-b border-slate-100 bg-slate-50 px-5 py-2.5 text-[11px] font-bold uppercase tracking-wide text-slate-500 sm:grid">
              <span>Produto</span>
              <span className="text-center">Quantidade</span>
              <span className="text-right">Subtotal</span>
              <span />
            </div>

            <div className="divide-y divide-slate-100 px-4 sm:px-5">
              {itens.map((item) => (
                <article
                  key={`geral-${item.chave || `${item.id}:base`}`}
                  className="grid min-w-0 gap-3 py-3.5 sm:grid-cols-[minmax(0,1fr)_130px_130px_42px] sm:items-center"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="relative grid size-12 shrink-0 place-items-center overflow-hidden rounded-lg bg-slate-50 text-slate-300 ring-1 ring-slate-100">
                      <Package size={19} />
                      <ProductPhoto
                        produtoId={item.id}
                        temImagem={Boolean(item.tem_imagem)}
                        alt={item.nome}
                        className="absolute inset-0 h-full w-full object-contain p-1"
                      />
                    </div>
                    <div className="min-w-0">
                      <strong className="block truncate text-sm text-slate-900" title={item.nome}>
                        {item.nome}
                      </strong>
                      <p className="mt-0.5 truncate text-xs text-slate-500">
                        {item.apresentacao_nome || "Unidade"} · {formatar(item.preco)} cada
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 pl-15 sm:justify-center sm:pl-0">
                    <span className="text-xs text-slate-400 sm:hidden">Quantidade</span>
                    <div className="flex h-9 items-center overflow-hidden rounded-lg border border-slate-200">
                      <button type="button" onClick={() => quantidade(item.chave, -1)} className="grid h-full w-9 place-items-center hover:bg-indigo-50">
                        <Minus size={14} />
                      </button>
                      <span className="grid h-full min-w-10 place-items-center border-x border-slate-200 bg-slate-50 text-sm font-bold">
                        {item.quantidade}
                      </span>
                      <button type="button" onClick={() => quantidade(item.chave, 1)} className="grid h-full w-9 place-items-center hover:bg-indigo-50">
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pl-15 text-sm sm:block sm:pl-0 sm:text-right">
                    <span className="text-xs text-slate-400 sm:hidden">Subtotal</span>
                    <strong>{formatar(item.quantidade * item.preco)}</strong>
                  </div>

                  <button
                    type="button"
                    onClick={() => remover(item.chave)}
                    aria-label={`Remover ${item.nome}`}
                    className="ml-auto grid size-9 place-items-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 size={16} />
                  </button>
                </article>
              ))}
            </div>
          </div>

          <footer className="shrink-0 border-t border-slate-200 bg-slate-50 px-4 py-3.5 sm:px-5">
            <div className="ml-auto grid max-w-sm gap-1.5 text-sm">
              <p className="flex justify-between gap-5 text-slate-600">
                <span>Subtotal</span><span>{formatar(subtotal)}</span>
              </p>
              {Number(desconto) > 0 && (
                <p className="flex justify-between gap-5 text-emerald-700">
                  <span>Desconto</span><span>- {formatar(desconto)}</span>
                </p>
              )}
              <p className="mt-1 flex justify-between gap-5 border-t border-slate-200 pt-2 text-lg font-bold text-slate-900">
                <span>Total</span><span>{formatar(total)}</span>
              </p>
            </div>
          </footer>
        </section>
      </div>
    )}
    </>
  );
}
