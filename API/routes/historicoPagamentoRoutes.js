import express from "express";
import { listarHistorico, obterFatura } from "../controllers/historicoPagamentoController.js";
import { auth } from "../middlewares/auth.js";

const router = express.Router();
router.get("/", auth, listarHistorico);
router.get("/:id/fatura", auth, obterFatura);
export default router;
