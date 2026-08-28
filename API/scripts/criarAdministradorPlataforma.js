import bcrypt from "bcryptjs";
import pool from "../config/db.js";

const [nome, email, senha] = process.argv.slice(2);
if (!nome || !email || !senha || senha.length < 12) {
  console.error("Uso: node scripts/criarAdministradorPlataforma.js \"Nome\" email senha-com-12-caracteres");
  process.exitCode = 1;
} else {
  const senhaHash = await bcrypt.hash(senha, 12);
  await pool.execute(
    `INSERT INTO AdministradorPlataforma (nome, email, senha) VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE nome = VALUES(nome), senha = VALUES(senha)`,
    [nome.trim(), email.trim().toLowerCase(), senhaHash]
  );
  await pool.end();
  console.log("Administrador da plataforma criado.");
}
