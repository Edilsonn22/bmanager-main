import { createElement, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  Banknote,
  Barcode,
  Boxes,
  Building2,
  Calculator,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  FileText,
  Mail,
  MapPin,
  PackageSearch,
  Pause,
  Play,
  ReceiptText,
  RotateCcw,
  ShieldCheck,
  ShoppingCart,
  TrendingUp,
  UserRoundCheck,
  UserPlus,
  UsersRound,
  WalletCards,
} from "lucide-react";
import { API_URL } from "../api/authenticatedFetch";
import painelDemo from "../assets/screenshots/painel.png";
import novaVendaDemo from "../assets/screenshots/nova-venda.png";
import caixaDemo from "../assets/screenshots/caixa.png";
import relatoriosDemo from "../assets/screenshots/relatorios.png";
import utilizadoresDemo from "../assets/screenshots/utilizadores.png";
import reciboDemo from "../assets/screenshots/recibo.png";
import vendaiLogo from "../assets/vendai-logo.png";

const demonstracoes = [
  { nome: "Painel", titulo: "A operação num único olhar", texto: "Indicadores de stock, alertas e movimentos recentes organizados para apoiar decisões rápidas.", imagem: painelDemo },
  { nome: "Nova venda", titulo: "Venda com rapidez e controlo", texto: "Pesquisa, código de barras, carrinho, desconto e pagamento reunidos num fluxo simples para o balcão.", imagem: novaVendaDemo },
  { nome: "Caixa", titulo: "Fecho de caixa com confiança", texto: "Acompanhe vendas e valores esperados antes de confirmar o montante contado no fim do turno.", imagem: caixaDemo },
  { nome: "Relatórios", titulo: "Resultados fáceis de interpretar", texto: "Filtre os dados, acompanhe a evolução das vendas e exporte relatórios para CSV, Excel ou PDF.", imagem: relatoriosDemo },
  { nome: "Utilizadores", titulo: "A equipa com acessos organizados", texto: "Crie utilizadores e distribua responsabilidades de acordo com o papel de cada membro da empresa.", imagem: utilizadoresDemo },
  { nome: "Comprovativo", titulo: "Comprovativos claros e profissionais", texto: "Apresente cliente, pagamento, operador, produtos e totais num documento pronto para guardar ou imprimir.", imagem: reciboDemo },
];

const beneficiosPorPlano = {
  teste: ["14 dias com recursos do Business", "Até 5 utilizadores", "Produtos e vendas ilimitados", "Sem cartão bancário"],
  starter: ["1 utilizador e 1 estabelecimento", "Produtos, clientes e fornecedores ilimitados", "Vendas, stock e caixa", "Dashboard e relatórios essenciais", "Suporte por ticket"],
  business: ["Tudo do Starter", "Até 5 utilizadores", "Perfis e permissões", "Gestão financeira e relatórios avançados", "Exportação Excel, CSV e PDF"],
  enterprise: ["Tudo do Business", "Até 15 utilizadores", "Configuração personalizada", "Formação e implementação assistida", "Gestor de suporte dedicado"],
};
const recursos = [
  {
    icon: Boxes,
    titulo: "Stock sob controlo",
    texto:
      "Acompanhe entradas, saídas e níveis mínimos sem depender de folhas de cálculo.",
  },
  {
    icon: TrendingUp,
    titulo: "Decisões com dados",
    texto:
      "Visualize o desempenho do negócio e exporte os seus relatórios quando precisar.",
  },
  {
    icon: UsersRound,
    titulo: "Trabalho em equipa",
    texto:
      "Defina permissões para cada pessoa e mantenha a operação organizada.",
  },
  {
    icon: ShoppingCart,
    titulo: "Vendas rápidas",
    texto: "Registe vendas, descontos e pagamentos com um fluxo simples, preparado para balcão.",
  },
  {
    icon: WalletCards,
    titulo: "Caixa organizado",
    texto: "Abra e feche o caixa, acompanhe valores recebidos e reduza diferenças no fim do dia.",
  },
  {
    icon: ReceiptText,
    titulo: "Recibos profissionais",
    texto: "Emita comprovativos claros, imprima em A4 ou formato térmico e mantenha o histórico.",
  },
];

