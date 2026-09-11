CREATE TABLE IF NOT EXISTS ScannerSessao (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  empresa_id INT UNSIGNED NOT NULL,
  usuario_id INT UNSIGNED NOT NULL,
  token_hash CHAR(64) NOT NULL,
  expira_em DATETIME NOT NULL,
  ativa BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id), UNIQUE KEY uq_scanner_token (token_hash),
  KEY idx_scanner_empresa (empresa_id, ativa, expira_em),
  CONSTRAINT fk_scanner_empresa FOREIGN KEY (empresa_id) REFERENCES Empresa(id) ON DELETE CASCADE,
  CONSTRAINT fk_scanner_usuario FOREIGN KEY (usuario_id) REFERENCES Usuario(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS ScannerCodigo (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  sessao_id BIGINT UNSIGNED NOT NULL,
  codigo VARCHAR(100) NOT NULL,
  consumido BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id), KEY idx_scanner_codigo (sessao_id, consumido, id),
  CONSTRAINT fk_scanner_codigo_sessao FOREIGN KEY (sessao_id) REFERENCES ScannerSessao(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
