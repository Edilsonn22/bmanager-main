import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { API_URL } from "../api/authenticatedFetch";
import { FormularioFornecedor } from "./adicionarFornecedor";

const formInicial = { nome: "", email: "", contacto: "", endereco: "" };

export default function EditarFornecedor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(formInicial);
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    let ativo = true;
    const carregar = async () => {
      try {
        // A listagem é usada para manter compatibilidade com servidores que
        // ainda não carregaram a nova rota GET /fornecedores/:id.
        const response = await fetch(`${API_URL}/fornecedores`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.erro || "Não foi possível carregar o fornecedor.");

        const fornecedor = (data.fornecedores || []).find(
          (item) => String(item.id) === String(id),
        );
        if (!fornecedor) throw new Error("Fornecedor não encontrado.");

        if (ativo) setForm({
          nome: fornecedor.nome || "",
          email: fornecedor.email || "",
          contacto: fornecedor.contacto || "",
          endereco: fornecedor.endereco || "",
        });
      } catch (error) {
        if (ativo) setErro(error.message);
      } finally {
        if (ativo) setLoading(false);
      }
    };
    carregar();
    return () => { ativo = false; };
  }, [id]);

  const mudar = (campo) => (event) => {
    setForm((atual) => ({ ...atual, [campo]: event.target.value }));
  };

  const guardar = async (event) => {
    event.preventDefault();
    setErro("");
    if (!form.nome.trim()) return setErro("Informe o nome do fornecedor.");

    setSalvando(true);
    try {
      const response = await fetch(`${API_URL}/fornecedores/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.erro || "Não foi possível atualizar o fornecedor.");
      navigate("/fornecedor", { replace: true });
    } catch (error) {
      setErro(error.message);
    } finally {
      setSalvando(false);
    }
  };

  return <FormularioFornecedor
    titulo="Editar fornecedor"
    subtitulo="Atualize os dados do fornecedor."
    form={form}
    mudar={mudar}
    erro={erro}
    loading={loading}
    salvando={salvando}
    guardar={guardar}
    cancelar={() => navigate("/fornecedor")}
    textoBotao="Atualizar fornecedor"
  />;
}
