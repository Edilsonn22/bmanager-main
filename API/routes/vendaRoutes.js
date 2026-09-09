import express from "express";
import { auth } from "../middlewares/auth.js";
import { authorize, authorizeModule } from "../middlewares/authorize.js";
import { verificarAssinatura } from "../middlewares/verificarAssinatura.js";
import { cancelarVenda, criarVenda, devolverItem, listarVendas, obterVenda } from "../controllers/vendaController.js";

const router = express.Router();
router.use(auth, authorizeModule("estoque"), verificarAssinatura);
router.get("/", listarVendas);
router.get("/:id", obterVenda);
router.post("/", criarVenda);
router.post("/:id/cancelar", authorize("admin", "gestor"), cancelarVenda);
router.post("/:id/itens/:itemId/devolver", authorize("admin", "gestor"), devolverItem);
export default router;
