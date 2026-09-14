-- Preserva o histórico comercial e retira produtos antigos da operação atual.
ALTER TABLE Produto
  ADD COLUMN IF NOT EXISTS arquivado_em DATETIME DEFAULT NULL;

SET @idx_produto_empresa_arquivado_existe = (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'Produto'
    AND INDEX_NAME = 'idx_produto_empresa_arquivado'
);
SET @sql_idx_produto_empresa_arquivado = IF(
  @idx_produto_empresa_arquivado_existe = 0,
  'ALTER TABLE Produto ADD KEY idx_produto_empresa_arquivado (empresa_id, arquivado_em)',
  'SELECT 1'
);
PREPARE stmt_idx_produto_empresa_arquivado FROM @sql_idx_produto_empresa_arquivado;
EXECUTE stmt_idx_produto_empresa_arquivado;
DEALLOCATE PREPARE stmt_idx_produto_empresa_arquivado;
