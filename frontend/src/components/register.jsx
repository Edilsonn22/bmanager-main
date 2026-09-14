import { useState } from "react";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { register } from "../api/api";
import { useAuth } from "../features/auth/AuthContext";
import { Feedback } from "./ui/Feedback";
import vendaiLogo from "../assets/vendai-logo.png";

const FORMATO_EMAIL = /^[^\s@.]+(?:\.[^\s@.]+)*@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*\.[a-z]{2,63}$/i;

export default function Register() {
  const [form, setForm] = useState({ nome: "", empresa_nome: "", empresa_telefone: "", email: "", senha: "", confirmarSenha: "" });
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const { iniciarSessao } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const planoId = Number(params.get("plano")) || 1;
  const alterar = (campo) => (event) => setForm({ ...form, [campo]: event.target.value });
  const handleSubmit = async (event) => {
    event.preventDefault(); setErro("");
    const email = form.email.trim().toLowerCase();
    if (!FORMATO_EMAIL.test(email)) { setErro("Introduza um e-mail completo e válido, por exemplo: nome@empresa.com."); return; }
    if (form.senha !== form.confirmarSenha) { setErro("As senhas não coincidem."); return; }
    setLoading(true);
    try { const { confirmarSenha: _confirmarSenha, ...dados } = form; const sessao = await register({ ...dados, email, plano_id: planoId }); iniciarSessao(sessao); navigate(sessao.pagamentoNecessario ? "/assinatura" : "/painel", { replace: true }); }
    catch (error) { setErro(error.message); }
    finally { setLoading(false); }
  };

  return <main className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
    <form onSubmit={handleSubmit} aria-busy={loading} className="relative w-full min-w-0 max-w-md space-y-4 overflow-hidden rounded-2xl bg-white p-5 shadow-xl sm:p-8">
      {loading && <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/90 backdrop-blur-[2px]" role="status" aria-live="polite"><LoaderCircle className="animate-spin text-blue-600" size={34}/><p className="mt-3 font-semibold text-slate-800">A criar a sua empresa</p><p className="mt-1 text-sm text-slate-500">Estamos a preparar o seu acesso…</p></div>}
      <Link to="/" aria-label="Voltar à página inicial" className="inline-flex">
        <img src={vendaiLogo} alt="Vendai" className="h-10 w-auto max-w-36 object-contain" />
      </Link>
      <div><h1 className="text-2xl font-bold text-slate-900">Criar empresa</h1><p className="mt-1 text-slate-500">O seu utilizador será o administrador da empresa.</p></div>
      <Feedback tipo="erro">{erro}</Feedback>
      <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-3 text-sm text-indigo-800">Plano selecionado: <strong>Plano {planoId}</strong>. Poderá rever os detalhes antes de qualquer pagamento.</div>
      <label className="block text-sm font-medium">Nome<input disabled={loading} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 disabled:bg-slate-50" value={form.nome} onChange={alterar("nome")} required /></label>
      <label className="block text-sm font-medium">Nome da empresa<input disabled={loading} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 disabled:bg-slate-50" value={form.empresa_nome} onChange={alterar("empresa_nome")} required /></label>
      <label className="block text-sm font-medium">Contacto da empresa<input disabled={loading} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 disabled:bg-slate-50" type="tel" inputMode="numeric" autoComplete="tel" placeholder="Ex.: 841234567" value={form.empresa_telefone} onChange={(e) => setForm({ ...form, empresa_telefone: e.target.value.replace(/\D/g, "").slice(0, 9) })} pattern="[0-9]{9}" minLength="9" maxLength="9" title="Introduza exatamente 9 dígitos" required /><small className="mt-1 block font-normal text-slate-500">Introduza exatamente 9 dígitos.</small></label>
      <label className="block text-sm font-medium">E-mail<input disabled={loading} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50" type="email" inputMode="email" autoComplete="email" maxLength="254" value={form.email} onChange={alterar("email")} onBlur={(e) => e.currentTarget.setCustomValidity(e.currentTarget.value && !FORMATO_EMAIL.test(e.currentTarget.value.trim()) ? "Introduza um e-mail completo, por exemplo: nome@empresa.com" : "")} onInput={(e) => e.currentTarget.setCustomValidity("")} required /><small className="mt-1 block font-normal text-slate-500">Exemplo: nome@empresa.com</small></label>
      <label className="block text-sm font-medium">Senha<span className="relative mt-1 block"><input disabled={loading} className="w-full rounded-lg border border-slate-300 px-3 py-2 pr-11 disabled:bg-slate-50" type={mostrarSenha ? "text" : "password"} minLength="8" value={form.senha} onChange={alterar("senha")} aria-describedby="senha-ajuda" required /><button type="button" disabled={loading} onClick={() => setMostrarSenha((v) => !v)} aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-500 disabled:opacity-50">{mostrarSenha ? <EyeOff size={18}/> : <Eye size={18}/>}</button></span><small id="senha-ajuda" className="mt-1 block font-normal text-slate-500">Use pelo menos 8 caracteres.</small></label>
      <label className="block text-sm font-medium">Confirmar senha<input disabled={loading} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 disabled:bg-slate-50" type={mostrarSenha ? "text" : "password"} minLength="8" value={form.confirmarSenha} onChange={alterar("confirmarSenha")} required /></label>
      <button className="w-full rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-60" disabled={loading}>{loading ? <span className="inline-flex items-center justify-center gap-2"><LoaderCircle className="animate-spin" size={18}/>A criar…</span> : "Criar conta"}</button>
      <p className="text-center text-sm text-slate-600"><Link to="/login" className="font-semibold text-blue-600">Voltar ao login</Link></p>
    </form>
  </main>;
}
