import express from "express";

import {
  createMovimento,
  getAllMovimentos
} from "../controllers/movimentoController.js";

import { auth } from "../middlewares/auth.js";
import { authorizeModule } from "../middlewares/authorize.js";
import { verificarAssinatura } from "../middlewares/verificarAssinatura.js";

const router = express.Router();
router.use(auth, authorizeModule("estoque"), verificarAssinatura);


// =====================================================
// Criar movimento
// =====================================================

router.post(
  "/",
  createMovimento
);


// =====================================================
// Listar movimentos
// =====================================================

router.get(
  "/",
  getAllMovimentos
);


export default router;
