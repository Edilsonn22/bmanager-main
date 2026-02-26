import express from "express";
import { listarFornecedores } from "../controllers/fornecedorController.js";

const router = express.Router();

router.get("/", listarFornecedores);

export default router;