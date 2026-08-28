import express from "express";
import { resumoFinanceiro } from "../controllers/financeiroController.js";
import { auth } from "../middlewares/auth.js";
import { authorizeModule } from "../middlewares/authorize.js";
import { verificarAssinatura } from "../middlewares/verificarAssinatura.js";

const router = express.Router();
router.get("/resumo", auth, authorizeModule("financeiro"), verificarAssinatura, resumoFinanceiro);
export default router;
