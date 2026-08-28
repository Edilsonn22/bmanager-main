import express from "express";
import { listar, criar, atualizar } from "../controllers/planoController.js";
import { auth } from "../middlewares/auth.js";
import { platformAdmin } from "../middlewares/platformAdmin.js";

const router = express.Router();
router.get("/", listar);
router.post("/", auth, platformAdmin, criar);
router.put("/:id", auth, platformAdmin, atualizar);
export default router;
