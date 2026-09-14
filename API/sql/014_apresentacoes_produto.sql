-- Unidades de venda opcionais. O stock continua armazenado na unidade base.
SET @sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Produto' AND COLUMN_NAME = 'tipo_produto') = 0, "ALTER TABLE Produto ADD COLUMN tipo_produto ENUM('simples','multiplas') NOT NULL DEFAULT 'simples'", 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Produto' AND COLUMN_NAME = 'unidade_base') = 0, "ALTER TABLE Produto ADD COLUMN unidade_base VARCHAR(50) NOT NULL DEFAULT 'Unidade'", 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

CREATE TABLE IF NOT EXISTS ProdutoApresentacao (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  produto_id INT UNSIGNED NOT NULL,
  nome VARCHAR(50) NOT NULL,
  fator_conversao INT UNSIGNED NOT NULL,
  preco DECIMAL(12,2) NOT NULL,
  custo DECIMAL(12,2) NOT NULL,
  codigo_barras VARCHAR(100) DEFAULT NULL,
  ativa BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_produto_apresentacao_nome (produto_id, nome),
  UNIQUE KEY uq_apresentacao_codigo (codigo_barras),
  CONSTRAINT fk_apresentacao_produto FOREIGN KEY (produto_id) REFERENCES Produto(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT chk_apresentacao_fator CHECK (fator_conversao > 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET @sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'VendaItem' AND COLUMN_NAME = 'apresentacao_id') = 0, 'ALTER TABLE VendaItem ADD COLUMN apresentacao_id INT UNSIGNED DEFAULT NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'VendaItem' AND COLUMN_NAME = 'apresentacao_nome') = 0, "ALTER TABLE VendaItem ADD COLUMN apresentacao_nome VARCHAR(50) NOT NULL DEFAULT 'Unidade'", 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'VendaItem' AND COLUMN_NAME = 'fator_conversao') = 0, 'ALTER TABLE VendaItem ADD COLUMN fator_conversao INT UNSIGNED NOT NULL DEFAULT 1', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'VendaItem' AND COLUMN_NAME = 'quantidade_base') = 0, 'ALTER TABLE VendaItem ADD COLUMN quantidade_base INT UNSIGNED DEFAULT NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- A migração pode ter sido interrompida depois do ALTER acima, pois DDL no
-- MySQL faz commit implícito. Cria a FK somente quando ainda não existir.
SET @fk_venda_item_apresentacao_existe = (
  SELECT COUNT(*)
  FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'VendaItem'
    AND CONSTRAINT_NAME = 'fk_venda_item_apresentacao'
    AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);
SET @sql_fk_venda_item_apresentacao = IF(
  @fk_venda_item_apresentacao_existe = 0,
  'ALTER TABLE VendaItem ADD CONSTRAINT fk_venda_item_apresentacao FOREIGN KEY (apresentacao_id) REFERENCES ProdutoApresentacao(id) ON DELETE SET NULL ON UPDATE CASCADE',
  'SELECT 1'
);
PREPARE stmt_fk_venda_item_apresentacao FROM @sql_fk_venda_item_apresentacao;
EXECUTE stmt_fk_venda_item_apresentacao;
DEALLOCATE PREPARE stmt_fk_venda_item_apresentacao;

UPDATE VendaItem
SET quantidade_base = quantidade * fator_conversao
WHERE quantidade_base IS NULL;

ALTER TABLE VendaItem
  MODIFY COLUMN quantidade_base INT UNSIGNED NOT NULL;
