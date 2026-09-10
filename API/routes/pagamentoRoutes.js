import express from "express";
import { configuracao, criar, obter } from "../controllers/pagamentoController.js";
import { auth } from "../middlewares/auth.js";

const router = express.Router();
router.get("/configuracao", auth, configuracao);
router.post("/", auth, criar);
router.get("/:id", auth, obter);
export default router;
