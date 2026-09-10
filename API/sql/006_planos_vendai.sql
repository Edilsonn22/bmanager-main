-- Atualiza o catálogo comercial sem alterar assinaturas históricas.
START TRANSACTION;

UPDATE planos
SET descricao = 'Experimente os recursos do Business durante 14 dias.',
    preco = 0, tipo = 'mensal', limite_usuarios = 5,
    limite_produtos = 1000000, ativo = TRUE
WHERE nome = 'Teste gratuito';

INSERT INTO planos (nome, descricao, preco, tipo, limite_usuarios, limite_produtos, ativo)
VALUES
  ('Starter', 'Para pequenos negócios que precisam de organização e controlo.', 500, 'mensal', 1, 1000000, TRUE),
  ('Business', 'Para empresas em crescimento que trabalham em equipa.', 1000, 'mensal', 5, 1000000, TRUE),
  ('Enterprise', 'Para empresas que precisam de maior capacidade e acompanhamento personalizado.', 3500, 'mensal', 15, 1000000, TRUE)
ON DUPLICATE KEY UPDATE
  descricao = VALUES(descricao), preco = VALUES(preco), tipo = VALUES(tipo),
  limite_usuarios = VALUES(limite_usuarios), limite_produtos = VALUES(limite_produtos), ativo = TRUE;

-- Os planos antigos deixam de ser comercializados, mas continuam disponíveis
-- para empresas que já tenham uma assinatura associada.
UPDATE planos SET ativo = FALSE WHERE nome IN ('Basico mensal', 'Basico anual', 'Básico mensal', 'Básico anual');

COMMIT;
