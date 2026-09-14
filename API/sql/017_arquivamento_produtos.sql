-- Preserva o histórico comercial e retira produtos antigos da operação atual.
SET @sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Produto' AND COLUMN_NAME = 'arquivado_em') = 0, 'ALTER TABLE Produto ADD COLUMN arquivado_em DATETIME DEFAULT NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

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
