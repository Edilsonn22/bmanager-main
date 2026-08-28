import { useEffect, useState } from "react";
import { API_URL } from "../api/authenticatedFetch";
const vazio = {
  nome: "",
  descricao: "",
  preco: "",
  tipo: "mensal",
  limite_usuarios: 1,
  limite_produtos: 100,
};

export default function PlanosAdmin() {
  const [planos, setPlanos] = useState([]);
  const [form, setForm] = useState(vazio);
  const [erro, setErro] = useState("");
  const carregar = async () => {
    const resposta = await fetch(`${API_URL}/planos`);
    const dados = await resposta.json();
    if (!resposta.ok)
      throw new Error(dados.erro || "Não foi possível carregar os planos.");
    setPlanos(dados.planos || []);
  };
  useEffect(() => {
    carregar().catch((e) => setErro(e.message));
  }, []);
  const salvar = async (event) => {
    event.preventDefault();
    setErro("");
    try {
      const resposta = await fetch(`${API_URL}/planos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const dados = await resposta.json();
      if (!resposta.ok)
        throw new Error(dados.erro || "Não foi possível criar o plano.");
      setForm(vazio);
      await carregar();
    } catch (e) {
      setErro(e.message);
    }
  };
  const alterar = (campo) => (event) =>
    setForm({ ...form, [campo]: event.target.value });
  return (
    <main className="flex-1 overflow-auto bg-slate-50 p-7">
      <h1 className="text-2xl font-bold">Gestão de planos</h1>
      <p className="mt-1 text-slate-600">
        Apenas administradores da plataforma podem criar ou alterar planos.
      </p>
      {erro && (
        <p className="mt-4 rounded-lg bg-red-50 p-3 text-red-700">{erro}</p>
      )}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="font-semibold">Planos atuais</h2>
          <div className="mt-4 space-y-3">
            {planos.map((p) => (
              <div key={p.id} className="rounded-lg border p-3">
                <strong>{p.nome}</strong>
                <p className="text-sm">
                  {p.valor} MZN · {p.tipo} · {p.limite_usuarios} utilizadores ·{" "}
                  {p.limite_produtos} produtos
                </p>
              </div>
            ))}
          </div>
        </section>
        <form onSubmit={salvar} className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="font-semibold">Novo plano</h2>
          <div className="mt-4 grid gap-3">
            <input
              className="rounded border p-2"
              placeholder="Nome"
              value={form.nome}
              onChange={alterar("nome")}
              required
            />
            <input
              className="rounded border p-2"
              placeholder="Descrição"
              value={form.descricao}
              onChange={alterar("descricao")}
            />
            <input
              className="rounded border p-2"
              type="number"
              min="0"
              step="0.01"
              placeholder="Preço"
              value={form.preco}
              onChange={alterar("preco")}
              required
            />
            <select
              className="rounded border p-2"
              value={form.tipo}
              onChange={alterar("tipo")}
            >
              <option value="mensal">Mensal</option>
              <option value="anual">Anual</option>
              <option value="vitalicio">Vitalício</option>
            </select>
            <input
              className="rounded border p-2"
              type="number"
              min="1"
              placeholder="Limite de utilizadores"
              value={form.limite_usuarios}
              onChange={alterar("limite_usuarios")}
            />
            <input
              className="rounded border p-2"
              type="number"
              min="1"
              placeholder="Limite de produtos"
              value={form.limite_produtos}
              onChange={alterar("limite_produtos")}
            />
            <button className="rounded bg-indigo-600 p-2 font-medium text-white">
              Criar plano
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
