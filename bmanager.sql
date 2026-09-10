-- Vendai: esquema completo para uma instalação nova.
-- Importe este arquivo dentro da base vazia selecionada.
-- O script não apaga nem recria a base fornecida pelo serviço de hospedagem.
-- Para uma base existente, use as migrações em API/sql/.

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
  preco_unitario DECIMAL(10,2) NOT NULL,
  custo_unitario DECIMAL(10,2) NOT NULL,
  origem ENUM('manual','venda','cancelamento','devolucao') NOT NULL DEFAULT 'manual',
  motivo VARCHAR(255) DEFAULT NULL,
  venda_id INT UNSIGNED DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_movimentos_empresa (empresa_id),
  KEY idx_movimentos_produto (id_Produto),
  CONSTRAINT fk_movimentos_empresa FOREIGN KEY (empresa_id) REFERENCES Empresa(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_movimentos_produto FOREIGN KEY (id_Produto) REFERENCES Produto(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE Cliente (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  empresa_id INT UNSIGNED NOT NULL,
  nome VARCHAR(255) NOT NULL,
  nuit VARCHAR(50) DEFAULT NULL,
  telefone VARCHAR(100) DEFAULT NULL,
  email VARCHAR(255) DEFAULT NULL,
  endereco VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id), KEY idx_cliente_empresa (empresa_id),
  CONSTRAINT fk_cliente_empresa FOREIGN KEY (empresa_id) REFERENCES Empresa(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE CaixaSessao (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT, empresa_id INT UNSIGNED NOT NULL, usuario_id INT UNSIGNED NOT NULL,
  valor_abertura DECIMAL(12,2) NOT NULL DEFAULT 0, valor_fecho DECIMAL(12,2) DEFAULT NULL,
  estado ENUM('aberto','fechado') NOT NULL DEFAULT 'aberto', aberto_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, fechado_em TIMESTAMP NULL DEFAULT NULL,
  caixa_aberto_empresa_id INT UNSIGNED GENERATED ALWAYS AS (CASE WHEN estado = 'aberto' THEN empresa_id ELSE NULL END) STORED,
  PRIMARY KEY (id), KEY idx_caixa_empresa_estado (empresa_id,estado), UNIQUE KEY uq_caixa_aberto_empresa (caixa_aberto_empresa_id),
  CONSTRAINT fk_caixa_empresa FOREIGN KEY (empresa_id) REFERENCES Empresa(id) ON DELETE RESTRICT,
  CONSTRAINT fk_caixa_usuario FOREIGN KEY (usuario_id) REFERENCES Usuario(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE Venda (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT, empresa_id INT UNSIGNED NOT NULL, cliente_id INT UNSIGNED DEFAULT NULL, cliente_nome VARCHAR(255) DEFAULT NULL,
  usuario_id INT UNSIGNED NOT NULL, caixa_sessao_id INT UNSIGNED DEFAULT NULL, numero INT UNSIGNED NOT NULL,
  estado ENUM('concluida','cancelada','parcialmente_devolvida','devolvida') NOT NULL DEFAULT 'concluida',
  subtotal DECIMAL(12,2) NOT NULL, desconto DECIMAL(12,2) NOT NULL DEFAULT 0, total DECIMAL(12,2) NOT NULL,
  cancelada_em TIMESTAMP NULL DEFAULT NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id), UNIQUE KEY uq_venda_numero_empresa (empresa_id,numero), KEY idx_venda_empresa_data (empresa_id,created_at),
  CONSTRAINT fk_venda_empresa FOREIGN KEY (empresa_id) REFERENCES Empresa(id) ON DELETE CASCADE,
  CONSTRAINT fk_venda_cliente FOREIGN KEY (cliente_id) REFERENCES Cliente(id) ON DELETE SET NULL,
  CONSTRAINT fk_venda_usuario FOREIGN KEY (usuario_id) REFERENCES Usuario(id) ON DELETE RESTRICT,
  CONSTRAINT fk_venda_caixa FOREIGN KEY (caixa_sessao_id) REFERENCES CaixaSessao(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE VendaItem (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT, venda_id INT UNSIGNED NOT NULL, produto_id INT UNSIGNED NOT NULL,
  nome_produto VARCHAR(255) NOT NULL, quantidade INT UNSIGNED NOT NULL, quantidade_devolvida INT UNSIGNED NOT NULL DEFAULT 0,
  preco_unitario DECIMAL(12,2) NOT NULL, custo_unitario DECIMAL(12,2) NOT NULL, total DECIMAL(12,2) NOT NULL,
  PRIMARY KEY (id), KEY idx_venda_item_venda (venda_id),
  CONSTRAINT fk_venda_item_venda FOREIGN KEY (venda_id) REFERENCES Venda(id) ON DELETE CASCADE,
  CONSTRAINT fk_venda_item_produto FOREIGN KEY (produto_id) REFERENCES Produto(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE PagamentoVenda (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT, venda_id INT UNSIGNED NOT NULL,
  forma ENUM('dinheiro','mpesa','emola','cartao','transferencia','credito') NOT NULL,
  valor DECIMAL(12,2) NOT NULL, valor_recebido DECIMAL(12,2) DEFAULT NULL, troco DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (id), KEY idx_pagamento_venda (venda_id),
  CONSTRAINT fk_pagamento_venda FOREIGN KEY (venda_id) REFERENCES Venda(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE Movimentos ADD KEY idx_movimento_venda (venda_id), ADD CONSTRAINT fk_movimento_venda FOREIGN KEY (venda_id) REFERENCES Venda(id) ON DELETE SET NULL;
ALTER TABLE Produto ADD COLUMN codigo_barras VARCHAR(100) DEFAULT NULL, ADD UNIQUE KEY uq_produto_codigo_empresa (empresa_id,codigo_barras);

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
  estado ENUM('aberto', 'em_andamento', 'resolvido', 'fechado') NOT NULL DEFAULT 'aberto',
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
  ('Teste gratuito', 'Experimente os recursos do Business durante 14 dias.', 0.00, 'mensal', 5, 1000000),
  ('Starter', 'Para pequenos negócios que precisam de organização e controlo.', 500.00, 'mensal', 1, 1000000),
  ('Business', 'Para empresas em crescimento que trabalham em equipa.', 1000.00, 'mensal', 5, 1000000),
  ('Enterprise', 'Para empresas que precisam de maior capacidade e acompanhamento personalizado.', 3500.00, 'mensal', 15, 1000000);

-- Nenhum utilizador de demonstração é criado em produção.
-- Crie o proprietário da plataforma com: npm run criar-dono
