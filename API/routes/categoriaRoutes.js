import express from "express";
import { atualizarCategoria, criarCategoria, deletarCategoria, listarCategorias, obterCategoria } from "../controllers/categoriaController.js";
import { auth } from "../middlewares/auth.js";
import { authorize, authorizeModule } from "../middlewares/authorize.js";
import { verificarAssinatura } from "../middlewares/verificarAssinatura.js";

const router = express.Router();
router.use(auth, authorizeModule("estoque"), verificarAssinatura);
router.get("/", listarCategorias);
router.get("/:id", obterCategoria);
router.post("/", authorize("admin", "gestor"), criarCategoria);
router.put("/:id", authorize("admin", "gestor"), atualizarCategoria);
router.delete("/:id", authorize("admin"), deletarCategoria);
export default router;
