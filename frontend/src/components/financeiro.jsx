import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

import { DollarSign, TrendingUp, Wallet } from "lucide-react";

function Financeiro() {
  const [movimentos, setMovimentos] = useState([]);

  const [receitaTotal, setReceitaTotal] = useState(0);
  const [custoProdutos, setCustoProdutos] = useState(0);
  const [lucroBruto, setLucroBruto] = useState(0);
  const [lucroLiquido, setLucroLiquido] = useState(0);

  useEffect(() => {
    carregarFinanceiro();
  }, []);

  const carregarFinanceiro = async () => {
    try {
      const resposta = await fetch("http://localhost:3000/api/movimentos");

      const data = await resposta.json();

      if (data.sucesso) {
        setMovimentos(data.movimentos);

        // Apenas vendas
        const vendas = data.movimentos.filter((item) => item.tipo === "saida");

        // Receita total
        const receita = vendas.reduce((total, item) => {
          return total + Number(item.quantidade) * Number(item.preco);
        }, 0);

        // Custo dos produtos vendidos
        const custo = vendas.reduce((total, item) => {
          return total + Number(item.quantidade) * Number(item.precoFornecedor);
        }, 0);

        const lucro = receita - custo;

        setReceitaTotal(receita);

        setCustoProdutos(custo);

        setLucroBruto(lucro);

        setLucroLiquido(lucro);
      }
    } catch (error) {
      console.log("Erro ao carregar financeiro:", error);
    }
  };

  const cards = [
    {
      nome: "Receita de Vendas",
      valor: receitaTotal,
      icon: TrendingUp,
      cor: "text-green-500",
      fundo: "bg-green-50",
    },

    {
      nome: "Custo dos Produtos Vendidos",
      valor: custoProdutos,
      icon: DollarSign,
      cor: "text-orange-500",
      fundo: "bg-orange-50",
    },

    {
      nome: "Lucro Bruto",
      valor: lucroBruto,
      icon: DollarSign,
      cor: "text-green-500",
      fundo: "bg-green-50",
    },

    {
      nome: "Lucro Líquido",
      valor: lucroLiquido,
      icon: Wallet,
      cor: "text-blue-500",
      fundo: "bg-blue-50",
    },
  ];

  return (
    <div className="flex-1 h-screen overflow-auto p-7 py-6 bg-gray-50">
      {/* Header */}

      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold">Gestão Financeira</h2>

          <p className="text-gray-700 text-xl">
            Gerencie as finanças do seu negócio!
          </p>
        </div>

        <Link to="/movimentar">
          <button
            className="
bg-black
text-white
px-4
py-2
rounded-lg
"
          >
            + Movimentar
          </button>
        </Link>
      </div>

      {/* Cards */}

      <div
        className="
grid
grid-cols-1
md:grid-cols-2
lg:grid-cols-4
gap-7
mb-10
"
      >
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.nome}
              className="
bg-white
p-5
rounded-md
shadow-sm
flex
flex-col
items-center
"
            >
              <div
                className={`
w-12
h-12
${card.fundo}
rounded-lg
flex
items-center
justify-center
`}
              >
                <Icon className={`w-6 h-6 ${card.cor}`} />
              </div>

              <p className="text-gray-600 mt-3 text-center">{card.nome}</p>

              <p className="font-bold text-lg">
                {card.valor.toLocaleString()} MZN
              </p>
            </div>
          );
        })}
      </div>

      {/* Demonstracao */}

      <div
        className="
bg-white
rounded-md
p-5
mb-7
"
      >
        <h3
          className="
font-semibold
text-xl
mb-5
"
        >
          Demonstração de Resultado
        </h3>

        <div
          className="
bg-green-100
rounded-xl
p-4
mb-5
"
        >
          <h2>Receitas de Vendas</h2>

          <p className="font-bold">{receitaTotal.toLocaleString()} MZN</p>
        </div>

        <div
          className="
bg-orange-100
rounded-xl
p-4
mb-5
"
        >
          <h2>Custo dos Produtos Vendidos</h2>

          <p className="font-bold">{custoProdutos.toLocaleString()} MZN</p>
        </div>

        <div
          className="
bg-green-100
rounded-xl
p-4
mb-5
"
        >
          <h2>Lucro Bruto</h2>

          <p className="font-bold">{lucroBruto.toLocaleString()} MZN</p>
        </div>

        <div
          className="
bg-blue-100
rounded-xl
p-4
"
        >
          <h2>Lucro Líquido</h2>

          <p className="font-bold">{lucroLiquido.toLocaleString()} MZN</p>
        </div>
      </div>

      {/* Tabela */}

      <div
        className="
bg-white
rounded-md
p-5
"
      >
        <h2
          className="
font-semibold
text-xl
mb-5
"
        >
          Transações
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="p-3">Data</th>

                <th>Tipo</th>

                <th>Produto</th>

                <th>Quantidade</th>

                <th>Valor</th>
              </tr>
            </thead>

            <tbody>
              {movimentos.map((mov) => (
                <tr key={mov.id} className="border-b">
                  <td className="p-3">
                    {new Date(mov.created_at).toLocaleDateString()}
                  </td>

                  <td>{mov.tipo}</td>

                  <td>{mov.nomeProduto}</td>

                  <td>{mov.quantidade}</td>

                  <td>
                    {mov.tipo === "saida"
                      ? (mov.quantidade * mov.preco).toLocaleString()
                      : (mov.quantidade * mov.precoFornecedor).toLocaleString()}
                    MZN
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Financeiro;
