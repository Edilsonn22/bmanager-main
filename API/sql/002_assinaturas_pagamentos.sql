-- Execute uma vez na base de dados existente: mysql -u root -p bmanager < sql/002_assinaturas_pagamentos.sql

CREATE TABLE IF NOT EXISTS Plano (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo VARCHAR(50) NOT NULL,
  nome VARCHAR(100) NOT NULL,
  descricao VARCHAR(255) DEFAULT NULL,
  valor DECIMAL(10,2) NOT NULL,
  periodo_meses TINYINT UNSIGNED NOT NULL DEFAULT 1,
  ativo TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_plano_codigo (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS Assinatura (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  empresa_id INT UNSIGNED NOT NULL,
  plano_id INT UNSIGNED NOT NULL,
  status ENUM('pendente', 'ativa', 'expirada', 'cancelada') NOT NULL DEFAULT 'pendente',
  inicia_em DATETIME DEFAULT NULL,
  expira_em DATETIME DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_assinatura_empresa (empresa_id),
  KEY idx_assinatura_status_expira (status, expira_em),
  CONSTRAINT fk_assinatura_empresa FOREIGN KEY (empresa_id) REFERENCES Empresa(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_assinatura_plano FOREIGN KEY (plano_id) REFERENCES Plano(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS Pagamento (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  empresa_id INT UNSIGNED NOT NULL,
  plano_id INT UNSIGNED NOT NULL,
  provider_id VARCHAR(100) NOT NULL,
  referencia VARCHAR(50) NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  status ENUM('pendente', 'pago', 'falhado') NOT NULL DEFAULT 'pendente',
  checkout_url VARCHAR(500) DEFAULT NULL,
  pago_em DATETIME DEFAULT NULL,
  provider_payload JSON DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_pagamento_provider (provider_id),
  UNIQUE KEY uq_pagamento_referencia (referencia),
  KEY idx_pagamento_empresa (empresa_id),
  KEY idx_pagamento_status (status),
  CONSTRAINT fk_pagamento_empresa FOREIGN KEY (empresa_id) REFERENCES Empresa(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_pagamento_plano FOREIGN KEY (plano_id) REFERENCES Plano(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO Plano (codigo, nome, descricao, valor, periodo_meses)
VALUES
  ('basico-mensal', 'Básico mensal', 'Acesso por um mês.', 500.00, 1),
  ('basico-anual', 'Básico anual', 'Acesso por doze meses.', 5000.00, 12)
ON DUPLICATE KEY UPDATE
  nome = VALUES(nome), descricao = VALUES(descricao), valor = VALUES(valor), periodo_meses = VALUES(periodo_meses), ativo = 1;
