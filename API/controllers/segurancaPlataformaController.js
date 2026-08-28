import pool from "../config/db.js";

export const alternarBloqueioComRevogacao = async (req, res) => {
  try {
    const [resultado] = await pool.execute(
      "UPDATE Empresa SET bloqueada = NOT bloqueada, session_version = session_version + 1 WHERE id = ?",
      [req.params.id],
    );
    if (!resultado.affectedRows) {
      return res.status(404).json({ sucesso: false, erro: "Empresa não encontrada." });
    }
    return res.json({ sucesso: true });
  } catch (error) {
    return res.status(500).json({ sucesso: false, erro: "Não foi possível alterar o bloqueio da empresa." });
  }
};
