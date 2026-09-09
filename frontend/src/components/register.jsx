import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { register } from "../api/api";
import { useAuth } from "../features/auth/AuthContext";
import { Feedback } from "./ui/Feedback";

export default function Register() {
  const [form, setForm] = useState({ nome: "", empresa_nome: "", email: "", senha: "", confirmarSenha: "" });
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
    if (form.senha !== form.confirmarSenha) { setErro("As senhas não coincidem."); return; }
    setLoading(true);
    try { const { confirmarSenha: _confirmarSenha, ...dados } = form; const sessao = await register({ ...dados, plano_id: planoId }); iniciarSessao(sessao); navigate(sessao.pagamentoNecessario ? "/assinatura" : "/painel", { replace: true }); }
    catch (error) { setErro(error.message); }
    finally { setLoading(false); }
  };

  return <main className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
    <form onSubmit={handleSubmit} className="w-full min-w-0 max-w-md space-y-4 rounded-2xl bg-white p-5 shadow-xl sm:p-8">
      <div><h1 className="text-2xl font-bold text-slate-900">Criar empresa</h1><p className="mt-1 text-slate-500">O seu utilizador será o administrador da empresa.</p></div>
      <Feedback tipo="erro">{erro}</Feedback>
      <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-3 text-sm text-indigo-800">Plano selecionado: <strong>Plano {planoId}</strong>. Poderá rever os detalhes antes de qualquer pagamento.</div>
      <label className="block text-sm font-medium">Nome<input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={form.nome} onChange={alterar("nome")} required /></label>
      <label className="block text-sm font-medium">Nome da empresa<input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={form.empresa_nome} onChange={alterar("empresa_nome")} required /></label>
      <label className="block text-sm font-medium">E-mail<input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" type="email" value={form.email} onChange={alterar("email")} required /></label>
      <label className="block text-sm font-medium">Senha<span className="relative mt-1 block"><input className="w-full rounded-lg border border-slate-300 px-3 py-2 pr-11" type={mostrarSenha ? "text" : "password"} minLength="8" value={form.senha} onChange={alterar("senha")} aria-describedby="senha-ajuda" required /><button type="button" onClick={() => setMostrarSenha((v) => !v)} aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-500">{mostrarSenha ? <EyeOff size={18}/> : <Eye size={18}/>}</button></span><small id="senha-ajuda" className="mt-1 block font-normal text-slate-500">Use pelo menos 8 caracteres.</small></label>
      <label className="block text-sm font-medium">Confirmar senha<input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" type={mostrarSenha ? "text" : "password"} minLength="8" value={form.confirmarSenha} onChange={alterar("confirmarSenha")} required /></label>
      <button className="w-full rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-60" disabled={loading}>{loading ? "A criar..." : "Criar conta"}</button>
      <p className="text-center text-sm text-slate-600"><Link to="/login" className="font-semibold text-blue-600">Voltar ao login</Link></p>
    </form>
  </main>;
}
