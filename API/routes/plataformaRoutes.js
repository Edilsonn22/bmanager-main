import express from "express";
import { resumoPlataforma, meuAcessoPlataforma, listarEmpresas, listarUtilizadores } from "../controllers/plataformaController.js";
import { alternarBloqueioComRevogacao } from "../controllers/segurancaPlataformaController.js";
import { auth } from "../middlewares/auth.js";
import { platformAdmin } from "../middlewares/platformAdmin.js";

const router = express.Router();
router.get("/acesso", auth, meuAcessoPlataforma);
router.get("/resumo", auth, platformAdmin, resumoPlataforma);
router.get("/empresas", auth, platformAdmin, listarEmpresas);
router.get("/utilizadores", auth, platformAdmin, listarUtilizadores);
router.post("/empresas/:id/bloqueio", auth, platformAdmin, alternarBloqueioComRevogacao);
export default router;
