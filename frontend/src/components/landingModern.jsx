import { createElement, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Boxes,
  Check,
  CircleCheck,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UsersRound,
} from "lucide-react";
import { API_URL } from "../api/authenticatedFetch";
import dashboardHero from "../assets/dashboard-hero.png";
import vendaiLogo from "../assets/vendai-logo.png";

const beneficios = [
  "Controlo de stock e movimentos em tempo real",
  "Relatórios claros para decisões mais rápidas",
  "Gestão integrada de fornecedores, equipa e faturação",
];
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

  const irParaPlanos = (evento) => {
    evento.preventDefault();
    document.querySelector("#planos")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
    window.history.replaceState(null, "", "#planos");
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
    <main className="landing-page min-h-screen overflow-hidden bg-[#f8f9ff] text-slate-900">
      <div className="landing-orb landing-orb-one" />
      <div className="landing-orb landing-orb-two" />
      <div className="landing-grid pointer-events-none absolute inset-0" />
      <nav className="landing-nav relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-6 sm:py-6 lg:px-8 2xl:max-w-[1536px]">
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
        <div className="landing-nav-actions flex shrink-0 items-center gap-2.5 sm:gap-5">
          <Link
            to="/login"
            className="landing-login-link text-sm font-semibold text-slate-600 transition hover:text-indigo-600"
          >
            Entrar
          </Link>
          <Link
            to="/registo?plano=1"
            className="whitespace-nowrap rounded-full bg-slate-900 px-3.5 py-2.5 text-xs font-bold text-white shadow-lg shadow-slate-200 transition hover:-translate-y-0.5 hover:bg-indigo-600 sm:px-5 sm:text-sm"
          >
            Criar conta
          </Link>
        </div>
      </nav>
      <section className="landing-hero relative z-10 mx-auto grid w-full max-w-7xl items-center gap-10 px-4 pb-16 pt-7 sm:gap-14 sm:px-6 sm:pb-24 sm:pt-12 lg:grid-cols-[minmax(0,1.02fr)_minmax(0,.98fr)] lg:px-8 lg:pb-28 lg:pt-16 2xl:max-w-[1536px] 2xl:gap-20 2xl:pb-32 2xl:pt-20">
        <div className="landing-enter min-w-0 text-center lg:text-left">
          <p className="landing-eyebrow inline-flex max-w-full items-center gap-2 rounded-full border border-indigo-100 bg-white/80 px-3 py-2 text-[0.7rem] font-semibold leading-5 text-indigo-700 shadow-sm shadow-indigo-100/60 backdrop-blur sm:px-3.5 sm:text-sm">
            <Sparkles size={15} className="shrink-0 text-indigo-500" />
            <span>Gestão inteligente para empresas em crescimento</span>
          </p>
          <h1 className="landing-title mx-auto mt-5 max-w-3xl text-[clamp(2.05rem,8vw,4rem)] font-black leading-[1.05] tracking-[-0.04em] sm:mt-6 lg:mx-0 2xl:max-w-4xl 2xl:text-[4.5rem]">
            O seu negócio merece{" "}
            <span className="landing-gradient-text">
              clareza todos os dias.
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-[clamp(1rem,2vw,1.125rem)] leading-7 text-slate-600 sm:mt-6 lg:mx-0 2xl:max-w-2xl 2xl:text-xl 2xl:leading-8">
            Controle stock, vendas e equipa num painel simples. Menos tarefas
            manuais, mais tempo para fazer o negócio avançar.
          </p>
          <div className="landing-actions mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center lg:mt-8 lg:justify-start">
            <Link
              to="/registo?plano=1"
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-indigo-600 px-6 py-3.5 font-bold text-white shadow-xl shadow-indigo-200 transition hover:-translate-y-0.5 hover:bg-indigo-700"
            >
              Começar grátis{" "}
              <ArrowRight
                size={18}
                className="transition group-hover:translate-x-1"
              />
            </Link>
            <a
              href="#planos"
              onClick={irParaPlanos}
              className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white/75 px-6 py-3.5 font-bold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:text-indigo-700"
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
      <section data-reveal className="landing-reveal relative z-10 border-y border-indigo-100/70 bg-white/65 py-8 backdrop-blur-sm">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-0 px-4 text-center sm:grid-cols-3 sm:px-6 lg:px-8 2xl:max-w-7xl">
          <Stat numero="14 dias" texto="para testar sem compromisso" />
          <Stat numero="1 painel" texto="para a operação inteira" />
          <Stat numero="100%" texto="dos dados isolados por empresa" />
        </div>
      </section>
      <section data-reveal className="landing-reveal relative z-10 mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-28 2xl:max-w-[1536px]">
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
              className="landing-feature landing-reveal group rounded-3xl border border-slate-200/80 bg-white/75 p-5 shadow-sm shadow-indigo-100/40 transition hover:-translate-y-1.5 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-100/70 sm:p-7"
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
          <div className="mt-9 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {carregando
              ? [1, 2, 3].map((n) => (
                  <div
                    key={n}
                    className="h-80 animate-pulse rounded-3xl bg-slate-100"
                  />
                ))
              : planos.map((plano, indice) => (
                  <PlanCard
                    key={plano.id}
                    plano={plano}
                    destaque={indice === 1}
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
      <footer className="relative z-10 border-t border-indigo-100 px-5 py-8 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} Vendai. Gestão simples para negócios que
        querem avançar.
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
      <div className="landing-dashboard relative overflow-hidden rounded-[2rem] border border-white/90 bg-white/70 p-2 shadow-2xl shadow-indigo-200/60 backdrop-blur-xl sm:p-3">
        <img
          src={dashboardHero}
          alt="Pré-visualização do painel da Vendai com indicadores de stock, gráfico e produtos"
          className="aspect-[16/10] w-full rounded-[1.35rem] object-cover object-center"
          decoding="async"
        />
      </div>
    </div>
  );
}
function PlanCard({ plano, destaque, escolher }) {
  const gratuito = Number(plano.valor) === 0;
  return (
    <article
      className={`relative flex min-w-0 flex-col rounded-3xl border p-5 transition hover:-translate-y-1 sm:p-6 ${destaque ? "border-indigo-300 bg-indigo-50/80 shadow-xl shadow-indigo-100" : "border-slate-200 bg-white/80"}`}
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
      <p className="mt-6 break-words text-[clamp(1.7rem,7vw,1.875rem)] font-black">{moeda(plano.valor)}</p>
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
        className={`mt-8 rounded-full py-3 font-bold transition ${destaque ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700" : "bg-slate-100 text-slate-800 hover:bg-slate-200"}`}
      >
        {gratuito ? "Começar grátis" : "Escolher plano"}
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
