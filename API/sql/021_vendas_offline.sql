ALTER TABLE Venda
  ADD COLUMN idempotencia_id CHAR(36) DEFAULT NULL,
  ADD UNIQUE KEY uq_venda_idempotencia_empresa (empresa_id, idempotencia_id);

CREATE TABLE VendaOfflinePendente (
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