-- Preserva os preços praticados no momento de cada movimento.
ALTER TABLE Movimentos
  ADD COLUMN IF NOT EXISTS preco_unitario DECIMAL(10,2) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS custo_unitario DECIMAL(10,2) DEFAULT NULL;

-- Para registros antigos, o preço original não existe mais. Congelamos o
-- preço atual para impedir novas alterações retroativas nos relatórios.
UPDATE Movimentos m
INNER JOIN Produto p ON p.id = m.id_Produto
SET
  m.preco_unitario = COALESCE(m.preco_unitario, p.preco),
  m.custo_unitario = COALESCE(m.custo_unitario, p.precoFornecedor);

ALTER TABLE Movimentos
  MODIFY COLUMN preco_unitario DECIMAL(10,2) NOT NULL,
  MODIFY COLUMN custo_unitario DECIMAL(10,2) NOT NULL;
