-- Preserva o histórico comercial e retira produtos antigos da operação atual.
ALTER TABLE Produto
  ADD COLUMN IF NOT EXISTS arquivado_em DATETIME DEFAULT NULL,
  ADD KEY idx_produto_empresa_arquivado (empresa_id, arquivado_em);
