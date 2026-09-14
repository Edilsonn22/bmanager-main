CREATE TABLE Cliente (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  empresa_id INT UNSIGNED NOT NULL,
  nome VARCHAR(255) NOT NULL,
  nuit VARCHAR(50) DEFAULT NULL,
  telefone VARCHAR(100) DEFAULT NULL,
  email VARCHAR(255) DEFAULT NULL,
  endereco VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_cliente_empresa (empresa_id),
  CONSTRAINT fk_cliente_empresa FOREIGN KEY (empresa_id) REFERENCES Empresa(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE CaixaSessao (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  empresa_id INT UNSIGNED NOT NULL,
  usuario_id INT UNSIGNED NOT NULL,
  valor_abertura DECIMAL(12,2) NOT NULL DEFAULT 0,
  valor_fecho DECIMAL(12,2) DEFAULT NULL,
  estado ENUM('aberto','fechado') NOT NULL DEFAULT 'aberto',
  aberto_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fechado_em TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (id),
  KEY idx_caixa_empresa_estado (empresa_id, estado),
  CONSTRAINT fk_caixa_empresa FOREIGN KEY (empresa_id) REFERENCES Empresa(id) ON DELETE CASCADE,
  CONSTRAINT fk_caixa_usuario FOREIGN KEY (usuario_id) REFERENCES Usuario(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE Venda (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  empresa_id INT UNSIGNED NOT NULL,
  cliente_id INT UNSIGNED DEFAULT NULL,
  usuario_id INT UNSIGNED NOT NULL,
  caixa_sessao_id INT UNSIGNED DEFAULT NULL,
  numero INT UNSIGNED NOT NULL,
  estado ENUM('concluida','cancelada','parcialmente_devolvida','devolvida') NOT NULL DEFAULT 'concluida',
  subtotal DECIMAL(12,2) NOT NULL,
  desconto DECIMAL(12,2) NOT NULL DEFAULT 0,
  total DECIMAL(12,2) NOT NULL,
  cancelada_em TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_venda_numero_empresa (empresa_id, numero),
  KEY idx_venda_empresa_data (empresa_id, created_at),
  CONSTRAINT fk_venda_empresa FOREIGN KEY (empresa_id) REFERENCES Empresa(id) ON DELETE CASCADE,
  CONSTRAINT fk_venda_cliente FOREIGN KEY (cliente_id) REFERENCES Cliente(id) ON DELETE SET NULL,
  CONSTRAINT fk_venda_usuario FOREIGN KEY (usuario_id) REFERENCES Usuario(id) ON DELETE RESTRICT,
  CONSTRAINT fk_venda_caixa FOREIGN KEY (caixa_sessao_id) REFERENCES CaixaSessao(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE VendaItem (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  venda_id INT UNSIGNED NOT NULL,
  produto_id INT UNSIGNED NOT NULL,
  nome_produto VARCHAR(255) NOT NULL,
  quantidade INT UNSIGNED NOT NULL,
  quantidade_devolvida INT UNSIGNED NOT NULL DEFAULT 0,
  preco_unitario DECIMAL(12,2) NOT NULL,
  custo_unitario DECIMAL(12,2) NOT NULL,
  total DECIMAL(12,2) NOT NULL,
  PRIMARY KEY (id),
  KEY idx_venda_item_venda (venda_id),
  CONSTRAINT fk_venda_item_venda FOREIGN KEY (venda_id) REFERENCES Venda(id) ON DELETE CASCADE,
  CONSTRAINT fk_venda_item_produto FOREIGN KEY (produto_id) REFERENCES Produto(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE PagamentoVenda (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  venda_id INT UNSIGNED NOT NULL,
  forma ENUM('dinheiro','mpesa','emola','cartao','transferencia','credito') NOT NULL,
  valor DECIMAL(12,2) NOT NULL,
  valor_recebido DECIMAL(12,2) DEFAULT NULL,
  troco DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_pagamento_venda (venda_id),
  CONSTRAINT fk_pagamento_venda FOREIGN KEY (venda_id) REFERENCES Venda(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE Produto ADD COLUMN codigo_barras VARCHAR(100) DEFAULT NULL;
CREATE UNIQUE INDEX uq_produto_codigo_empresa ON Produto (empresa_id, codigo_barras);
ALTER TABLE Movimentos ADD COLUMN origem ENUM('manual','venda','cancelamento','devolucao') NOT NULL DEFAULT 'manual';
ALTER TABLE Movimentos ADD COLUMN motivo VARCHAR(255) DEFAULT NULL;
ALTER TABLE Movimentos ADD COLUMN venda_id INT UNSIGNED DEFAULT NULL;
ALTER TABLE Movimentos ADD KEY idx_movimento_venda (venda_id);
ALTER TABLE Movimentos ADD CONSTRAINT fk_movimento_venda FOREIGN KEY (venda_id) REFERENCES Venda(id) ON DELETE SET NULL;
