import express from "express";
import { criar, obter } from "../controllers/pagamentoController.js";
import { auth } from "../middlewares/auth.js";

const router = express.Router();
router.post("/", auth, criar);
router.get("/:id", auth, obter);
export default router;
