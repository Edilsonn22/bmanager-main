import { LockKeyhole } from "lucide-react";
import { Link } from "react-router-dom";

export default function AccessDenied() {
  return <main className="flex flex-1 items-center justify-center bg-slate-50 p-6"><section className="max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">
    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600"><LockKeyhole /></div>
    <h1 className="text-xl font-bold text-slate-900">Acesso restrito</h1>
    <p className="mt-2 text-slate-600">O seu papel não tem permissão para aceder a este módulo.</p>
    <Link to="/" className="mt-6 inline-flex rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700">Voltar ao painel</Link>
  </section></main>;
}
