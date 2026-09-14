-- Alinha bases existentes com o esquema atual sem alterar a migração 011 já aplicada.
SET @fk_caixa_empresa_existe = (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'CaixaSessao'
    AND CONSTRAINT_NAME = 'fk_caixa_empresa'
    AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);
SET @sql_remover_fk_caixa = IF(
  @fk_caixa_empresa_existe > 0,
  'ALTER TABLE CaixaSessao DROP FOREIGN KEY fk_caixa_empresa',
  'SELECT 1'
);
PREPARE stmt_remover_fk_caixa FROM @sql_remover_fk_caixa;
EXECUTE stmt_remover_fk_caixa;
DEALLOCATE PREPARE stmt_remover_fk_caixa;

SET @fk_caixa_empresa_restrict_existe = (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'CaixaSessao'
    AND CONSTRAINT_NAME = 'fk_caixa_empresa_restrict'
    AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);
SET @sql_criar_fk_caixa = IF(
  @fk_caixa_empresa_restrict_existe = 0,
  'ALTER TABLE CaixaSessao ADD CONSTRAINT fk_caixa_empresa_restrict FOREIGN KEY (empresa_id) REFERENCES Empresa(id) ON DELETE RESTRICT ON UPDATE CASCADE',
  'SELECT 1'
);
PREPARE stmt_criar_fk_caixa FROM @sql_criar_fk_caixa;
EXECUTE stmt_criar_fk_caixa;
DEALLOCATE PREPARE stmt_criar_fk_caixa;
