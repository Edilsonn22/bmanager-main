import express from "express";
import { createMovimento, getAllMovimentos } from "../controllers/movimentoController.js";

const router = express.Router();

router.post("/", createMovimento);
router.get("/", getAllMovimentos);

export default router;