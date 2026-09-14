import { useEffect, useState } from "react";
import { Barcode, CheckCircle2, LoaderCircle, PackagePlus, Smartphone, Tags, Truck, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import QRCode from "qrcode";
import { API_URL } from "../api/authenticatedFetch";
import { Feedback } from "./ui/Feedback";
import { carregarScannerGuardado, guardarScanner, removerScanner } from "../utils/scannerSession";

const inicial = {
  nome: "",
  codigo_barras: "",
  idCategoria: "",
  idFornecedor: "",
  precoFornecedor: "",
  preco: "",
  quantidade: "",
  tipo_produto: "simples",
  unidade_base: "Unidade",
  embalagem_nome: "Caixa",
  fator_conversao: "",
  embalagem_preco: "",
  embalagem_custo: "",
  embalagem_codigo: "",
  quantidade_embalagens: "",
  vender_embalagem: true,
};

export default function AdicionarProduto() {
  const navigate = useNavigate();
  const [form, setForm] = useState(inicial);
  const [categorias, setCategorias] = useState([]);
  const [fornecedores, setFornecedores] = useState([]);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [scannerCampo, setScannerCampo] = useState("");
  const [scannerSessao, setScannerSessao] = useState(carregarScannerGuardado);
  const [scannerQr, setScannerQr] = useState("");
  const [scannerErro, setScannerErro] = useState("");
  const mudar = (campo) => (evento) =>
    setForm((atual) => ({ ...atual, [campo]: evento.target.value }));

  useEffect(() => {
    let ativo = true;
    Promise.all([
      fetch(`${API_URL}/categorias`).then(async (r) => ({
        ok: r.ok,
        data: await r.json(),
      })),
      fetch(`${API_URL}/fornecedores`).then(async (r) => ({
        ok: r.ok,
        data: await r.json(),
      })),
    ])
      .then(([categoriasResult, fornecedoresResult]) => {
        if (!categoriasResult.ok || !categoriasResult.data.sucesso)
          throw new Error(
            categoriasResult.data.erro ||
              "Não foi possível carregar as categorias.",
          );
        if (!fornecedoresResult.ok || !fornecedoresResult.data.sucesso)
          throw new Error(
            fornecedoresResult.data.erro ||
              "Não foi possível carregar os fornecedores.",
          );
        if (ativo) {
          setCategorias(categoriasResult.data.categorias || []);
          setFornecedores(fornecedoresResult.data.fornecedores || []);
        }
      })
      .catch((error) => ativo && setErro(error.message))
      .finally(() => ativo && setCarregando(false));
    return () => {
      ativo = false;
    };
  }, []);

  const abrirScanner = async (campo) => {
    setScannerCampo(campo);
    setScannerQr("");
    setScannerErro("");
    const sessaoGuardada = carregarScannerGuardado();
    if (sessaoGuardada) {
      setScannerSessao(sessaoGuardada);
      return;
    }
    try {
      const resposta = await fetch(`${API_URL}/scanner/sessoes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origem: import.meta.env.VITE_PUBLIC_APP_URL || window.location.origin,
        }),
      });
      const dados = await resposta.json();
      if (!resposta.ok)
        throw new Error(dados.erro || "Não foi possível ligar o telemóvel.");
      setScannerSessao(dados.sessao);
      guardarScanner(dados.sessao);
      setScannerQr(
        await QRCode.toDataURL(dados.sessao.url, {
          width: 320,
          margin: 2,
          errorCorrectionLevel: "M",
        }),
      );
    } catch (error) {
      setScannerErro(error.message);
    }
  };

  const fecharScanner = () => {
    setScannerCampo("");
    setScannerQr("");
    setScannerErro("");
  };

  useEffect(() => {
    if (!scannerSessao?.id) return undefined;
    let ativo = true;
    const consultar = async () => {
      try {
        const resposta = await fetch(
          `${API_URL}/scanner/sessoes/${scannerSessao.id}/codigos`,
        );
        const dados = await resposta.json();
        if (!resposta.ok) {
          if ([404, 410].includes(resposta.status)) {
            removerScanner();
            setScannerSessao(null);
          }
          throw new Error(dados.erro || "A ligação foi interrompida.");
        }
        const codigo = dados.codigos?.[0]?.codigo;
        if (codigo && ativo) {
          const campoDestino = scannerCampo || "codigo_barras";
          setForm((atual) => ({ ...atual, [campoDestino]: codigo }));
          setSucesso(
            campoDestino === "embalagem_codigo"
              ? `Código ${codigo} preenchido na embalagem.`
              : `Código ${codigo} preenchido automaticamente no produto.`,
          );
          setScannerCampo("");
          setScannerQr("");
        }
      } catch (error) {
        if (ativo) setScannerErro(error.message);
      }
    };
    consultar();
    const intervalo = window.setInterval(consultar, 900);
    return () => {
      ativo = false;
      window.clearInterval(intervalo);
    };
  }, [scannerCampo, scannerSessao]);

  const guardar = async (evento) => {
    evento.preventDefault();
    setErro("");
    setSucesso("");
    if (!form.idCategoria) return setErro("Selecione uma categoria.");
    if (!form.idFornecedor) return setErro("Selecione um fornecedor.");
    if (
      Number(form.preco) <= 0 ||
      (form.tipo_produto === "simples" && Number(form.precoFornecedor) <= 0)
    )
      return setErro("Preencha corretamente os custos e preços.");
    if (
      !Number.isInteger(Number(form.quantidade)) ||
      Number(form.quantidade) < 0
    )
      return setErro(
        "A quantidade deve ser um número inteiro igual ou maior que zero.",
      );
    if (
      form.tipo_produto === "multiplas" &&
      (!form.embalagem_nome.trim() ||
        !Number.isInteger(Number(form.fator_conversao)) ||
        Number(form.fator_conversao) <= 1 ||
        Number(form.embalagem_custo) <= 0 ||
        (form.vender_embalagem && Number(form.embalagem_preco) <= 0))
    )
      return setErro("Preencha a embalagem, o fator e os respetivos preços.");
    setSalvando(true);
    try {
      const fator =
        form.tipo_produto === "multiplas" ? Number(form.fator_conversao) : 1;
      const quantidadeBase =
        Number(form.quantidade) +
        Number(form.quantidade_embalagens || 0) * fator;
      const custoUnitario =
        form.tipo_produto === "multiplas"
          ? Number(form.embalagem_custo) / fator
          : Number(form.precoFornecedor);
      const apresentacao =
        form.tipo_produto === "multiplas"
          ? {
              nome: form.embalagem_nome.trim(),
              fator_conversao: fator,
              preco: form.vender_embalagem
                ? Number(form.embalagem_preco)
                : Number(form.preco) * fator,
              custo: Number(form.embalagem_custo),
              codigo_barras: form.vender_embalagem
                ? form.embalagem_codigo.trim() || null
                : null,
              vendavel: form.vender_embalagem,
            }
          : null;
      const response = await fetch(`${API_URL}/produtos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: form.nome.trim(),
          codigo_barras: form.codigo_barras.trim() || null,
          idCategoria: Number(form.idCategoria),
          idFornecedor: Number(form.idFornecedor),
          precoFornecedor: custoUnitario,
          preco: Number(form.preco),
          quantidade: quantidadeBase,
          tipo_produto: form.tipo_produto,
          unidade_base: form.unidade_base,
          apresentacao,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.sucesso)
        throw new Error(data.erro || "Não foi possível adicionar o produto.");
      setSucesso("Produto adicionado com sucesso.");
      setForm(inicial);
      window.setTimeout(() => navigate("/produtos", { replace: true }), 700);
    } catch (error) {
      setErro(error.message);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center overflow-y-auto bg-slate-950/45 p-3 sm:p-5">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="novo-produto-title"
        className="my-auto w-full max-w-2xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl"
      >
        <header className="flex items-center justify-between border-b border-gray-200 px-5 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-indigo-50 text-indigo-600">
              <PackagePlus size={21} />
            </span>
            <div className="min-w-0">
              <h1 id="novo-produto-title" className="font-bold text-gray-900">
                Adicionar produto
              </h1>
              <p className="text-sm text-gray-500">
                Preencha os dados de identificação, preços e stock.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate("/produtos")}
            aria-label="Fechar"
            className="ml-3 rounded-lg p-2 text-gray-500 hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </header>
        {carregando ? <div className="grid min-h-72 place-items-center p-8 text-center" role="status"><div><LoaderCircle className="mx-auto animate-spin text-indigo-600" size={34}/><p className="mt-3 font-semibold text-slate-800">A preparar o formulário</p><p className="mt-1 text-sm text-slate-500">A verificar categorias e fornecedores…</p></div></div> : (!categorias.length || !fornecedores.length) ? <div className="p-5 sm:p-8">
          <div className="mx-auto max-w-xl text-center"><span className="mx-auto grid size-14 place-items-center rounded-2xl bg-indigo-50 text-indigo-600"><PackagePlus size={27}/></span><h2 className="mt-4 text-xl font-bold text-slate-900">Prepare os dados do primeiro produto</h2><p className="mt-2 text-sm leading-6 text-slate-600">Um produto precisa de uma categoria e de um fornecedor. Conclua os passos abaixo para continuar.</p></div>
          <div className="mx-auto mt-6 max-w-xl space-y-3">
            <div className={`flex items-center gap-4 rounded-2xl border p-4 ${categorias.length ? "border-emerald-200 bg-emerald-50" : "border-indigo-200 bg-white"}`}><span className={`grid size-10 shrink-0 place-items-center rounded-xl ${categorias.length ? "bg-emerald-100 text-emerald-700" : "bg-indigo-50 text-indigo-600"}`}>{categorias.length ? <CheckCircle2 size={20}/> : <Tags size={20}/>}</span><div className="min-w-0 flex-1"><p className="font-semibold text-slate-900">1. Categoria</p><p className="text-sm text-slate-500">{categorias.length ? `${categorias.length} categoria(s) disponível(eis).` : "Crie uma categoria para organizar o produto."}</p></div>{!categorias.length && <button type="button" onClick={() => navigate("/adicionarCategoria", { state: { returnTo: "/adicionarProduto" } })} className="shrink-0 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">Criar</button>}</div>
            <div className={`flex items-center gap-4 rounded-2xl border p-4 ${fornecedores.length ? "border-emerald-200 bg-emerald-50" : "border-indigo-200 bg-white"}`}><span className={`grid size-10 shrink-0 place-items-center rounded-xl ${fornecedores.length ? "bg-emerald-100 text-emerald-700" : "bg-indigo-50 text-indigo-600"}`}>{fornecedores.length ? <CheckCircle2 size={20}/> : <Truck size={20}/>}</span><div className="min-w-0 flex-1"><p className="font-semibold text-slate-900">2. Fornecedor</p><p className="text-sm text-slate-500">{fornecedores.length ? `${fornecedores.length} fornecedor(es) disponível(eis).` : "Registe quem fornece este produto."}</p></div>{!fornecedores.length && <button type="button" onClick={() => navigate("/adicionarFornecedor", { state: { returnTo: "/adicionarProduto" } })} className="shrink-0 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">Registar</button>}</div>
          </div>
          {erro && <Feedback tipo="erro" className="mx-auto mt-5 max-w-xl">{erro}</Feedback>}
          <div className="mt-6 text-center"><button type="button" onClick={() => navigate("/produtos")} className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 font-semibold text-slate-700 hover:bg-slate-50">Voltar aos produtos</button></div>
        </div> : <form
          onSubmit={guardar}
          className="max-h-[calc(100dvh-8rem)] overflow-y-auto p-5 sm:p-6"
        >
          <div className="mb-5 space-y-3">
            <Feedback tipo="erro">{erro}</Feedback>
            <Feedback tipo="sucesso">{sucesso}</Feedback>
          </div>
          <fieldset
            disabled={carregando || salvando}
            className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2"
          >
            <label className="text-sm font-medium text-gray-700 sm:col-span-2">
              Nome do produto *
              <input
                autoFocus
                value={form.nome}
                onChange={mudar("nome")}
                required
                placeholder="Ex.: Arroz 5 kg"
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </label>
            <label className="text-sm font-medium text-gray-700 sm:col-span-2">
              Código de barras da {form.unidade_base.toLowerCase()}
              <div className="relative mt-1">
                <Barcode className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  value={form.codigo_barras}
                  onChange={mudar("codigo_barras")}
                  placeholder="Leia ou digite o código da unidade"
                  className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-32 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
                <button
                  type="button"
                  onClick={() => abrirScanner("codigo_barras")}
                  className="absolute right-1.5 top-1.5 inline-flex items-center gap-1 rounded-md bg-indigo-600 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-indigo-700"
                >
                  <Smartphone size={15} /> Ler
                </button>
              </div>
              <small className="mt-1 block font-normal text-gray-500">
                Opcional. Normalmente é o código existente em cada garrafa ou
                unidade.
              </small>
            </label>
            <div className="sm:col-span-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-800">
                Como este produto é vendido?
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <label
                  className={`cursor-pointer rounded-lg border p-3 text-sm ${form.tipo_produto === "simples" ? "border-indigo-500 bg-indigo-50 text-indigo-800" : "border-slate-200 bg-white"}`}
                >
                  <input
                    type="radio"
                    className="mr-2"
                    checked={form.tipo_produto === "simples"}
                    onChange={() =>
                      setForm((f) => ({ ...f, tipo_produto: "simples" }))
                    }
                  />
                  Apenas uma unidade
                </label>
                <label
                  className={`cursor-pointer rounded-lg border p-3 text-sm ${form.tipo_produto === "multiplas" ? "border-indigo-500 bg-indigo-50 text-indigo-800" : "border-slate-200 bg-white"}`}
                >
                  <input
                    type="radio"
                    className="mr-2"
                    checked={form.tipo_produto === "multiplas"}
                    onChange={() =>
                      setForm((f) => ({ ...f, tipo_produto: "multiplas" }))
                    }
                  />
                  Em unidades e embalagens
                </label>
              </div>
            </div>
            <label className="text-sm font-medium text-gray-700">
              Categoria *
              <select
                value={form.idCategoria}
                onChange={mudar("idCategoria")}
                required
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5"
              >
                <option value="">Selecione uma categoria</option>
                {categorias.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nome}
                  </option>
                ))}
              </select>
              {!carregando && !categorias.length && (
                <small className="mt-1 block font-normal text-amber-600">
                  Crie uma categoria antes de continuar.
                </small>
              )}
            </label>
            <label className="text-sm font-medium text-gray-700">
              Fornecedor *
              <select
                value={form.idFornecedor}
                onChange={mudar("idFornecedor")}
                required
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5"
              >
                <option value="">Selecione um fornecedor</option>
                {fornecedores.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nome}
                  </option>
                ))}
              </select>
              {!carregando && !fornecedores.length && (
                <small className="mt-1 block font-normal text-amber-600">
                  Registe um fornecedor antes de continuar.
                </small>
              )}
            </label>
            <label className="text-sm font-medium text-gray-700">
              Unidade base *
              <select
                value={form.unidade_base}
                onChange={mudar("unidade_base")}
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5"
              >
                <option>Unidade</option>
                <option>Garrafa</option>
                <option>Pacote</option>
                <option>Peça</option>
                <option>Cartela</option>
              </select>
            </label>
            <label className="text-sm font-medium text-gray-700">
              Preço por {form.unidade_base.toLowerCase()} *
              <div className="relative mt-1">
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.preco}
                  onChange={mudar("preco")}
                  required
                  placeholder="0,00"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 pr-14"
                />
                <span className="absolute right-3 top-3 text-xs font-semibold text-gray-400">
                  MZN
                </span>
              </div>
            </label>
            {form.tipo_produto === "simples" && (
              <label className="text-sm font-medium text-gray-700">
                Custo de compra por {form.unidade_base.toLowerCase()} *
                <div className="relative mt-1">
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={form.precoFornecedor}
                    onChange={mudar("precoFornecedor")}
                    required
                    placeholder="0,00"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 pr-14"
                  />
                  <span className="absolute right-3 top-3 text-xs font-semibold text-gray-400">
                    MZN
                  </span>
                </div>
              </label>
            )}
            {form.tipo_produto === "multiplas" && (
              <>
                <div className="sm:col-span-2 mt-1 rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
                  <p className="font-semibold text-indigo-950">
                    Compra por embalagem
                  </p>
                  <p className="text-xs text-indigo-700">
                    Informe como recebe o produto do fornecedor. O custo
                    unitário será calculado automaticamente.
                  </p>
                </div>
                <label className="text-sm font-medium text-gray-700">
                  Embalagem de compra *
                  <select
                    value={form.embalagem_nome}
                    onChange={mudar("embalagem_nome")}
                    className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5"
                  >
                    <option>Caixa</option>
                    <option>Fardo</option>
                    <option>Grade</option>
                    <option>Cartela</option>
                    <option>Pacote</option>
                  </select>
                </label>
                <label className="text-sm font-medium text-gray-700">
                  Quantidade por embalagem *
                  <input
                    type="number"
                    min="2"
                    step="1"
                    value={form.fator_conversao}
                    onChange={mudar("fator_conversao")}
                    placeholder="Ex.: 12"
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5"
                  />
                </label>
                <label className="text-sm font-medium text-gray-700">
                  Custo de compra da embalagem *
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={form.embalagem_custo}
                    onChange={mudar("embalagem_custo")}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5"
                  />
                  <small className="mt-1 block font-normal text-emerald-700">
                    Custo calculado por {form.unidade_base.toLowerCase()}:{" "}
                    {Number(form.fator_conversao) > 0
                      ? (
                          Number(form.embalagem_custo || 0) /
                          Number(form.fator_conversao)
                        ).toFixed(2)
                      : "0.00"}{" "}
                    MZN
                  </small>
                </label>
                <label className="text-sm font-medium text-gray-700">
                  Preço de venda da embalagem {form.vender_embalagem && "*"}
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={form.embalagem_preco}
                    onChange={mudar("embalagem_preco")}
                    disabled={!form.vender_embalagem}
                    placeholder={form.vender_embalagem ? "0,00" : "Venda desativada"}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                  />
                </label>
                <label className="sm:col-span-2 flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.vender_embalagem}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        vender_embalagem: e.target.checked,
                      }))
                    }
                  />
                  Também vendo a embalagem completa
                </label>
                {form.vender_embalagem && (
                  <>
                    <details className="sm:col-span-2 rounded-lg border border-slate-200 p-3">
                      <summary className="cursor-pointer text-sm font-medium text-slate-700">
                        Mais opções da embalagem
                      </summary>
                      <label className="mt-3 block text-sm text-gray-700">
                        Código de barras da embalagem (opcional)
                        <div className="relative mt-1">
                          <input
                            value={form.embalagem_codigo}
                            onChange={mudar("embalagem_codigo")}
                            className="w-full rounded-lg border border-gray-300 py-2.5 pl-3 pr-32"
                          />
                          <button
                            type="button"
                            onClick={() => abrirScanner("embalagem_codigo")}
                            className="absolute right-1.5 top-1.5 inline-flex items-center gap-1 rounded-md bg-indigo-600 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-indigo-700"
                          >
                            <Smartphone size={15} /> Ler
                          </button>
                        </div>
                      </label>
                    </details>
                  </>
                )}
              </>
            )}
            {form.tipo_produto === "multiplas" && (
              <label className="text-sm font-medium text-gray-700">
                Stock inicial em {form.embalagem_nome.toLowerCase()}s
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={form.quantidade_embalagens}
                  onChange={mudar("quantidade_embalagens")}
                  placeholder="0"
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5"
                />
              </label>
            )}
            <label
              className={`text-sm font-medium text-gray-700 ${form.tipo_produto === "simples" ? "sm:col-span-2" : ""}`}
            >
              {form.tipo_produto === "multiplas"
                ? `${form.unidade_base}s soltas (opcional)`
                : "Quantidade inicial *"}
              <input
                type="number"
                min="0"
                step="1"
                value={form.quantidade}
                onChange={mudar("quantidade")}
                required={form.tipo_produto === "simples"}
                placeholder="0"
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5"
              />
              <small className="mt-1 block font-normal text-gray-500">
                {form.tipo_produto === "multiplas" &&
                  "Deixe vazio ou coloque 0 se recebeu apenas embalagens completas. "}
                Stock total:{" "}
                {Number(form.quantidade || 0) +
                  Number(form.quantidade_embalagens || 0) *
                    Number(form.fator_conversao || 0)}{" "}
                {form.unidade_base.toLowerCase()}(s).
              </small>
            </label>
          </fieldset>
          <footer className="mt-6 flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => navigate("/produtos")}
              disabled={salvando}
              className="w-full rounded-lg border border-gray-300 bg-white px-5 py-2.5 font-semibold text-gray-700 hover:bg-gray-50 sm:w-auto"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={
                carregando ||
                salvando ||
                !categorias.length ||
                !fornecedores.length
              }
              className="w-full rounded-lg bg-indigo-600 px-5 py-2.5 font-bold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {salvando
                ? "A adicionar..."
                : carregando
                  ? "A carregar..."
                  : "Adicionar produto"}
            </button>
          </footer>
        </form>}
      </section>
      {scannerCampo && (
        <div className="fixed inset-0 z-[160] grid place-items-center bg-slate-950/80 p-3 backdrop-blur-sm">
          <section
            role="dialog"
            aria-modal="true"
            aria-label="Ler código com o telemóvel"
            className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl"
          >
            <header className="flex items-center justify-between border-b border-slate-100 p-5">
              <div>
                <h2 className="font-bold text-slate-900">Ler código de barras</h2>
                <p className="text-xs text-slate-500">
                  {scannerCampo === "embalagem_codigo"
                    ? "Código da embalagem"
                    : `Código da ${form.unidade_base.toLowerCase()}`}
                </p>
              </div>
              <button
                type="button"
                onClick={fecharScanner}
                aria-label="Fechar ligação"
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X size={21} />
              </button>
            </header>
            <div className="p-5 text-center">
              {scannerQr && !scannerErro && (
                <img
                  src={scannerQr}
                  alt="QR Code para ligar o telemóvel"
                  className="mx-auto w-full max-w-64 rounded-2xl border border-slate-100"
                />
              )}
              {!scannerQr && scannerSessao && !scannerErro && (
                <div className="grid min-h-64 place-items-center rounded-2xl bg-slate-50 text-sm text-slate-500">
                  <div className="px-6 text-center">
                    <Smartphone className="mx-auto mb-3 text-emerald-600" size={42} />
                    <b className="block text-slate-800">Telemóvel já ligado</b>
                    <span>Aponte a câmara para o código de barras.</span>
                  </div>
                </div>
              )}
              <p className={`mt-4 rounded-xl p-3 text-sm ${scannerErro ? "bg-red-50 text-red-700" : "bg-indigo-50 text-indigo-800"}`}>
                {scannerErro || (scannerQr
                  ? "Leia este QR Code apenas uma vez. A ligação será mantida para produtos e vendas."
                  : "A aguardar a leitura no telemóvel já emparelhado.")}
              </p>
              <button
                type="button"
                onClick={fecharScanner}
                className="mt-4 w-full rounded-xl border border-slate-200 py-2.5 font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancelar leitura
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
