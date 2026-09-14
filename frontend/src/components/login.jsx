import { useState } from "react";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { login } from "../api/api";
import { useAuth } from "../features/auth/AuthContext";
import vendaiLogo from "../assets/vendai-logo.png";
import { Feedback } from "./ui/Feedback";

export default function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const { iniciarSessao } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErro("");
    setLoading(true);
    try {
      const sessao = await login({ email, senha });
      iniciarSessao(sessao);
      const proprietario = sessao.usuario?.tipo_conta === "platform_owner";
      const destinoAnterior = location.state?.from?.pathname;
      const destinoSeguro = destinoAnterior && !destinoAnterior.startsWith("/admin/")
        ? destinoAnterior
        : "/painel";
      navigate(proprietario ? "/admin/sistema" : destinoSeguro, { replace: true, state: null });
    } catch (error) {
      setErro(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        aria-busy={loading}
        className="relative w-full min-w-0 max-w-md space-y-5 overflow-hidden rounded-2xl bg-white p-5 shadow-xl sm:p-8"
      >
        {loading && <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/90 backdrop-blur-[2px]" role="status" aria-live="polite"><LoaderCircle className="animate-spin text-blue-600" size={34}/><p className="mt-3 font-semibold text-slate-800">A validar o seu acesso</p><p className="mt-1 text-sm text-slate-500">Aguarde um momento…</p></div>}
        <div>
          <Link to="/" aria-label="Voltar à página inicial" className="mb-3 inline-flex">
            <img src={vendaiLogo} alt="Vendai" className="h-10 w-auto max-w-36 object-contain" />
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">
            Entrar no Vendai
          </h1>
          <p className="mt-1 text-slate-500">Aceda ao painel da sua empresa.</p>
        </div>
        <Feedback tipo="sucesso">{location.state?.senhaRedefinida ? "Senha atualizada com sucesso. Entre com a nova senha." : ""}</Feedback>
        <Feedback tipo="erro">{erro}</Feedback>
        <label className="block text-sm font-medium text-slate-700">
          E-mail
          <input
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            required
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Senha
          <span className="relative mt-1 block"><input
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
            type={mostrarSenha ? "text" : "password"}
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            disabled={loading}
            required
          /><button type="button" disabled={loading} onClick={() => setMostrarSenha((v) => !v)} aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-500 hover:bg-slate-100 disabled:opacity-50">{mostrarSenha ? <EyeOff size={18}/> : <Eye size={18}/>}</button></span>
        </label>
        <div className="-mt-2 text-right text-sm">
          <Link to="/recuperar-senha" className="font-medium text-blue-600 hover:text-blue-700">
            Esqueceu a senha?
          </Link>
        </div>
        <button
          className="w-full rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          disabled={loading}
        >
          {loading ? <span className="inline-flex items-center justify-center gap-2"><LoaderCircle className="animate-spin" size={18}/>A entrar…</span> : "Entrar"}
        </button>
        <p className="text-center text-sm text-slate-600">
          Ainda não tem conta?{" "}
          <Link to="/registo" className="font-semibold text-blue-600">
            Criar empresa
          </Link>
        </p>
      </form>
    </main>
  );
}
