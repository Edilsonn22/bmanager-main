import { createElement, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  Banknote,
  Boxes,
  Check,
  Mail,
  MapPin,
  ShoppingCart,
  UserRoundCheck,
} from "lucide-react";
import { API_URL } from "../api/authenticatedFetch";
import painelDemo from "../assets/screenshots/panel.png";
import novaVendaDemo from "../assets/screenshots/panel.png";
import caixaDemo from "../assets/screenshots/caixa.png";
import relatoriosDemo from "../assets/screenshots/relatorios.png";
import utilizadoresDemo from "../assets/screenshots/utilizadores.png";
import reciboDemo from "../assets/screenshots/recibo.png";
import vendaiLogo from "../assets/vendai-logo.png";
import vendaiLogoDark from "../assets/vendai-logo-dark.png";

const demonstracoes = [
  {
    nome: "Painel",
    titulo: "A operação num único olhar",
    texto:
      "Indicadores de stock, alertas e movimentos recentes organizados para apoiar decisões rápidas.",
    imagem: painelDemo,
  },
  {
    nome: "Nova venda",
    titulo: "Venda com rapidez e controlo",
    texto:
      "Pesquisa, código de barras, carrinho, desconto e pagamento reunidos num fluxo simples para o balcão.",
    imagem: novaVendaDemo,
  },
  {
    nome: "Caixa",
    titulo: "Fecho de caixa com confiança",
    texto:
      "Acompanhe vendas e valores esperados antes de confirmar o montante contado no fim do turno.",
    imagem: caixaDemo,
  },
  {
    nome: "Relatórios",
    titulo: "Resultados fáceis de interpretar",
    texto:
      "Filtre os dados, acompanhe a evolução das vendas e exporte relatórios para CSV, Excel ou PDF.",
    imagem: relatoriosDemo,
  },
  {
    nome: "Utilizadores",
    titulo: "A equipa com acessos organizados",
    texto:
      "Crie utilizadores e distribua responsabilidades de acordo com o papel de cada membro da empresa.",
    imagem: utilizadoresDemo,
  },
  {
    nome: "Comprovativo",
    titulo: "Comprovativos claros e profissionais",
    texto:
      "Apresente cliente, pagamento, operador, produtos e totais num documento pronto para guardar ou imprimir.",
    imagem: reciboDemo,
  },
];

