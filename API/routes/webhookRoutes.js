import express from "express";
import { receberDebito } from "../controllers/webhookController.js";
import { limiteWebhook } from "../middlewares/rateLimit.js";

const router = express.Router();
router.post("/debito", limiteWebhook, express.raw({ type: "application/json" }), receberDebito);
export default router;
