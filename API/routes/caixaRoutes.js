import express from "express";
import { auth } from "../middlewares/auth.js";
import { authorizeModule } from "../middlewares/authorize.js";
import { verificarAssinatura } from "../middlewares/verificarAssinatura.js";
import { abrirCaixa, fecharCaixa, listarRelatoriosCaixa, obterCaixa, obterRelatorioFecho } from "../controllers/caixaController.js";

const router = express.Router();
router.use(auth, authorizeModule("estoque"), verificarAssinatura);
router.get("/", obterCaixa);
router.get("/relatorios", listarRelatoriosCaixa);
router.post("/abrir", abrirCaixa);
router.get("/:id/relatorio", obterRelatorioFecho);
router.post("/:id/fechar", fecharCaixa);

export default router;
