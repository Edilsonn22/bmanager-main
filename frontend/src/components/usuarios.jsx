import { useEffect, useState } from "react";
import { API_URL } from "../api/authenticatedFetch";

const initialForm = { nome: "", email: "", senha: "", role: "operador" };

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const carregar = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/usuarios`);
      const data = await response.json();
      if (!response.ok)
        throw new Error(
          data.message || "Não foi possível carregar os utilizadores.",
        );
      setUsuarios(data.usuarios);
    } catch (error) {
      setErro(error.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    carregar();
  }, []);

  const criar = async (event) => {
    event.preventDefault();
    setErro("");
    setSucesso("");
    setSaving(true);
    try {
      const response = await fetch(`${API_URL}/auth/usuarios`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Não foi possível criar o utilizador.");
      setUsuarios((atual) =>
        [...atual, data.usuario].sort((a, b) => a.nome.localeCompare(b.nome)),
      );
      setForm(initialForm);
      setSucesso("Utilizador criado com sucesso.");
    } catch (error) {
      setErro(error.message);
    } finally {
      setSaving(false);
    }
  };
  const mudar = (campo) => (event) =>
    setForm({ ...form, [campo]: event.target.value });

  return (
    <main className="flex-1 overflow-auto bg-slate-50 p-7">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Utilizadores</h1>
        <p className="text-slate-600">
          Adicione gestores e operadores à sua empresa.
        </p>
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 p-5">
            <h2 className="font-semibold">Membros da empresa</h2>
          </div>
          {loading ? (
            <p className="p-6 text-slate-500">A carregar...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="p-4">Nome</th>
                    <th className="p-4">E-mail</th>
                    <th className="p-4">Papel</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map((usuario) => (
                    <tr key={usuario.id} className="border-t border-slate-100">
                      <td className="p-4 font-medium">{usuario.nome}</td>
                      <td className="p-4 text-slate-600">{usuario.email}</td>
                      <td className="p-4">
                        <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 capitalize">
                          {usuario.role}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
        <form
          onSubmit={criar}
          className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <h2 className="font-semibold">Novo utilizador</h2>
          <p className="mb-4 text-sm text-slate-500">
            Administradores são criados apenas no registo da empresa.
          </p>
          {erro && (
            <p className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {erro}
            </p>
          )}
          {sucesso && (
            <p className="mb-3 rounded-lg bg-green-50 p-3 text-sm text-green-700">
              {sucesso}
            </p>
          )}
          <div className="space-y-3">
            <label className="block text-sm font-medium">
              Nome
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 p-2"
                value={form.nome}
                onChange={mudar("nome")}
                required
              />
            </label>
            <label className="block text-sm font-medium">
              E-mail
              <input
                type="email"
                className="mt-1 w-full rounded-lg border border-slate-300 p-2"
                value={form.email}
                onChange={mudar("email")}
                required
              />
            </label>
            <label className="block text-sm font-medium">
              Senha
              <input
                type="password"
                minLength="6"
                className="mt-1 w-full rounded-lg border border-slate-300 p-2"
                value={form.senha}
                onChange={mudar("senha")}
                required
              />
            </label>
            <label className="block text-sm font-medium">
              Papel
              <select
                className="mt-1 w-full rounded-lg border border-slate-300 p-2"
                value={form.role}
                onChange={mudar("role")}
              >
                <option value="operador">Operador — estoque</option>
                <option value="gestor">
                  Gestor — estoque, financeiro e relatórios
                </option>
              </select>
            </label>
            <button
              disabled={saving}
              className="w-full rounded-lg bg-blue-600 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {saving ? "A criar..." : "Criar utilizador"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
