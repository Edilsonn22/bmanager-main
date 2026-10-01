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
        ON c.id = p.idCategoria AND c.empresa_id = p.empresa_id

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
        m.quantidade,
        CASE WHEN m.origem IN ('venda', 'devolucao') AND v.subtotal > 0
          THEN m.preco_unitario * v.total / v.subtotal
          ELSE m.preco_unitario
        END AS preco_unitario,
        CASE
          WHEN m.origem = 'venda' AND v.id IS NOT NULL THEN
            CASE WHEN v.subtotal > 0
              THEN COALESCE(linhas.valor_vendido * v.total / v.subtotal * m.quantidade / NULLIF(quantidades.quantidade_total, 0), m.preco_unitario * m.quantidade)
              ELSE 0
            END
          WHEN m.origem = 'devolucao' AND v.id IS NOT NULL THEN
            CASE WHEN v.subtotal > 0
              THEN COALESCE(linhas.valor_devolvido * v.total / v.subtotal * m.quantidade / NULLIF(quantidades.quantidade_total, 0), m.preco_unitario * m.quantidade)
              ELSE 0
            END
          ELSE m.custo_unitario * m.quantidade
        END AS valor_total,
        CASE
          WHEN m.origem = 'venda' AND v.id IS NOT NULL
            THEN COALESCE(linhas.custo_vendido * m.quantidade / NULLIF(quantidades.quantidade_total, 0), m.custo_unitario * m.quantidade)
          WHEN m.origem = 'devolucao' AND v.id IS NOT NULL
            THEN COALESCE(linhas.custo_devolvido * m.quantidade / NULLIF(quantidades.quantidade_total, 0), m.custo_unitario * m.quantidade)
          ELSE m.custo_unitario * m.quantidade
        END AS custo_total,
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
        ON p.id = m.id_Produto AND p.empresa_id = m.empresa_id

      LEFT JOIN Venda v
        ON v.id = m.venda_id AND v.empresa_id = m.empresa_id

      LEFT JOIN (
        SELECT venda_id,produto_id,
          SUM(total) AS valor_vendido,
          SUM(custo_unitario * quantidade) AS custo_vendido,
          SUM(total * quantidade_devolvida / NULLIF(quantidade,0)) AS valor_devolvido,
          SUM(custo_unitario * quantidade_devolvida) AS custo_devolvido
        FROM VendaItem
        GROUP BY venda_id,produto_id
      ) linhas ON linhas.venda_id = m.venda_id AND linhas.produto_id = m.id_Produto

      LEFT JOIN (
        SELECT empresa_id,venda_id,id_Produto,origem,SUM(quantidade) AS quantidade_total
        FROM Movimentos
        WHERE venda_id IS NOT NULL AND origem IN ('venda','devolucao')
        GROUP BY empresa_id,venda_id,id_Produto,origem
      ) quantidades ON quantidades.empresa_id = m.empresa_id
        AND quantidades.venda_id = m.venda_id
        AND quantidades.id_Produto = m.id_Produto
        AND quantidades.origem = m.origem

      LEFT JOIN Categoria c
        ON c.id = p.idCategoria AND c.empresa_id = p.empresa_id

      WHERE m.empresa_id = ?
      AND (m.origem IS NULL OR m.origem = 'manual' OR (m.origem IN ('venda', 'devolucao') AND v.estado <> 'cancelada'))

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
