ALTER TABLE Empresa ADD COLUMN IF NOT EXISTS bloqueada BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE Produto ADD COLUMN IF NOT EXISTS estoque_minimo INT NOT NULL DEFAULT 5;

CREATE TABLE IF NOT EXISTS tickets_suporte (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  empresa_id INT UNSIGNED NOT NULL,
  usuario_id INT UNSIGNED NOT NULL,
  assunto VARCHAR(150) NOT NULL,
  mensagem TEXT NOT NULL,
  estado ENUM('aberto','em_andamento','resolvido','fechado') NOT NULL DEFAULT 'aberto',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id), KEY idx_ticket_empresa (empresa_id, estado),
  CONSTRAINT fk_ticket_empresa FOREIGN KEY (empresa_id) REFERENCES Empresa(id) ON DELETE CASCADE,
  CONSTRAINT fk_ticket_usuario FOREIGN KEY (usuario_id) REFERENCES Usuario(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS auditoria (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  empresa_id INT UNSIGNED DEFAULT NULL,
  usuario_id INT UNSIGNED DEFAULT NULL,
  acao VARCHAR(80) NOT NULL,
  entidade VARCHAR(80) NOT NULL,
  entidade_id VARCHAR(80) DEFAULT NULL,
  detalhes JSON DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id), KEY idx_auditoria_empresa (empresa_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO planos (nome, descricao, preco, tipo, limite_usuarios, limite_produtos)
SELECT 'Teste gratuito', 'Experimente os recursos do Business durante 14 dias.', 0, 'mensal', 5, 1000000
WHERE NOT EXISTS (SELECT 1 FROM planos WHERE nome = 'Teste gratuito');
