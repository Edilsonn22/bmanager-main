import express from "express";
import { listarCategorias, deletarCategoria } from "../controllers/categoriaController.js";

const router = express.Router();

router.get("/", listarCategorias);
router.delete("/:id", deletarCategoria);

export default router;