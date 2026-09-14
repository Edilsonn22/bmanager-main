import pool from "../config/db.js";

export const resumoFinanceiro = async (req, res) => {
  try {
    const empresaId = req.user.empresa_id;

    const [produtos] = await pool.query(
      `
      SELECT
        p.id,
        p.nome,
        p.precoFornecedor,
        p.preco,
        p.quantidade,

        p.idCategoria,

        c.id AS categoriaId,
        c.nome AS categoriaNome

      FROM Produto p

      LEFT JOIN Categoria c
        ON c.id = p.idCategoria

      WHERE p.empresa_id = ? AND p.arquivado_em IS NULL

      ORDER BY p.nome ASC
      `,
      [empresaId]
    );

    const [movimentos] = await pool.query(
      `
      SELECT
        m.id,
        m.id_Produto AS produtoId,
        m.tipo,
        CASE WHEN m.origem = 'venda'
          THEN GREATEST(m.quantidade - COALESCE(vi.quantidade_devolvida, 0), 0)
          ELSE m.quantidade
        END AS quantidade,
        m.preco_unitario,
        m.custo_unitario,
        m.origem,
        m.venda_id,
        m.created_at,

        p.nome AS nomeProduto,

        p.idCategoria,

        c.id AS categoriaId,
        c.nome AS categoriaNome

      FROM Movimentos m

      INNER JOIN Produto p
        ON p.id = m.id_Produto

      LEFT JOIN Venda v
        ON v.id = m.venda_id

      LEFT JOIN VendaItem vi
        ON vi.venda_id = m.venda_id AND vi.produto_id = m.id_Produto

      LEFT JOIN Categoria c
        ON c.id = p.idCategoria

      WHERE m.empresa_id = ?
      AND (m.origem IS NULL OR (m.origem = 'venda' AND v.estado <> 'cancelada'))

      ORDER BY m.created_at DESC
      `,
      [empresaId]
    );

    return res.json({
      sucesso: true,
      produtos,
      movimentos,
    });
  } catch (error) {
    console.error("Erro ao gerar resumo financeiro:", error);

    return res.status(500).json({
      sucesso: false,
      erro: "Não foi possível carregar os dados financeiros.",
    });
  }
};
