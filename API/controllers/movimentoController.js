import pool from "../config/db.js";
import { criarNotificacao } from "../services/notificacaoService.js";
import { auditar } from "../services/auditoriaService.js";


// =====================================================
// POST - Criar movimento
// =====================================================

export const createMovimento = async (req, res) => {
  const connection = await pool.getConnection();

  try {

    const {
      id_Produto,
      tipo,
      quantidade
    } = req.body;


    // =================================================
    // VALIDAÇÃO
    // =================================================

    if (
      !id_Produto ||
      !tipo ||
      quantidade === undefined ||
      quantidade === null
    ) {
      return res.status(400).json({
        sucesso: false,
        erro: "Todos os campos são obrigatórios."
      });
    }


    if (!["entrada", "saida"].includes(tipo)) {
      return res.status(400).json({
        sucesso: false,
        erro: "Tipo inválido."
      });
    }


    const qtd = Number(quantidade);


    if (!Number.isInteger(qtd) || qtd <= 0) {
      return res.status(400).json({
        sucesso: false,
        erro: "A quantidade deve ser um número inteiro maior que zero."
      });
    }


    // =================================================
    // EMPRESA DO USUÁRIO AUTENTICADO
    // =================================================

    const empresa_id = req.user.empresa_id;


    if (!empresa_id) {
      return res.status(403).json({
        sucesso: false,
        erro: "Usuário não possui empresa associada."
      });
    }


    // =================================================
    // INICIAR TRANSAÇÃO
    // =================================================

    await connection.beginTransaction();


    // =================================================
    // BUSCAR PRODUTO DA EMPRESA
    // =================================================

    const [produtos] = await connection.query(
      `
      SELECT
        id,
        nome,
        quantidade,
        estoque_minimo
      FROM Produto
      WHERE id = ?
      AND empresa_id = ?
      FOR UPDATE
      `,
      [
        id_Produto,
        empresa_id
      ]
    );


    if (produtos.length === 0) {

      await connection.rollback();

      return res.status(404).json({
        sucesso: false,
        erro: "Produto não encontrado."
      });

    }


    const produto = produtos[0];


    // =================================================
    // VERIFICAR ESTOQUE PARA SAÍDA
    // =================================================

    if (
      tipo === "saida" &&
      qtd > Number(produto.quantidade)
    ) {

      await connection.rollback();

      return res.status(400).json({
        sucesso: false,
        erro: "Estoque insuficiente.",
        estoqueAtual: produto.quantidade
      });

    }


    // =================================================
    // CALCULAR NOVA QUANTIDADE
    // =================================================

    const novaQuantidade =
      tipo === "entrada"
        ? Number(produto.quantidade) + qtd
        : Number(produto.quantidade) - qtd;


    // =================================================
    // ATUALIZAR ESTOQUE
    // =================================================

    await connection.execute(
      `
      UPDATE Produto
      SET quantidade = ?
      WHERE id = ?
      AND empresa_id = ?
      `,
      [
        novaQuantidade,
        id_Produto,
        empresa_id
      ]
    );


    // =================================================
    // REGISTRAR MOVIMENTO
    // =================================================

    const [result] = await connection.execute(
      `
      INSERT INTO Movimentos (
        id_Produto,
        empresa_id,
        tipo,
        quantidade
      )
      VALUES (?, ?, ?, ?)
      `,
      [
        id_Produto,
        empresa_id,
        tipo,
        qtd
      ]
    );


    // =================================================
    // CONFIRMAR TRANSAÇÃO
    // =================================================

    await connection.commit();
    await auditar({ empresaId: empresa_id, usuarioId: req.user.id, acao: "criar", entidade: "movimento", entidadeId: result.insertId, detalhes: { produto: produto.id, tipo, quantidade: qtd } });
    if (novaQuantidade === 0 || novaQuantidade <= Number(produto.estoque_minimo)) {
      criarNotificacao({ empresaId: empresa_id, tipo: novaQuantidade === 0 ? "estoque_esgotado" : "estoque_baixo", titulo: novaQuantidade === 0 ? "Produto esgotado" : "Estoque baixo", mensagem: `${produto.nome}: restam ${novaQuantidade} unidades.` }).catch((error) => console.error("Erro no alerta de estoque:", error.message));
    }


    // =================================================
    // RESPOSTA
    // =================================================

    return res.status(201).json({

      sucesso: true,

      mensagem:
        tipo === "entrada"
          ? "Entrada registrada com sucesso."
          : "Saída registrada com sucesso.",

      id: result.insertId,

      produto: {
        id: produto.id,
        nome: produto.nome
      },

      movimento: {
        tipo,
        quantidade: qtd
      },

      estoqueAtual:
        novaQuantidade

    });


  } catch (error) {

    await connection.rollback();

    console.error(
      "Erro ao criar movimento:",
      error
    );

    return res.status(500).json({
      sucesso: false,
      erro: "Erro interno ao registrar movimento."
    });

  } finally {

    connection.release();

  }
};



// =====================================================
// GET - Listar todos os movimentos
// =====================================================

export const getAllMovimentos = async (req, res) => {

  try {

    const empresa_id =
      req.user.empresa_id;


    if (!empresa_id) {

      return res.status(403).json({
        sucesso: false,
        erro: "Usuário não possui empresa associada."
      });

    }


    const sql = `
      SELECT
        m.id,
        m.id_Produto AS produtoId,
        m.tipo,
        m.quantidade,
        m.created_at,

        p.nome AS nomeProduto,
        p.preco

      FROM Movimentos m

      INNER JOIN Produto p
        ON p.id = m.id_Produto

      WHERE p.empresa_id = ?

      ORDER BY m.created_at DESC
    `;


    const [movimentos] =
      await pool.query(
        sql,
        [empresa_id]
      );


    return res.status(200).json({

      sucesso: true,

      movimentos

    });


  } catch (error) {

    console.error(
      "Erro ao buscar movimentos:",
      error
    );

    return res.status(500).json({

      sucesso: false,

      erro:
        "Erro interno ao buscar movimentos."

    });

  }

};
