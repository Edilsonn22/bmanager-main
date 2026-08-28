import express from "express";
import { atualizarEstadoTicket, criarTicket, meusTickets, todosTickets } from "../controllers/suporteController.js";
import { auth } from "../middlewares/auth.js";
import { platformAdmin } from "../middlewares/platformAdmin.js";
const router = express.Router();
router.post("/tickets", auth, criarTicket); router.get("/tickets", auth, meusTickets); router.get("/admin/tickets", auth, platformAdmin, todosTickets); router.patch("/admin/tickets/:id/estado", auth, platformAdmin, atualizarEstadoTicket);
export default router;
