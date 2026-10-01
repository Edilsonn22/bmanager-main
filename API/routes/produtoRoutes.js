import express from "express";

import {
  createProduto,
  getAllProdutos,
  getProdutoById,
  updateProduto,
  deleteProduto,
  restoreProduto,
  getImagemProduto,
  updateImagemProduto,
  deleteImagemProduto
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

router.get("/:id/imagem", getImagemProduto);
router.put(
  "/:id/imagem",
  authorize("admin", "gestor"),
  express.raw({ type: ["image/jpeg", "image/png", "image/webp"], limit: "1mb" }),
  updateImagemProduto,
);
router.delete("/:id/imagem", authorize("admin", "gestor"), deleteImagemProduto);


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
