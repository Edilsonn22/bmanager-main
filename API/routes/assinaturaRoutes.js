import express from "express";
import { agendarDowngrade, cancelarMinhaAssinatura, minhaAssinatura, reativarMinhaAssinatura } from "../controllers/assinaturaController.js";
import { auth } from "../middlewares/auth.js";

const router = express.Router();
router.get("/minha", auth, minhaAssinatura);
router.post("/cancelar", auth, cancelarMinhaAssinatura);
router.post("/reativar", auth, reativarMinhaAssinatura);
router.post("/downgrade", auth, agendarDowngrade);
export default router;
