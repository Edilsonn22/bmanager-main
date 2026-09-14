import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { API_URL } from "../api/authenticatedFetch";

export default function AdicionarCategoria() {
  const navigate = useNavigate();
  const location = useLocation();
  const [nome, setNome] = useState("");
  const [descr, setDescr] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  const guardar = async (event) => {
    event.preventDefault();
    setErro("");
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/categorias`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, descr }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.erro || "Não foi possível criar a categoria.");
      navigate(location.state?.returnTo || "/categoria", { replace: true });
    } catch (error) {
      setErro(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <form
        onSubmit={guardar}
        className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl space-y-4"
      >
        <div>
          <h2 className="font-bold text-gray-900">Adicionar categoria</h2>
          <p className="text-sm text-gray-500">
            Esta categoria ficará disponível apenas para a sua empresa.
          </p>
        </div>
        {erro && (
          <p className="rounded bg-red-50 p-2 text-sm text-red-700">{erro}</p>
        )}
        <label className="block text-sm font-medium">
          Nome
          <input
            className="mt-1 w-full rounded-lg border border-gray-300 p-2"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
          />
        </label>
        <label className="block text-sm font-medium">
          Descrição
          <input
            className="mt-1 w-full rounded-lg border border-gray-300 p-2"
            value={descr}
            onChange={(e) => setDescr(e.target.value)}
            required
          />
        </label>
        <div className="flex gap-3">
          <button
            disabled={loading}
            className="flex-1 rounded-lg bg-indigo-600 py-2 text-white disabled:opacity-50"
          >
            {loading ? "A guardar..." : "Guardar"}
          </button>
          <button
            type="button"
            onClick={() => navigate(location.state?.returnTo || -1)}
            className="flex-1 rounded-lg bg-gray-100 py-2"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
