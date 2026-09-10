import pool from "../config/db.js";

export const listar = async (_req, res) => {
  try {
    const [planos] = await pool.query(
      `SELECT id, nome, descricao, preco AS valor, tipo, limite_usuarios, limite_produtos,
              CASE tipo WHEN 'mensal' THEN 1 WHEN 'anual' THEN 12 ELSE NULL END AS periodo_meses
       FROM planos WHERE ativo = 1 ORDER BY preco ASC`
    );
    return res.json({ sucesso: true, planos });
  } catch (error) {
    console.error("Erro ao listar planos:", error.message);
    return res.status(500).json({ sucesso: false, erro: "Não foi possível carregar os planos." });
  }
};

export const criar = async (req, res) => {
  try {
    const { nome, descricao, preco, tipo, limite_usuarios, limite_produtos } = req.body;
    if (!nome?.trim() || !["mensal", "anual", "vitalicio"].includes(tipo) || Number(preco) < 0) {
      return res.status(400).json({ sucesso: false, erro: "Dados do plano inválidos." });
    }
    const [resultado] = await pool.execute(
      "INSERT INTO planos (nome, descricao, preco, tipo, limite_usuarios, limite_produtos) VALUES (?, ?, ?, ?, ?, ?)",
      [nome.trim(), descricao?.trim() || null, Number(preco), tipo, Number(limite_usuarios) || 1, Number(limite_produtos) || 100]
    );
    return res.status(201).json({ sucesso: true, id: resultado.insertId });
  } catch (error) {
    console.error("Erro ao criar plano:", error.message);
    return res.status(500).json({ sucesso: false, erro: "Não foi possível criar o plano." });
  }
};

export const atualizar = async (req, res) => {
  try {
    const { nome, descricao, preco, tipo, limite_usuarios, limite_produtos, ativo } = req.body;
    if (!nome?.trim() || !["mensal", "anual", "vitalicio"].includes(tipo) || Number(preco) < 0) {
      return res.status(400).json({ sucesso: false, erro: "Dados do plano inválidos." });
    }
    const [resultado] = await pool.execute(
      `UPDATE planos SET nome = ?, descricao = ?, preco = ?, tipo = ?, limite_usuarios = ?, limite_produtos = ?, ativo = ? WHERE id = ?`,
      [nome.trim(), descricao?.trim() || null, Number(preco), tipo, Number(limite_usuarios) || 1, Number(limite_produtos) || 100, Boolean(ativo), req.params.id]
    );
    if (!resultado.affectedRows) return res.status(404).json({ sucesso: false, erro: "Plano não encontrado." });
    return res.json({ sucesso: true });
  } catch (error) {
    console.error("Erro ao atualizar plano:", error.message);
    return res.status(500).json({ sucesso: false, erro: "Não foi possível atualizar o plano." });
  }
};
