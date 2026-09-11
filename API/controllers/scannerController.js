import { createHash, randomBytes } from "node:crypto";
import pool from "../config/db.js";

const hash = (token) => createHash("sha256").update(token).digest("hex");

export async function criarSessao(req, res) {
  const token = randomBytes(32).toString("hex");
  await pool.execute("UPDATE ScannerSessao SET ativa=FALSE WHERE empresa_id=? AND usuario_id=? AND ativa=TRUE", [req.user.empresa_id, req.user.id]);
  const [result] = await pool.execute("INSERT INTO ScannerSessao (empresa_id,usuario_id,token_hash,expira_em) VALUES (?,?,?,DATE_ADD(NOW(), INTERVAL 10 MINUTE))", [req.user.empresa_id, req.user.id, hash(token)]);
  const origemRecebida = String(req.body?.origem || "").replace(/\/$/, "");
  const origem = /^https?:\/\/[^\s]+$/i.test(origemRecebida)
    ? origemRecebida
    : String(process.env.CLIENT_URL || "http://localhost:5173").replace(/\/$/, "");
  return res.status(201).json({ sucesso: true, sessao: { id: result.insertId, url: `${origem}/scanner/${token}`, expira_em_minutos: 10 } });
}

export async function receberCodigo(req, res) {
  const codigo = typeof req.body?.codigo === "string" ? req.body.codigo.trim().slice(0, 100) : "";
  if (!codigo) return res.status(400).json({ sucesso: false, erro: "Código inválido." });
  const [[sessao]] = await pool.query("SELECT id FROM ScannerSessao WHERE token_hash=? AND ativa=TRUE AND expira_em>NOW()", [hash(req.params.token)]);
  if (!sessao) return res.status(410).json({ sucesso: false, erro: "Ligação expirada. Gere um novo QR Code no computador." });
  await pool.execute("INSERT INTO ScannerCodigo (sessao_id,codigo) VALUES (?,?)", [sessao.id, codigo]);
  return res.status(201).json({ sucesso: true });
}

export async function listarCodigos(req, res) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [[sessao]] = await connection.query("SELECT id,expira_em FROM ScannerSessao WHERE id=? AND empresa_id=? AND usuario_id=? AND ativa=TRUE FOR UPDATE", [req.params.id, req.user.empresa_id, req.user.id]);
    if (!sessao) {
      await connection.rollback();
      return res.status(404).json({ sucesso: false, erro: "Sessão não encontrada." });
    }
    const [codigos] = await connection.query("SELECT id,codigo FROM ScannerCodigo WHERE sessao_id=? AND consumido=FALSE ORDER BY id LIMIT 20 FOR UPDATE", [sessao.id]);
    if (codigos.length) await connection.query(`UPDATE ScannerCodigo SET consumido=TRUE WHERE id IN (${codigos.map(() => "?").join(",")})`, codigos.map((item) => item.id));
    await connection.commit();
    return res.json({ sucesso: true, codigos, expirada: new Date(sessao.expira_em) <= new Date() });
  } catch (error) { await connection.rollback(); return res.status(500).json({ sucesso: false, erro: "Não foi possível consultar o scanner." }); }
  finally { connection.release(); }
}

export async function fecharSessao(req, res) {
  await pool.execute("UPDATE ScannerSessao SET ativa=FALSE WHERE id=? AND empresa_id=? AND usuario_id=?", [req.params.id, req.user.empresa_id, req.user.id]);
  return res.json({ sucesso: true });
}