const modulos = [
  [PackageSearch, "Produtos e stock", "Catálogo, categorias, fornecedores, códigos de barras e alertas de reposição."],
  [ShoppingCart, "Vendas e clientes", "Venda ao consumidor final ou associe clientes para manter um histórico completo."],
  [Calculator, "Financeiro", "Receitas, custo dos produtos vendidos e lucro calculados a partir de cada venda."],
  [BarChart3, "Relatórios", "Indicadores operacionais e exportação para apoiar decisões com dados reais."],
  [UsersRound, "Equipa e permissões", "Acessos separados para administrador, gestor e operador."],
  [ShieldCheck, "Operação segura", "Dados isolados por empresa, sessões protegidas e registo consistente das operações."],
];

const novidadesVenda = [
  [Barcode, "Leitura de código de barras", "Encontre e adicione produtos à venda usando leitor ou pesquisa por nome e código."],
  [UserPlus, "Cliente cadastrado ou avulso", "Associe um cliente existente ou escreva o nome de quem está a comprar no momento."],
  [Banknote, "Dinheiro, M-Pesa, eMola e crédito", "Registe a forma de pagamento, aplique descontos e calcule automaticamente o troco."],
  [ReceiptText, "Recibo A4 ou térmico", "Gere comprovativos com produtos, quantidades, operador, cliente, totais e pagamento."],
  [RotateCcw, "Devoluções e cancelamentos", "Devolva itens ou cancele uma venda com reposição automática das quantidades no stock."],
  [Calculator, "Lucro histórico correto", "Cada venda conserva preço e custo do momento, mesmo que o produto seja alterado depois."],
];
const moeda = (valor) =>
  Number(valor || 0).toLocaleString("pt-MZ", {
    style: "currency",
    currency: "MZN",
    maximumFractionDigits: 0,
  });

