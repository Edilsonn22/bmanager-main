import express from "express";
import cors from "cors";
import produtoRoutes from "./routes/produtoRoutes.js";
import categoriaRoutes from "./routes/categoriaRoutes.js";
import fornecedorRoutes from "./routes/fornecedorRoutes.js";


const app = express();
app.use(cors())
app.use(express.json());

app.use("/api/produtos", produtoRoutes);
app.use("/api/categorias", categoriaRoutes);
app.use("/api/fornecedores", fornecedorRoutes);

app.listen(3000, () => {
  console.log("Servidor rodando na porta 3000");
});


