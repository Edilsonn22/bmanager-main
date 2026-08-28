import "dotenv/config";
import pool from "../config/db.js";

try {
  await pool.execute(`
    ALTER TABLE tickets_suporte
    MODIFY COLUMN estado ENUM('aberto','em_andamento','resolvido','fechado')
    NOT NULL DEFAULT 'aberto'
  `);
  console.log("Migração dos estados de suporte aplicada com sucesso.");
} finally {
  await pool.end();
}