export default function LandingModern() {
  const [planos, setPlanos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const navigate = useNavigate();

  const irParaSecao = (evento, seletor) => {
    evento.preventDefault();
    document.querySelector(seletor)?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      block: "start",
    });
    window.history.replaceState(null, "", seletor);
  };

  useEffect(() => {
    fetch(`${API_URL}/planos`)
      .then((r) => r.json())
      .then((d) => setPlanos(d.planos || []))
      .catch(() => setPlanos([]))
      .finally(() => setCarregando(false));
  }, []);

  useEffect(() => {
    const elementos = document.querySelectorAll("[data-reveal]");
    const observador = new IntersectionObserver(
      (entradas) => {
        entradas.forEach((entrada) => {
          if (entrada.isIntersecting) {
            entrada.target.classList.add("is-visible");
            observador.unobserve(entrada.target);
          }
        });
      },
      { threshold: 0.16 },
    );

    elementos.forEach((elemento) => observador.observe(elemento));
    return () => observador.disconnect();
  }, [carregando]);

  return (
    <main className="landing-page min-h-screen overflow-hidden bg-white text-slate-900">
      <div className="landing-orb landing-orb-one" />
      <div className="landing-orb landing-orb-two" />
      <div className="landing-grid pointer-events-none absolute inset-0" />
      <nav className="landing-nav sticky top-0 z-50 mx-auto flex w-full items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-4 py-4 backdrop-blur sm:px-6 lg:px-8">
        <Link
          to="/"
          className="flex min-w-0 items-center"
          aria-label="Vendai — página inicial"
        >
          <img
            src={vendaiLogo}
            alt="Vendai"
            className="landing-logo h-auto w-24 object-contain sm:w-28 2xl:w-32"
          />
        </Link>
        <div className="hidden items-center gap-7 text-sm font-semibold text-slate-600 lg:flex">
          <a href="#plataforma" onClick={(evento) => irParaSecao(evento, "#plataforma")} className="transition hover:text-indigo-600">Plataforma</a>
          <a href="#recursos" onClick={(evento) => irParaSecao(evento, "#recursos")} className="transition hover:text-indigo-600">Recursos</a>
          <a href="#como-funciona" onClick={(evento) => irParaSecao(evento, "#como-funciona")} className="transition hover:text-indigo-600">Como funciona</a>
          <a href="#planos" onClick={(evento) => irParaSecao(evento, "#planos")} className="transition hover:text-indigo-600">Planos</a>
        </div>
        <div className="landing-nav-actions flex shrink-0 items-center gap-2.5 sm:gap-5">
          <Link
            to="/login"
            className="landing-login-link text-sm font-semibold text-slate-600 transition hover:text-indigo-600"
          >
            Entrar
          </Link>
          <Link
            to="/registo?plano=1"
            className="whitespace-nowrap rounded-lg bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-indigo-700 sm:px-5 sm:text-sm"
          >
            Criar conta
          </Link>
        </div>
      </nav>
      <section className="landing-hero relative z-10 mx-auto grid w-full max-w-7xl items-center gap-10 px-4 pb-16 pt-7 sm:gap-14 sm:px-6 sm:pb-24 sm:pt-12 lg:grid-cols-[minmax(0,1.02fr)_minmax(0,.98fr)] lg:px-8 lg:pb-28 lg:pt-16 2xl:max-w-[1536px] 2xl:gap-20 2xl:pb-32 2xl:pt-20">
        <div className="landing-enter min-w-0 text-center lg:text-left">
          <p className="landing-eyebrow inline-flex max-w-full items-center gap-2 border-l-2 border-indigo-600 pl-3 text-xs font-bold uppercase tracking-[0.16em] text-indigo-700 sm:text-sm">
            <span>Gestão comercial para pequenas empresas</span>
          </p>
          <h1 className="landing-title mx-auto mt-5 max-w-3xl text-[clamp(2.05rem,8vw,4rem)] font-black leading-[1.05] tracking-[-0.04em] sm:mt-6 lg:mx-0 2xl:max-w-4xl 2xl:text-[4.5rem]">
            Controle a operação do seu negócio{" "}
            <span className="landing-gradient-text">
              num único lugar.
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-[clamp(1rem,2vw,1.125rem)] leading-7 text-slate-600 sm:mt-6 lg:mx-0 2xl:max-w-2xl 2xl:text-xl 2xl:leading-8">
            Registe vendas, acompanhe o stock, organize o caixa e consulte os resultados com informação consistente e acessível à sua equipa.
          </p>
          <div className="landing-actions mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center lg:mt-8 lg:justify-start">
            <Link
              to="/registo?plano=1"
              className="group inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-6 py-3.5 font-semibold text-white transition hover:bg-indigo-700"
            >
              Começar grátis{" "}
              <ArrowRight
                size={18}
                className="transition group-hover:translate-x-1"
              />
            </Link>
            <a
              href="#planos"
              onClick={(evento) => irParaSecao(evento, "#planos")}
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-6 py-3.5 font-semibold text-slate-700 transition hover:border-indigo-400 hover:text-indigo-700"
            >
              Ver planos
            </a>
          </div>
          <div className="mt-7 flex flex-wrap justify-center gap-x-5 gap-y-3 text-sm text-slate-600 lg:mt-8 lg:justify-start">
            <span className="flex items-center gap-2">
              <CircleCheck size={17} className="text-emerald-400" />
              14 dias grátis
            </span>
            <span className="flex items-center gap-2">
              <CircleCheck size={17} className="text-emerald-400" />
              Sem cartão
            </span>
            <span className="flex items-center gap-2">
              <CircleCheck size={17} className="text-emerald-400" />
              Configuração rápida
            </span>
          </div>
        </div>
        <DashboardImage />
      </section>
      <section data-reveal className="landing-reveal relative z-10 border-y border-slate-200 bg-slate-50 py-8">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-0 px-4 text-center sm:grid-cols-3 sm:px-6 lg:px-8 2xl:max-w-7xl">
          <Stat numero="14 dias" texto="para testar sem compromisso" />
          <Stat numero="1 painel" texto="para a operação inteira" />
          <Stat numero="100%" texto="dos dados isolados por empresa" />
        </div>
      </section>
      <ProductShowcase />
      <section id="recursos" data-reveal className="landing-reveal relative z-10 mx-auto w-full max-w-7xl scroll-mt-20 px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-28 2xl:max-w-[1536px]">
        <div className="max-w-2xl text-center sm:text-left">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-indigo-300">
            Feito para acompanhar o ritmo
          </p>
          <h2 className="mt-4 text-[clamp(1.75rem,5vw,2.25rem)] font-extrabold leading-tight tracking-tight">
            Menos confusão na operação. Mais confiança nas decisões.
          </h2>
        </div>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:mt-10 lg:grid-cols-3">
          {recursos.map(({ icon, titulo, texto }) => (
            <article
              key={titulo}
              data-reveal
              className="landing-feature landing-reveal group rounded-xl border border-slate-200 bg-white p-5 transition hover:border-slate-300 hover:shadow-md sm:p-7"
            >
              <span className="grid size-11 place-items-center rounded-xl bg-indigo-400/10 text-indigo-300 transition group-hover:scale-110 group-hover:bg-indigo-400/20">
                {createElement(icon, { size: 21 })}
              </span>
              <h3 className="mt-5 text-lg font-bold">{titulo}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{texto}</p>
            </article>
          ))}
        </div>
      </section>
      <section data-reveal className="landing-reveal relative z-10 mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6 sm:pb-24 lg:px-8 2xl:max-w-[1536px]">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="grid gap-8 border-b border-slate-200 bg-slate-50 px-5 py-9 sm:px-9 lg:grid-cols-[1fr_.8fr] lg:items-end lg:px-12 lg:py-12">
            <div><p className="text-sm font-bold uppercase tracking-[0.2em] text-indigo-500">Novas funcionalidades</p><h2 className="mt-4 text-3xl font-black leading-tight tracking-tight sm:text-4xl">Uma venda completa, do balcão ao relatório.</h2><p className="mt-4 max-w-2xl leading-7 text-slate-600">O Vendai acompanha o processo inteiro: seleciona produtos, identifica o cliente, calcula o pagamento, atualiza o stock e preserva os valores históricos.</p></div>
            <div className="rounded-2xl border border-white bg-white/80 p-5 shadow-sm"><p className="text-sm font-semibold text-slate-900">Tudo conectado automaticamente</p><div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-bold text-indigo-700"><span className="rounded-full bg-indigo-50 px-3 py-2">Venda</span><ArrowRight size={14}/><span className="rounded-full bg-indigo-50 px-3 py-2">Stock</span><ArrowRight size={14}/><span className="rounded-full bg-indigo-50 px-3 py-2">Financeiro</span><ArrowRight size={14}/><span className="rounded-full bg-indigo-50 px-3 py-2">Relatórios</span></div></div>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3">
            {novidadesVenda.map(([Icon, titulo, texto], indice) => <article key={titulo} className="border-b border-slate-100 p-6 last:border-b-0 sm:p-7 sm:[&:nth-last-child(-n+2)]:border-b-0 lg:border-r lg:[&:nth-child(3n)]:border-r-0 lg:[&:nth-last-child(-n+3)]:border-b-0"><div className="flex items-start gap-4"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-slate-950 text-white">{createElement(Icon, { size: 20 })}</span><div><span className="text-[11px] font-bold uppercase tracking-widest text-indigo-400">Recurso {String(indice + 1).padStart(2, "0")}</span><h3 className="mt-1 font-bold text-slate-900">{titulo}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{texto}</p></div></div></article>)}
          </div>
          <div className="flex flex-col gap-3 bg-slate-50 px-6 py-5 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between sm:px-9"><p><strong className="text-slate-900">Nota:</strong> os recibos atuais são comprovativos comerciais; faturação fiscal certificada será uma etapa própria.</p><Link to="/registo?plano=1" className="inline-flex shrink-0 items-center gap-1 font-bold text-indigo-600">Testar os recursos<ArrowRight size={16}/></Link></div>
        </div>
      </section>
      <section data-reveal className="landing-reveal relative z-10 bg-slate-950 py-16 text-white sm:py-24">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[.8fr_1.2fr] lg:items-center lg:px-8 2xl:max-w-[1536px]">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-indigo-300">Uma plataforma completa</p>
            <h2 className="mt-4 text-3xl font-black leading-tight tracking-tight sm:text-4xl">Tudo o que acontece no negócio, conectado.</h2>
            <p className="mt-5 max-w-xl leading-7 text-slate-300">Uma venda atualiza o stock, alimenta o financeiro e aparece nos relatórios. Sem repetir informação em sistemas diferentes.</p>
            <Link to="/registo?plano=1" className="group mt-7 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 font-bold text-slate-950 transition hover:bg-indigo-50">Experimentar gratuitamente<ArrowRight size={18} className="transition group-hover:translate-x-1" /></Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {modulos.map(([Icon, titulo, texto]) => <article key={titulo} className="rounded-2xl border border-white/10 bg-white/[.06] p-5 backdrop-blur"><span className="grid size-10 place-items-center rounded-xl bg-indigo-400/15 text-indigo-300">{createElement(Icon, { size: 20 })}</span><h3 className="mt-4 font-bold">{titulo}</h3><p className="mt-2 text-sm leading-6 text-slate-400">{texto}</p></article>)}
          </div>
        </div>
      </section>
      <section id="como-funciona" data-reveal className="landing-reveal relative z-10 mx-auto max-w-7xl scroll-mt-20 px-4 py-16 sm:px-6 sm:py-24 lg:px-8 2xl:max-w-[1536px]">
        <div className="mx-auto max-w-2xl text-center"><p className="text-sm font-bold uppercase tracking-[0.2em] text-indigo-400">Comece sem complicação</p><h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">Da configuração à primeira venda em três passos.</h2></div>
        <div className="relative mt-12 grid gap-5 lg:grid-cols-3">
          {[
            [Building2, "01", "Crie a sua empresa", "Registe a conta e personalize os dados essenciais do negócio."],
            [FileText, "02", "Organize o catálogo", "Adicione produtos, preços, fornecedores e quantidades iniciais."],
            [UserRoundCheck, "03", "Comece a operar", "Convide a equipa, abra o caixa e registe vendas com segurança."],
          ].map(([Icon, numero, titulo, texto]) => <article key={numero} className="relative rounded-3xl border border-slate-200 bg-white p-7 shadow-sm"><span className="absolute right-6 top-5 text-4xl font-black text-slate-100">{numero}</span><span className="grid size-12 place-items-center rounded-2xl bg-indigo-50 text-indigo-600">{createElement(Icon, { size: 23 })}</span><h3 className="mt-6 text-lg font-bold">{titulo}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{texto}</p></article>)}
        </div>
      </section>
      <section
        id="planos"
        data-reveal
        className="landing-reveal relative z-10 mx-auto w-full max-w-7xl scroll-mt-8 px-4 pb-16 sm:px-6 sm:pb-24 lg:px-8 lg:pb-32 2xl:max-w-[1536px]"
      >
        <div className="rounded-3xl border border-indigo-100 bg-white/75 px-4 py-10 shadow-xl shadow-indigo-100/50 backdrop-blur-sm sm:rounded-[2rem] sm:px-8 sm:py-14">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-indigo-300">
              Planos simples
            </p>
            <h2 className="mt-3 text-[clamp(1.75rem,5vw,2.25rem)] font-extrabold leading-tight tracking-tight">
              Comece pequeno. Cresça com liberdade.
            </h2>
            <p className="mt-4 text-slate-600">
              Sem contratos longos. Altere ou cancele quando precisar.
            </p>
          </div>
          <div className="mt-9 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {carregando
              ? [1, 2, 3].map((n) => (
                  <div
                    key={n}
                    className="h-80 animate-pulse rounded-3xl bg-slate-100"
                  />
                ))
              : planos.map((plano) => (
                  <PlanCard
                    key={plano.id}
                    plano={plano}
                    destaque={plano.nome.toLocaleLowerCase("pt-MZ").includes("business")}
                    escolher={() => navigate(`/registo?plano=${plano.id}`)}
                  />
                ))}
          </div>
          {!carregando && planos.length === 0 && (
            <p className="mt-8 text-center text-slate-500">
              Não foi possível carregar os planos. Tente novamente em instantes.
            </p>
          )}
          <p className="mt-10 flex items-center justify-center gap-2 text-center text-sm text-slate-500">
            <ShieldCheck size={16} className="text-emerald-400" />
            Conta segura, dados isolados e e-mail de boas-vindas.
          </p>
        </div>
      </section>
      <section data-reveal className="landing-reveal relative z-10 mx-auto max-w-7xl px-4 pb-20 sm:px-6 sm:pb-28 lg:px-8 2xl:max-w-[1536px]">
        <div className="relative overflow-hidden rounded-2xl bg-slate-950 px-6 py-12 text-center text-white sm:px-12 sm:py-16">
          <div className="landing-cta-glow" />
          <div className="relative mx-auto max-w-3xl"><p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-400">Comece hoje</p><h2 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">Organize a operação e acompanhe cada resultado.</h2><p className="mx-auto mt-5 max-w-2xl leading-7 text-slate-300">Teste o Vendai por 14 dias, sem cartão e sem compromisso.</p><Link to="/registo?plano=1" className="group mt-8 inline-flex items-center gap-2 rounded-lg bg-white px-7 py-4 font-semibold text-slate-950 transition hover:bg-slate-100">Criar conta grátis<ArrowRight size={18} className="transition group-hover:translate-x-1" /></Link></div>
        </div>
      </section>
      <footer className="relative z-10 border-t border-slate-800 bg-slate-950 text-slate-300">
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-5 py-12 sm:px-6 md:grid-cols-2 lg:grid-cols-[1.35fr_.8fr_1fr] lg:px-8 lg:py-16 2xl:max-w-[1536px]">
          <div>
            <Link to="/" aria-label="Vendai — página inicial" className="inline-flex rounded-xl bg-white px-3 py-2">
              <img src={vendaiLogo} alt="Vendai" className="h-auto w-28 object-contain" />
            </Link>
            <p className="mt-5 max-w-sm text-sm leading-6 text-slate-400">Gestão simples e integrada para acompanhar vendas, stock, caixa e resultados do seu negócio.</p>
            <Link to="/registo?plano=1" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-white hover:text-indigo-300">Começar gratuitamente <ArrowRight size={16} /></Link>
          </div>

          <div>
            <h2 className="text-sm font-bold uppercase tracking-[.16em] text-white">Navegação</h2>
            <nav className="mt-5 flex flex-col items-start gap-3 text-sm" aria-label="Navegação do rodapé">
              <a href="#plataforma" onClick={(evento) => irParaSecao(evento, "#plataforma")} className="hover:text-white">Plataforma</a>
              <a href="#recursos" onClick={(evento) => irParaSecao(evento, "#recursos")} className="hover:text-white">Recursos</a>
              <a href="#como-funciona" onClick={(evento) => irParaSecao(evento, "#como-funciona")} className="hover:text-white">Como funciona</a>
              <a href="#planos" onClick={(evento) => irParaSecao(evento, "#planos")} className="hover:text-white">Planos</a>
              <Link to="/login" className="hover:text-white">Entrar</Link>
            </nav>
          </div>

          <div>
            <h2 className="text-sm font-bold uppercase tracking-[.16em] text-white">Contactos</h2>
            <div className="mt-5 space-y-4 text-sm">
              <a href="mailto:2026vendai@gmail.com" className="flex items-center gap-3 hover:text-white"><span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white/[.07]"><Mail size={17} /></span><span className="break-all">2026vendai@gmail.com</span></a>
              <p className="flex items-center gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white/[.07]"><MapPin size={17} /></span><span>Maputo, Moçambique</span></p>
            </div>
          </div>
        </div>
        <div className="border-t border-white/10">
          <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-5 text-center text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:text-left lg:px-8 2xl:max-w-[1536px]">
            <p>© {new Date().getFullYear()} Vendai. Todos os direitos reservados.</p>
            <p>Desenvolvido em Maputo para negócios que querem avançar.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}

function DashboardImage() {
  return (
    <div className="landing-enter landing-delay relative mx-auto w-full min-w-0 max-w-xl 2xl:max-w-2xl">
      <div className="landing-float absolute -right-3 -top-7 z-20 hidden rounded-2xl border border-white/80 bg-white/85 p-3.5 shadow-xl shadow-indigo-200/60 backdrop-blur sm:block">
        <div className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-xl bg-emerald-400/15 text-emerald-300">
            <TrendingUp size={18} />
          </span>
          <div>
            <p className="text-xs text-slate-500">Vendas do mês</p>
            <p className="font-bold">+18,4%</p>
          </div>
        </div>
      </div>
      <div className="landing-dashboard relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-xl sm:p-3">
        <img
          src={painelDemo}
          alt="Pré-visualização do painel da Vendai com indicadores de stock, gráfico e produtos"
          className="h-auto w-full rounded-xl object-contain object-top"
          decoding="async"
        />
      </div>
    </div>
  );
}

function ProductShowcase() {
  const [ativo, setAtivo] = useState(0);
  const [pausado, setPausado] = useState(false);
  const toqueInicial = useRef(null);

  useEffect(() => {
    if (pausado || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    const intervalo = window.setInterval(() => {
      setAtivo((atual) => (atual + 1) % demonstracoes.length);
    }, 6000);
    return () => window.clearInterval(intervalo);
  }, [pausado]);

  const mudar = (indice) => setAtivo((indice + demonstracoes.length) % demonstracoes.length);
  const iniciarToque = (evento) => { toqueInicial.current = evento.touches[0].clientX; setPausado(true); };
  const terminarToque = (evento) => {
    if (toqueInicial.current === null) return;
    const distancia = evento.changedTouches[0].clientX - toqueInicial.current;
    if (Math.abs(distancia) > 45) mudar(ativo + (distancia < 0 ? 1 : -1));
    toqueInicial.current = null;
    setPausado(false);
  };

  return (
    <section id="plataforma" data-reveal className="landing-reveal relative z-10 scroll-mt-20 border-b border-slate-200 bg-white py-16 sm:py-24">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 2xl:max-w-[1536px]">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-indigo-600">Conheça a plataforma</p>
          <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">Veja como o Vendai funciona na prática.</h2>
          <p className="mt-4 leading-7 text-slate-600">Da primeira venda ao relatório final, cada área foi criada para tornar a gestão diária mais simples e segura.</p>
        </div>

        <div className="landing-carousel mt-10" onMouseEnter={() => setPausado(true)} onMouseLeave={() => setPausado(false)} onFocusCapture={() => setPausado(true)} onBlurCapture={() => setPausado(false)}>
          <div id="demonstracao-vendai" role="region" aria-roledescription="carrossel" aria-label="Demonstração do sistema Vendai" className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-950 shadow-2xl shadow-slate-300/60">
            <div className="flex items-center border-b border-white/10 px-4 py-3">
              <div className="flex gap-1.5"><span className="size-2.5 rounded-full bg-red-400" /><span className="size-2.5 rounded-full bg-amber-400" /><span className="size-2.5 rounded-full bg-emerald-400" /></div>
              <span className="mx-auto rounded-md bg-white/[.06] px-5 py-1 text-[11px] font-medium text-slate-400">app.vendai.co.mz</span>
              <button type="button" onClick={() => setPausado((valor) => !valor)} className="grid size-8 place-items-center rounded-full text-slate-400 hover:bg-white/10 hover:text-white" aria-label={pausado ? "Retomar carrossel" : "Pausar carrossel"}>{pausado ? <Play size={15} /> : <Pause size={15} />}</button>
            </div>
            <div className="group relative overflow-hidden" onTouchStart={iniciarToque} onTouchEnd={terminarToque}>
              <div className="flex transition-transform duration-700 ease-[cubic-bezier(.22,.61,.36,1)]" style={{ transform: `translateX(-${ativo * 100}%)` }}>
                {demonstracoes.map((item, indice) => <article key={item.nome} className="w-full shrink-0" aria-hidden={ativo !== indice}>
                  <img src={item.imagem} alt={`${item.nome} do sistema Vendai`} className="aspect-[1.92/1] w-full bg-slate-100 object-cover object-top" loading={indice === 0 ? "eager" : "lazy"} decoding="async" draggable="false" />
                  <div className="grid gap-2 border-t border-white/10 px-5 py-5 text-white sm:grid-cols-[.75fr_1.25fr] sm:items-center sm:px-7"><div><span className="text-[10px] font-bold uppercase tracking-[.18em] text-slate-400">{item.nome} · {indice + 1}/{demonstracoes.length}</span><h3 className="mt-1 text-lg font-bold">{item.titulo}</h3></div><p className="text-sm leading-6 text-slate-400 sm:text-right">{item.texto}</p></div>
                </article>)}
              </div>
              <button type="button" onClick={() => mudar(ativo - 1)} className="absolute left-3 top-[40%] grid size-10 -translate-y-1/2 place-items-center rounded-full bg-slate-950/70 text-white shadow-lg backdrop-blur hover:bg-slate-800 sm:left-5 sm:size-11 sm:opacity-0 sm:group-hover:opacity-100" aria-label="Imagem anterior"><ChevronLeft size={20} /></button>
              <button type="button" onClick={() => mudar(ativo + 1)} className="absolute right-3 top-[40%] grid size-10 -translate-y-1/2 place-items-center rounded-full bg-slate-950/70 text-white shadow-lg backdrop-blur hover:bg-slate-800 sm:right-5 sm:size-11 sm:opacity-0 sm:group-hover:opacity-100" aria-label="Próxima imagem"><ChevronRight size={20} /></button>
              <span key={`progresso-${ativo}`} className={`landing-showcase-progress absolute inset-x-0 bottom-0 h-px origin-left bg-white/50 ${pausado ? "is-paused" : ""}`} />
            </div>
          </div>
          <div className="mt-5 flex items-center justify-center gap-2" role="tablist" aria-label="Selecionar imagem">{demonstracoes.map((item, indice) => <button key={item.nome} type="button" role="tab" aria-selected={ativo === indice} onClick={() => mudar(indice)} className={`h-2 rounded-full transition-all ${ativo === indice ? "w-8 bg-slate-700" : "w-2 bg-slate-300 hover:bg-slate-400"}`} aria-label={`Mostrar ${item.nome}`} />)}</div>
          <p className="mt-3 text-center text-xs text-slate-400 sm:hidden">Deslize para explorar os módulos</p>
        </div>
      </div>
    </section>
  );
}
function PlanCard({ plano, destaque, escolher }) {
  const gratuito = Number(plano.valor) === 0;
  const nomeNormalizado = plano.nome.toLocaleLowerCase("pt-MZ");
  const chave = nomeNormalizado.includes("teste") ? "teste" : nomeNormalizado.includes("enterprise") ? "enterprise" : nomeNormalizado.includes("business") ? "business" : "starter";
  const beneficios = beneficiosPorPlano[chave];
  return (
    <article
      className={`relative flex min-w-0 flex-col rounded-xl border p-5 transition hover:border-slate-300 hover:shadow-md sm:p-6 ${destaque ? "border-indigo-400 bg-indigo-50/50" : "border-slate-200 bg-white"}`}
    >
      {destaque && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-3 py-1 text-xs font-bold text-white shadow-md shadow-indigo-200">
          Mais escolhido
        </span>
      )}
      <h3 className="text-xl font-bold">{plano.nome}</h3>
      <p className="mt-3 min-h-10 text-sm leading-5 text-slate-500">
        {plano.descricao}
      </p>
      {chave === "enterprise" && <p className="mt-6 text-xs font-bold uppercase tracking-wider text-indigo-500">A partir de</p>}
      <p className={`${chave === "enterprise" ? "mt-1" : "mt-6"} break-words text-[clamp(1.7rem,7vw,1.875rem)] font-black`}>{moeda(plano.valor)}</p>
      <p className="mt-1 text-xs text-slate-500">
        {gratuito
          ? "14 dias de acesso gratuito"
          : `por ${plano.periodo_meses || 1} mês(es)`}
      </p>
      <ul className="mt-6 space-y-3 text-sm text-slate-600">
        {beneficios.map((beneficio) => (
          <li key={beneficio} className="flex gap-2">
            <Check size={17} className="shrink-0 text-emerald-400" />
            {beneficio}
          </li>
        ))}
      </ul>
      <button
        onClick={escolher}
        className={`mt-8 rounded-lg py-3 font-semibold transition ${destaque ? "bg-indigo-600 text-white hover:bg-indigo-700" : "bg-slate-100 text-slate-800 hover:bg-slate-200"}`}
      >
        {gratuito ? "Começar gratuitamente" : chave === "enterprise" ? "Solicitar Enterprise" : `Escolher ${plano.nome}`}
      </button>
    </article>
  );
}
function Stat({ numero, texto }) {
  return (
    <div className="border-b border-indigo-100/70 py-5 last:border-b-0 sm:border-b-0 sm:border-r sm:px-4 sm:py-0 sm:last:border-r-0">
      <p className="text-xl font-extrabold text-slate-900">{numero}</p>
      <p className="mt-1 text-sm text-slate-500">{texto}</p>
    </div>
  );
}
