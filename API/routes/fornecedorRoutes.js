import express from "express";
import { atualizarFornecedor, criarFornecedor, deletarFornecedor, listarFornecedores, obterFornecedor } from "../controllers/fornecedorController.js";
import { auth } from "../middlewares/auth.js";
import { authorize, authorizeModule } from "../middlewares/authorize.js";
import { verificarAssinatura } from "../middlewares/verificarAssinatura.js";

const router = express.Router();
router.use(auth, authorizeModule("estoque"), verificarAssinatura);
router.get("/", listarFornecedores);
router.get("/:id", obterFornecedor);
router.post("/", authorize("admin", "gestor"), criarFornecedor);
router.put("/:id", authorize("admin", "gestor"), atualizarFornecedor);
router.delete("/:id", authorize("admin"), deletarFornecedor);
export default router;
