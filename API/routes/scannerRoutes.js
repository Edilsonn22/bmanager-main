import express from "express";
import { auth } from "../middlewares/auth.js";
import { criarSessao, fecharSessao, listarCodigos, receberCodigo } from "../controllers/scannerController.js";

const router = express.Router();
router.post("/ligacao/:token/codigos", receberCodigo);
router.post("/sessoes", auth, criarSessao);
router.get("/sessoes/:id/codigos", auth, listarCodigos);
router.delete("/sessoes/:id", auth, fecharSessao);
export default router;
