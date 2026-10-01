-- Guarda um retrato imutável dos valores apurados no momento do fecho.
CREATE TABLE IF NOT EXISTS CaixaFechoRelatorio (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  caixa_sessao_id INT UNSIGNED NOT NULL,
  empresa_id INT UNSIGNED NOT NULL,
  usuario_fecho_id INT UNSIGNED NOT NULL,
  codigo VARCHAR(40) NOT NULL,
  resumo JSON NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_caixa_fecho_sessao (caixa_sessao_id),
  UNIQUE KEY uq_caixa_fecho_codigo_empresa (empresa_id, codigo),
  KEY idx_caixa_fecho_empresa_data (empresa_id, created_at),
  CONSTRAINT fk_caixa_fecho_sessao FOREIGN KEY (caixa_sessao_id) REFERENCES CaixaSessao(id) ON DELETE RESTRICT,
  CONSTRAINT fk_caixa_fecho_empresa FOREIGN KEY (empresa_id) REFERENCES Empresa(id) ON DELETE RESTRICT,
  CONSTRAINT fk_caixa_fecho_usuario FOREIGN KEY (usuario_fecho_id) REFERENCES Usuario(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