const beneficiosPorPlano = {
  teste: [
    "14 dias com recursos do Business",
    "Até 5 utilizadores",
    "Produtos e vendas ilimitados",
    "Sem cartão bancário",
  ],
  starter: [
    "1 utilizador e 1 estabelecimento",
    "Produtos, clientes e fornecedores ilimitados",
    "Vendas, stock e caixa",
    "Dashboard e relatórios essenciais",
    "Suporte por ticket",
  ],
  business: [
    "Tudo do Starter",
    "Até 5 utilizadores",
    "Perfis e permissões",
    "Gestão financeira e relatórios avançados",
    "Exportação Excel, CSV e PDF",
  ],
  enterprise: [
    "Tudo do Business",
    "Até 15 utilizadores",
    "Configuração personalizada",
    "Formação e implementação assistida",
    "Gestor de suporte dedicado",
  ],
};
const recursos = [
  {
    icon: ShoppingCart,
    titulo: "Vendas",
    texto:
      "Registe produtos, descontos e pagamentos num fluxo pensado para o balcão.",
  },
  {
    icon: Boxes,
    titulo: "Stock",
    texto:
      "Acompanhe quantidades, entradas, saídas e níveis mínimos em tempo real.",
  },
  {
    icon: Banknote,
    titulo: "Caixa",
    texto:
      "Confira valores recebidos e faça o fecho de cada turno com reconciliação.",
  },
  {
    icon: BarChart3,
    titulo: "Relatórios",
    texto:
      "Consulte resultados operacionais e exporte dados para apoiar decisões.",
  },
  {
    icon: UserRoundCheck,
    titulo: "Equipa",
    texto:
      "Atribua acessos de acordo com as responsabilidades de cada utilizador.",
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

  const irParaSecao = (evento, seletor) => {
    evento.preventDefault();
    document.querySelector(seletor)?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
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
    <main className="landing-page min-h-screen overflow-x-clip bg-white text-slate-900">
      <nav className="landing-nav sticky top-0 z-1000 mx-auto flex w-full items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-4 py-4 backdrop-blur sm:px-6 lg:px-8 ">
        <Link
          to="/"
          className="flex min-w-0 items-center"
          aria-label="Vendaí — página inicial"
        >
          <img
            src={vendaiLogo}
            alt="Vendaí"
            className="landing-logo h-8 w-auto object-contain sm:h-9 2xl:h-10"
          />
        </Link>
        <div className="hidden items-center gap-7 text-sm font-semibold text-slate-600 lg:flex">
          <a
            href="#plataforma"
            onClick={(evento) => irParaSecao(evento, "#plataforma")}
            className="transition hover:text-blue-800"
          >
            Plataforma
          </a>
          <a
            href="#recursos"
            onClick={(evento) => irParaSecao(evento, "#recursos")}
            className="transition hover:text-blue-800"
          >
            Recursos
          </a>
          <a
            href="#como-funciona"
            onClick={(evento) => irParaSecao(evento, "#como-funciona")}
            className="transition hover:text-blue-800"
          >
            Como funciona
          </a>
          <a
            href="#planos"
            onClick={(evento) => irParaSecao(evento, "#planos")}
            className="transition hover:text-blue-800"
          >
            Planos
          </a>
        </div>
        <div className="landing-nav-actions flex shrink-0 items-center gap-2.5 sm:gap-5">
          <Link
            to="/login"
            className="landing-login-link text-sm font-semibold text-slate-600 transition hover:text-blue-800"
          >
            Entrar
          </Link>
          <Link
            to="/registo?plano=1"
            className="whitespace-nowrap rounded-lg bg-blue-800 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-900 sm:px-5 sm:text-sm"
          >
            Criar conta
          </Link>
        </div>
      </nav>
      <div className="landing-mobile-nav relative z-40 flex gap-6 overflow-x-auto border-b border-slate-100 bg-white px-4 py-3 text-xs font-bold text-slate-600 lg:hidden">
        <a
          href="#plataforma"
          onClick={(evento) => irParaSecao(evento, "#plataforma")}
        >
          Plataforma
        </a>
        <a
          href="#recursos"
          onClick={(evento) => irParaSecao(evento, "#recursos")}
        >
          Recursos
        </a>
        <a
          href="#como-funciona"
          onClick={(evento) => irParaSecao(evento, "#como-funciona")}
        >
          Como funciona
        </a>
        <a href="#planos" onClick={(evento) => irParaSecao(evento, "#planos")}>
          Planos
        </a>
      </div>
      <section className="landing-hero relative z-10 mx-auto grid w-full max-w-[1680px] items-center gap-8 px-4 pb-10 pt-8 sm:gap-10 sm:px-6 sm:pb-16 sm:pt-12 md:grid-cols-[minmax(0,.95fr)_minmax(0,1.05fr)] md:gap-8 lg:grid-cols-[minmax(0,.8fr)_minmax(0,1.2fr)] lg:gap-12 lg:px-8 lg:py-20 2xl:gap-16">
        <div className="landing-enter min-w-0 text-left">
          <p className="text-xs font-bold uppercase text-blue-800">
            Sistema POS · Ponto de venda
          </p>
          <h1 className="landing-display mt-4 max-w-2xl font-sans text-3xl leading-tight text-slate-950 sm:mt-5 sm:text-4xl xl:text-6xl">
            Vendas, stock e caixa num só sistema.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-slate-600 sm:mt-6 sm:text-lg">
            Registe vendas e pagamentos, acompanhe o stock e faça o fecho de
            caixa num único sistema.
          </p>
          <div className="landing-actions mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row">
            <Link
              to="/registo?plano=1"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-800 px-5 py-3 font-semibold text-white transition hover:bg-blue-900"
            >
              Criar conta
              <ArrowRight size={17} />
            </Link>
            <a
              href="#planos"
              onClick={(evento) => irParaSecao(evento, "#planos")}
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 transition hover:border-blue-500 hover:text-blue-950"
            >
              Consultar planos
            </a>
          </div>
          <p className="mt-3 text-xs text-slate-500 sm:mt-5">
            14 dias para testar · Sem cartão bancário
          </p>
        </div>
        <DashboardImage />
      </section>
      <ProductShowcase />
      <section
        id="recursos"
        data-reveal
        className="landing-reveal relative z-10 scroll-mt-20 border-y border-slate-200 bg-[#f5f7f5] px-4 py-14 sm:px-6 sm:py-18 lg:px-8"
      >
        <div className="mx-auto grid w-full max-w-[1680px] gap-10 lg:grid-cols-[.8fr_1.2fr] lg:gap-20 2xl:gap-28">
          <div>
            <p className="text-xs font-bold uppercase text-blue-800">
              Operação diária
            </p>
            <h2 className="landing-display mt-3 text-3xl leading-tight text-slate-950 sm:text-4xl">
              O essencial para gerir com consistência.
            </h2>
            <p className="mt-4 max-w-md leading-7 text-slate-600">
              Registos ligados entre si para evitar duplicação e dar uma visão
              fiável do negócio.
            </p>
          </div>
          <div className="grid sm:grid-cols-2">
            {recursos.map(({ icon, titulo, texto }, indice) => (
              <article
                key={titulo}
                className={`flex gap-4 border-slate-200 py-5 ${indice < 2 ? "border-b" : ""} ${indice % 2 === 0 ? "sm:pr-6" : "sm:border-l sm:pl-6"} ${indice > 1 ? "sm:border-b-0" : ""}`}
              >
                <span className="mt-0.5 shrink-0 text-blue-800">
                  {createElement(icon, { size: 19, strokeWidth: 1.8 })}
                </span>
                <div>
                  <h3 className="font-semibold text-slate-900">{titulo}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {texto}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="border-b border-slate-200 px-4 py-5 text-center text-xs leading-5 text-slate-500 sm:px-6">
        Os recibos emitidos são comprovativos comerciais e não substituem
        faturação fiscal certificada.
      </section>
      <section
        id="como-funciona"
        data-reveal
        className="landing-reveal relative z-10 mx-auto w-full max-w-[1680px] scroll-mt-20 px-4 py-14 sm:px-6 sm:py-20 lg:px-8"
      >
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase text-blue-800">
            Implementação
          </p>
          <h2 className="landing-display mt-3 text-3xl leading-tight text-slate-950 sm:text-4xl">
            Comece a trabalhar em três passos.
          </h2>
        </div>
        <div className="mt-9 grid gap-x-8 gap-y-7 sm:grid-cols-3">
          {[
            [
              "01",
              "Configure a empresa",
              "Registe os dados essenciais do negócio.",
            ],
            [
              "02",
              "Adicione produtos",
              "Organize catálogo, preços e quantidades iniciais.",
            ],
            ["03", "Abra o caixa", "Registe as vendas e acompanhe cada turno."],
          ].map(([numero, titulo, texto]) => (
            <article key={numero} className="border-t border-slate-300 pt-4">
              <span className="text-xs font-bold text-blue-800">{numero}</span>
              <h3 className="mt-3 text-base font-semibold text-slate-900">
                {titulo}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{texto}</p>
            </article>
          ))}
        </div>
      </section>
      <section
        id="planos"
        data-reveal
        className="landing-reveal relative z-10 mx-auto w-full max-w-[1680px] scroll-mt-8 px-4 pb-16 sm:px-6 sm:pb-24 lg:px-8 lg:pb-24"
      >
        <div>
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase text-blue-800">
              Planos e preços
            </p>
            <h2 className="landing-display mt-3 text-3xl leading-tight text-slate-950 sm:text-4xl">
              Escolha o plano adequado à sua operação.
            </h2>
            <p className="mt-3 leading-7 text-slate-600">
              Comece com o essencial e mude de plano quando precisar.
            </p>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {carregando
              ? [1, 2, 3].map((n) => (
                  <div
                    key={n}
                    className="h-72 animate-pulse rounded-lg bg-slate-100"
                  />
                ))
              : planos.map((plano) => (
                  <PlanCard
                    key={plano.id}
                    plano={plano}
                    destaque={plano.nome
                      .toLocaleLowerCase("pt-MZ")
                      .includes("business")}
                    escolher={() => navigate(`/registo?plano=${plano.id}`)}
                  />
                ))}
          </div>
          {!carregando && planos.length === 0 && (
            <p className="mt-8 text-center text-slate-500">
              Não foi possível carregar os planos. Tente novamente em instantes.
            </p>
          )}
        </div>
      </section>
      <section
        data-reveal
        className="landing-reveal border-y border-blue-950 bg-blue-950 px-4 py-12 text-white sm:px-6 sm:py-14 lg:px-8"
      >
        <div className="mx-auto flex w-full max-w-[1680px] flex-col gap-7 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase text-blue-200">
              Teste por 14 dias
            </p>
            <h2 className="landing-display mt-2 text-2xl leading-tight sm:text-3xl">
              Veja como o Vendaí se adapta à sua operação.
            </h2>
            <p className="mt-3 text-sm leading-6 text-blue-100">
              Sem cartão bancário. Cancele quando quiser.
            </p>
          </div>
          <Link
            to="/registo?plano=1"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-white px-5 py-3 font-semibold text-blue-950 transition hover:bg-blue-50"
          >
            Criar conta
            <ArrowRight size={17} />
          </Link>
        </div>
      </section>
      <footer className="relative z-10 border-t border-slate-800 bg-slate-950 text-slate-300">
        <div className="mx-auto grid w-full max-w-[1680px] gap-10 px-5 py-12 sm:px-6 md:grid-cols-2 lg:grid-cols-[1.35fr_.8fr_1fr] lg:px-8 lg:py-16">
          <div>
            <Link
              to="/"
              aria-label="Vendaí — página inicial"
              className="inline-flex py-1"
            >
              <img
                src={vendaiLogoDark}
                alt="Vendaí"
                className="h-10 w-auto object-contain sm:h-11"
              />
            </Link>
            <p className="mt-5 max-w-sm text-sm leading-6 text-slate-400">
              Gestão simples e integrada para acompanhar vendas, stock, caixa e
              resultados do seu negócio.
            </p>
            <Link
              to="/registo?plano=1"
              className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-white hover:text-blue-200"
            >
              Começar gratuitamente <ArrowRight size={16} />
            </Link>
          </div>

          <div>
            <h2 className="text-sm font-bold uppercase text-white">
              Navegação
            </h2>
            <nav
              className="mt-5 flex flex-col items-start gap-3 text-sm"
              aria-label="Navegação do rodapé"
            >
              <a
                href="#plataforma"
                onClick={(evento) => irParaSecao(evento, "#plataforma")}
                className="hover:text-white"
              >
                Plataforma
              </a>
              <a
                href="#recursos"
                onClick={(evento) => irParaSecao(evento, "#recursos")}
                className="hover:text-white"
              >
                Recursos
              </a>
              <a
                href="#como-funciona"
                onClick={(evento) => irParaSecao(evento, "#como-funciona")}
                className="hover:text-white"
              >
                Como funciona
              </a>
              <a
                href="#planos"
                onClick={(evento) => irParaSecao(evento, "#planos")}
                className="hover:text-white"
              >
                Planos
              </a>
              <Link to="/login" className="hover:text-white">
                Entrar
              </Link>
            </nav>
          </div>

          <div>
            <h2 className="text-sm font-bold uppercase text-white">
              Contactos
            </h2>
            <div className="mt-5 space-y-4 text-sm">
              <a
                href="mailto:2026vendai@gmail.com"
                className="flex items-center gap-3 hover:text-white"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white/[.07]">
                  <Mail size={17} />
                </span>
                <span className="break-all">2026vendai@gmail.com</span>
              </a>
              <p className="flex items-center gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white/[.07]">
                  <MapPin size={17} />
                </span>
                <span>Maputo, Moçambique</span>
              </p>
            </div>
          </div>
        </div>
        <div className="border-t border-white/10">
          <div className="mx-auto flex w-full max-w-[1680px] flex-col gap-2 px-5 py-5 text-center text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:text-left lg:px-8">
            <p>
              © {new Date().getFullYear()} Vendaí. Todos os direitos reservados.
            </p>
            <p>Desenvolvido em Maputo para negócios que querem avançar.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}

function DashboardImage() {
  return (
    <div className="landing-enter landing-delay mx-auto w-full min-w-0">
      <div className="mb border border-slate-300 bg-white p-1.5 sm:p-2 2xl:p-3">
        <img
          src={painelDemo}
          alt="Pré-visualização do painel da Vendaí com indicadores de stock, gráfico e produtos"
          className="block h-auto w-full object-contain object-top"
          decoding="async"
        />
      </div>
      <p className="mt-2 text-right text-xs text-slate-500">
        Painel de gestão Vendaí
      </p>
    </div>
  );
}

function ProductShowcase() {
  const [ativo, setAtivo] = useState(0);
  const mudar = (indice) =>
    setAtivo((indice + demonstracoes.length) % demonstracoes.length);

  return (
    <section
      id="plataforma"
      data-reveal
      className="landing-reveal relative z-10 scroll-mt-20 border-y border-slate-200 bg-[#f5f7f5] py-14 sm:py-20"
    >
      <div className="mx-auto w-full max-w-[1680px] px-4 sm:px-6 lg:px-8">
        <div className="mb-8 max-w-2xl">
          <p className="text-xs font-bold uppercase text-blue-800">
            Plataforma
          </p>
          <h2 className="landing-display mt-3 text-3xl leading-tight text-slate-950 sm:text-4xl">
            Veja o sistema em utilização.
          </h2>
        </div>
        <div className="grid items-center gap-7 lg:grid-cols-[minmax(0,1.45fr)_minmax(250px,.55fr)] lg:gap-12">
          <div className="border border-slate-300 bg-white p-1.5 sm:p-2">
            <img
              src={demonstracoes[ativo].imagem}
              alt={`${demonstracoes[ativo].nome} do sistema Vendaí`}
              className="aspect-[1.75/1] w-full bg-white object-contain object-top"
              loading="lazy"
              decoding="async"
            />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-blue-800">
              {demonstracoes[ativo].nome} · {String(ativo + 1).padStart(2, "0")}
            </p>
            <h3 className="landing-display mt-3 text-2xl leading-tight text-slate-950 sm:text-3xl">
              {demonstracoes[ativo].titulo}
            </h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {demonstracoes[ativo].texto}
            </p>
            <div
              className="mt-6 grid grid-cols-2 border-t border-slate-300"
              role="tablist"
              aria-label="Módulos do Vendaí"
            >
              {demonstracoes.map((item, indice) => (
                <button
                  key={item.nome}
                  type="button"
                  role="tab"
                  aria-selected={ativo === indice}
                  onClick={() => mudar(indice)}
                  className={`border-b border-slate-300 py-2.5 text-left text-xs font-medium transition ${ativo === indice ? "border-b-2 border-blue-800 text-blue-900" : "text-slate-600 hover:text-slate-950"}`}
                >
                  {item.nome}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
function PlanCard({ plano, destaque, escolher }) {
  const gratuito = Number(plano.valor) === 0;
  const nomeNormalizado = plano.nome.toLocaleLowerCase("pt-MZ");
  const chave = nomeNormalizado.includes("teste")
    ? "teste"
    : nomeNormalizado.includes("enterprise")
      ? "enterprise"
      : nomeNormalizado.includes("business")
        ? "business"
        : "starter";
  const beneficios = beneficiosPorPlano[chave];
  return (
    <article
      className={`flex min-w-0 flex-col rounded-lg border p-5 ${destaque ? "border-blue-800 bg-[#f3f7f4]" : "border-slate-200 bg-white"}`}
    >
      {destaque && (
        <span className="mb-3 text-xs font-semibold uppercase text-blue-800">
          Plano recomendado
        </span>
      )}
      <h3 className="text-lg font-semibold text-slate-950">{plano.nome}</h3>
      <p className="mt-3 min-h-10 text-sm leading-5 text-slate-500">
        {plano.descricao}
      </p>
      {chave === "enterprise" && (
        <p className="mt-6 text-xs font-bold uppercase text-slate-600">
          A partir de
        </p>
      )}
      <p
        className={`${chave === "enterprise" ? "mt-1" : "mt-6"} wrap-break-word text-3xl font-bold tabular-nums text-slate-950`}
      >
        {moeda(plano.valor)}
      </p>
      <p className="mt-1 text-xs text-slate-500">
        {gratuito
          ? "14 dias de acesso gratuito"
          : `por ${plano.periodo_meses || 1} mês(es)`}
      </p>
      <ul className="mt-6 space-y-3 text-sm text-slate-600">
        {beneficios.map((beneficio) => (
          <li key={beneficio} className="flex gap-2">
            <Check size={17} className="shrink-0 text-blue-800" />
            {beneficio}
          </li>
        ))}
      </ul>
      <button
        onClick={escolher}
        className={`mt-8 rounded-md border px-3 py-2.5 text-sm font-semibold transition ${destaque ? "border-blue-800 bg-blue-800 text-white hover:bg-blue-900" : "border-slate-300 bg-white text-slate-800 hover:border-blue-500 hover:bg-blue-50"}`}
      >
        {gratuito
          ? "Começar gratuitamente"
          : chave === "enterprise"
            ? "Solicitar Enterprise"
            : `Escolher ${plano.nome}`}
      </button>
    </article>
  );
}
