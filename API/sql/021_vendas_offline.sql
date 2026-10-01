SET @coluna_idempotencia_existe = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'Venda'
    AND COLUMN_NAME = 'idempotencia_id'
);
SET @sql_coluna_idempotencia = IF(
  @coluna_idempotencia_existe = 0,
  'ALTER TABLE Venda ADD COLUMN idempotencia_id CHAR(36) DEFAULT NULL',
  'SELECT 1'
);
PREPARE stmt_coluna_idempotencia FROM @sql_coluna_idempotencia;
EXECUTE stmt_coluna_idempotencia;
DEALLOCATE PREPARE stmt_coluna_idempotencia;

SET @indice_idempotencia_existe = (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'Venda'
    AND INDEX_NAME = 'uq_venda_idempotencia_empresa'
);
SET @sql_indice_idempotencia = IF(
  @indice_idempotencia_existe = 0,
  'ALTER TABLE Venda ADD UNIQUE KEY uq_venda_idempotencia_empresa (empresa_id, idempotencia_id)',
  'SELECT 1'
);
PREPARE stmt_indice_idempotencia FROM @sql_indice_idempotencia;
EXECUTE stmt_indice_idempotencia;
DEALLOCATE PREPARE stmt_indice_idempotencia;

CREATE TABLE IF NOT EXISTS VendaOfflinePendente (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  empresa_id INT UNSIGNED NOT NULL,
  usuario_id INT UNSIGNED NOT NULL,
  idempotencia_id CHAR(36) NOT NULL,
  payload JSON NOT NULL,
  motivo VARCHAR(500) NOT NULL,
  estado ENUM('pendente','resolvida') NOT NULL DEFAULT 'pendente',
  venda_id INT UNSIGNED DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_venda_offline_idempotencia (empresa_id, idempotencia_id),
  KEY idx_venda_offline_estado (empresa_id, estado, created_at),
  CONSTRAINT fk_venda_offline_empresa FOREIGN KEY (empresa_id) REFERENCES Empresa(id) ON DELETE RESTRICT,
  CONSTRAINT fk_venda_offline_usuario FOREIGN KEY (usuario_id) REFERENCES Usuario(id) ON DELETE RESTRICT,
  CONSTRAINT fk_venda_offline_venda FOREIGN KEY (venda_id) REFERENCES Venda(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;