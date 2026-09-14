import express from "express";

import {
  createProduto,
  getAllProdutos,
  getProdutoById,
  updateProduto,
  deleteProduto,
  restoreProduto
} from "../controllers/produtoController.js";

import { auth } from "../middlewares/auth.js";
import { authorize, authorizeModule } from "../middlewares/authorize.js";
import { verificarAssinatura } from "../middlewares/verificarAssinatura.js";

const router = express.Router();
router.use(auth, authorizeModule("estoque"), verificarAssinatura);


// ========================================
// ROTAS DE PRODUTOS
// ========================================

// Criar produto
router.post(
  "/",
  authorize("admin", "gestor"),
  createProduto
);


// Listar produtos
router.get(
  "/",
  getAllProdutos
);


// Buscar produto por ID
router.get(
  "/:id",
  getProdutoById
);


// Atualizar produto
router.put(
  "/:id",
  authorize("admin", "gestor"),
  updateProduto
);

router.patch(
  "/:id/restaurar",
  authorize("admin"),
  restoreProduto
);


// Excluir produto
router.delete(
  "/:id",
  authorize("admin"),
  deleteProduto
);


export default router;
