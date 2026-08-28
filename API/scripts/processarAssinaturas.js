import dotenv from "dotenv";
import { processarRotinaAssinaturas } from "../services/rotinaAssinaturasService.js";
import pool from "../config/db.js";

dotenv.config();

try {
  const resumo = await processarRotinaAssinaturas();
  console.info("Rotina de assinaturas concluída:", resumo);
} catch (error) {
  console.error("Falha na rotina de assinaturas:", error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
