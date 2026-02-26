import express from "express";
import {
  createProduto,
  getAllProdutos,
  getProdutoById,
  updateProduto,
  deleteProduto
} from "../controllers/produtoController.js";

const router = express.Router();

// Rotas
router.post("/", createProduto);
router.get("/", getAllProdutos);
router.get("/:id", getProdutoById);
router.put("/:id", updateProduto);
router.delete("/:id", deleteProduto);

export default router;