import express from "express";
import { auth } from "../middlewares/auth.js";
import { authorizeModule } from "../middlewares/authorize.js";
import { verificarAssinatura } from "../middlewares/verificarAssinatura.js";
import { atualizarCliente, criarCliente, listarClientes } from "../controllers/clienteController.js";
const router=express.Router();
router.use(auth, authorizeModule("estoque"), verificarAssinatura);
router.get("/", listarClientes); router.post("/", criarCliente); router.put("/:id", atualizarCliente);
export default router;
