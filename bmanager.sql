-- BManager: esquema completo para uma instalacao nova.
-- ATENCAO: este arquivo remove e recria a base bmanager.
-- Para uma base existente, use migracoes apropriadas em API/sql/.

DROP DATABASE IF EXISTS bmanager;
CREATE DATABASE bmanager CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE bmanager;

CREATE TABLE Empresa (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nome VARCHAR(255) NOT NULL,
  nuit VARCHAR(50) DEFAULT NULL,
  email VARCHAR(255) DEFAULT NULL,
  telefone VARCHAR(100) DEFAULT NULL,
  endereco VARCHAR(255) DEFAULT NULL,
  session_version INT UNSIGNED NOT NULL DEFAULT 0,
  bloqueada BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE Usuario (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  senha VARCHAR(255) NOT NULL,
  empresa_id INT UNSIGNED NOT NULL,
  role ENUM('admin', 'gestor', 'operador') NOT NULL DEFAULT 'admin',
  token_version INT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_usuario_email (email),
  KEY idx_usuario_empresa (empresa_id),
  CONSTRAINT fk_usuario_empresa FOREIGN KEY (empresa_id) REFERENCES Empresa(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE AdministradorPlataforma (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  senha VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_administrador_plataforma_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE Categoria (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  empresa_id INT UNSIGNED NOT NULL,
  nome VARCHAR(255) NOT NULL,
  descr VARCHAR(255) NOT NULL,
  PRIMARY KEY (id),
  KEY idx_categoria_empresa (empresa_id),
  CONSTRAINT fk_categoria_empresa FOREIGN KEY (empresa_id) REFERENCES Empresa(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE Fornecedor (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  empresa_id INT UNSIGNED NOT NULL,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) DEFAULT NULL,
  contacto VARCHAR(100) DEFAULT NULL,
  endereco VARCHAR(255) DEFAULT NULL,
  PRIMARY KEY (id),
  KEY idx_fornecedor_empresa (empresa_id),
  CONSTRAINT fk_fornecedor_empresa FOREIGN KEY (empresa_id) REFERENCES Empresa(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE Produto (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  empresa_id INT UNSIGNED NOT NULL,
  nome VARCHAR(255) NOT NULL,
  idCategoria INT UNSIGNED NOT NULL,
  precoFornecedor DECIMAL(10,2) NOT NULL,
  preco DECIMAL(10,2) NOT NULL,
  idFornecedor INT UNSIGNED NOT NULL,
  quantidade INT NOT NULL DEFAULT 0,
  estoque_minimo INT NOT NULL DEFAULT 5,
  PRIMARY KEY (id),
  KEY idx_produto_empresa (empresa_id),
  KEY idx_produto_categoria (idCategoria),
  KEY idx_produto_fornecedor (idFornecedor),
  CONSTRAINT fk_produto_empresa FOREIGN KEY (empresa_id) REFERENCES Empresa(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_produto_categoria FOREIGN KEY (idCategoria) REFERENCES Categoria(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_produto_fornecedor FOREIGN KEY (idFornecedor) REFERENCES Fornecedor(id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE Movimentos (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_Produto INT UNSIGNED NOT NULL,
  empresa_id INT UNSIGNED NOT NULL,
  tipo ENUM('entrada', 'saida') NOT NULL,
  quantidade INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_movimentos_empresa (empresa_id),
  KEY idx_movimentos_produto (id_Produto),
  CONSTRAINT fk_movimentos_empresa FOREIGN KEY (empresa_id) REFERENCES Empresa(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_movimentos_produto FOREIGN KEY (id_Produto) REFERENCES Produto(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE planos (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nome VARCHAR(100) NOT NULL,
  descricao VARCHAR(255) DEFAULT NULL,
  preco DECIMAL(10,2) NOT NULL,
  tipo ENUM('mensal', 'anual', 'vitalicio') NOT NULL,
  limite_usuarios INT UNSIGNED NOT NULL DEFAULT 1,
  limite_produtos INT UNSIGNED NOT NULL DEFAULT 100,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_planos_nome (nome),
  KEY idx_planos_ativo (ativo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE assinaturas (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  empresa_id INT UNSIGNED NOT NULL,
  plano_id INT UNSIGNED NOT NULL,
  estado ENUM('pendente', 'ativa', 'expirada', 'cancelada') NOT NULL DEFAULT 'pendente',
  inicia_em DATETIME DEFAULT NULL,
  expira_em DATETIME DEFAULT NULL,
  cancelada_em DATETIME DEFAULT NULL,
  cancelamento_agendado_em DATETIME DEFAULT NULL,
  plano_pendente_id INT UNSIGNED DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_assinaturas_empresa (empresa_id),
  KEY idx_assinaturas_estado_expira (estado, expira_em),
  CONSTRAINT fk_assinaturas_empresa FOREIGN KEY (empresa_id) REFERENCES Empresa(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_assinaturas_plano FOREIGN KEY (plano_id) REFERENCES planos(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_assinaturas_plano_pendente FOREIGN KEY (plano_pendente_id) REFERENCES planos(id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE pagamentos (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  empresa_id INT UNSIGNED NOT NULL,
  plano_id INT UNSIGNED NOT NULL,
  id_usuario INT UNSIGNED DEFAULT NULL,
  referencia VARCHAR(100) NOT NULL,
  gateway VARCHAR(50) NOT NULL,
  metodo VARCHAR(50) DEFAULT NULL,
  valor DECIMAL(10,2) NOT NULL,
  moeda CHAR(3) NOT NULL DEFAULT 'MZN',
  estado ENUM('pendente', 'pago', 'falhou') NOT NULL DEFAULT 'pendente',
  gateway_reference VARCHAR(150) DEFAULT NULL,
  checkout_url VARCHAR(500) DEFAULT NULL,
  descricao VARCHAR(255) DEFAULT NULL,
  transaction_id VARCHAR(150) DEFAULT NULL,
  metadata JSON DEFAULT NULL,
  pago_em DATETIME DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_pagamentos_referencia (referencia),
  UNIQUE KEY uq_pagamentos_gateway_reference (gateway, gateway_reference),
  KEY idx_pagamentos_empresa (empresa_id),
  KEY idx_pagamentos_estado (estado),
  CONSTRAINT fk_pagamentos_empresa FOREIGN KEY (empresa_id) REFERENCES Empresa(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_pagamentos_plano FOREIGN KEY (plano_id) REFERENCES planos(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_pagamentos_usuario FOREIGN KEY (id_usuario) REFERENCES Usuario(id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE pagamento_eventos (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_pagamento INT UNSIGNED NOT NULL,
  evento VARCHAR(100) NOT NULL,
  payload JSON DEFAULT NULL,
  processado BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_pagamento_eventos_pagamento (id_pagamento, processado),
  CONSTRAINT fk_pagamento_eventos_pagamento FOREIGN KEY (id_pagamento) REFERENCES pagamentos(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE notificacoes (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  empresa_id INT UNSIGNED NOT NULL,
  tipo VARCHAR(50) NOT NULL,
  titulo VARCHAR(150) NOT NULL,
  mensagem VARCHAR(500) NOT NULL,
  lida BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_notificacoes_empresa (empresa_id, lida),
  CONSTRAINT fk_notificacoes_empresa FOREIGN KEY (empresa_id) REFERENCES Empresa(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE recuperacao_senha (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  usuario_id INT UNSIGNED NOT NULL,
  token_hash CHAR(64) NOT NULL,
  expira_em DATETIME NOT NULL,
  usado_em DATETIME DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_recuperacao_senha_token (token_hash),
  KEY idx_recuperacao_senha_usuario (usuario_id),
  CONSTRAINT fk_recuperacao_senha_usuario FOREIGN KEY (usuario_id) REFERENCES Usuario(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE tickets_suporte (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  empresa_id INT UNSIGNED NOT NULL,
  usuario_id INT UNSIGNED NOT NULL,
  assunto VARCHAR(150) NOT NULL,
  mensagem TEXT NOT NULL,
  estado ENUM('aberto', 'em_andamento', 'fechado') NOT NULL DEFAULT 'aberto',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_tickets_suporte_empresa (empresa_id, estado),
  CONSTRAINT fk_tickets_suporte_empresa FOREIGN KEY (empresa_id) REFERENCES Empresa(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_tickets_suporte_usuario FOREIGN KEY (usuario_id) REFERENCES Usuario(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE auditoria (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  empresa_id INT UNSIGNED DEFAULT NULL,
  usuario_id INT UNSIGNED DEFAULT NULL,
  acao VARCHAR(80) NOT NULL,
  entidade VARCHAR(80) NOT NULL,
  entidade_id VARCHAR(80) DEFAULT NULL,
  detalhes JSON DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_auditoria_empresa (empresa_id, created_at),
  CONSTRAINT fk_auditoria_empresa FOREIGN KEY (empresa_id) REFERENCES Empresa(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_auditoria_usuario FOREIGN KEY (usuario_id) REFERENCES Usuario(id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO planos (nome, descricao, preco, tipo, limite_usuarios, limite_produtos)
VALUES
  ('Teste gratuito', 'Acesso experimental por 14 dias.', 0.00, 'mensal', 2, 50),
  ('Basico mensal', 'Plano mensal para pequenas empresas.', 500.00, 'mensal', 5, 500),
  ('Basico anual', 'Plano anual para pequenas empresas.', 5000.00, 'anual', 5, 500);

-- Dados de demonstracao para acesso imediato ao sistema.
-- E-mail: edilson@gmail | Senha: e12345678E
INSERT INTO Empresa (nome) VALUES ('Empresa Edilson');
SET @empresa_demo_id = LAST_INSERT_ID();

INSERT INTO Usuario (nome, email, senha, empresa_id, role)
VALUES (
  'Edilson',
  'edilson@gmail',
  '$2b$12$5VSOhxRBUdoaVHjSYXk56.wUWPZTfqfmb7gzc65olNtHLzFvS/qBy',
  @empresa_demo_id,
  'admin'
);

INSERT INTO assinaturas (empresa_id, plano_id, estado, inicia_em, expira_em)
SELECT @empresa_demo_id, id, 'ativa', NOW(), DATE_ADD(NOW(), INTERVAL 1 MONTH)
FROM planos
WHERE nome = 'Basico mensal';
