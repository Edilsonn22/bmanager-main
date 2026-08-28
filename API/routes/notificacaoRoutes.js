import express from "express";
import { listar, marcarComoLida, processarAvisos } from "../controllers/notificacaoController.js";
import { auth } from "../middlewares/auth.js";
import { platformAdmin } from "../middlewares/platformAdmin.js";

const router = express.Router();
router.get("/", auth, listar);
router.post("/:id/lida", auth, marcarComoLida);
router.post("/admin/processar-avisos", auth, platformAdmin, processarAvisos);
export default router;
