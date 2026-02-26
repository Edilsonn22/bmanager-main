import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Dashboard from "./components/dashboard";
import Productos from "./components/productos";
import Movimentos from "./components/movimentos";
import Fornecedor from "./components/fornecedor";
import Categoria from "./components/categoria";
import Relatorios from "./components/relatorios";
import AdicionarProduto from "./components/adicionarProduto";
import EditarProduto from "./components/editarProduto";
import AdicionarFornecedor from "./components/adicionarFornecedor";
import EditarFornecedor from "./components/editarFornecedor";
import Movimentar from "./components/movimentar"; 
import MovOpcoes from "./components/movOpcoes";
import RegistarEntrada from "./components/registarEntrada";
import RegistarSaida from "./components/registarSaida";
import AdicionarCategoria from "./components/adicionarCategoria";

function App() {
  return (
    <BrowserRouter>
      <div className="flex h-screen overflow-hidden">
        <Navbar />

        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/overview" element={<Dashboard />} />
          <Route path="/movimentar" element={<Movimentar />} />
          <Route path="/movOpcoes" element={<MovOpcoes />} />
          <Route path="/registarEntrada" element={<RegistarEntrada/>} />
          <Route path="/registarSaida" element={<RegistarSaida/>} />
          <Route path="/productos" element={<Productos />} />
          <Route path="/adicionarProduto" element={<AdicionarProduto />} />
          <Route path="/editarProduto/:id" element={<EditarProduto />} />
          <Route path="/movimentos" element={<Movimentos />} />
          <Route path="/fornecedor" element={<Fornecedor />} />
          <Route path="/adicionarFornecedor" element={<AdicionarFornecedor />} />
          <Route path="/editarFornecedor/:id" element={<EditarFornecedor />} />
          <Route path="/categoria" element={<Categoria />} />
          <Route path="/adicionarCategoria" element={<AdicionarCategoria />} />
          <Route path="/relatorios" element={<Relatorios />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
