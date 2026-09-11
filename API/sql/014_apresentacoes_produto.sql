-- Unidades de venda opcionais. O stock continua armazenado na unidade base.
ALTER TABLE Produto
  ADD COLUMN IF NOT EXISTS tipo_produto ENUM('simples','multiplas') NOT NULL DEFAULT 'simples',
  ADD COLUMN IF NOT EXISTS unidade_base VARCHAR(50) NOT NULL DEFAULT 'Unidade';

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

ALTER TABLE VendaItem
  ADD COLUMN IF NOT EXISTS apresentacao_id INT UNSIGNED DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS apresentacao_nome VARCHAR(50) NOT NULL DEFAULT 'Unidade',
  ADD COLUMN IF NOT EXISTS fator_conversao INT UNSIGNED NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS quantidade_base INT UNSIGNED DEFAULT NULL,
  ADD CONSTRAINT fk_venda_item_apresentacao FOREIGN KEY (apresentacao_id)
    REFERENCES ProdutoApresentacao(id) ON DELETE SET NULL ON UPDATE CASCADE;

UPDATE VendaItem
SET quantidade_base = quantidade * fator_conversao
WHERE quantidade_base IS NULL;

ALTER TABLE VendaItem
  MODIFY COLUMN quantidade_base INT UNSIGNED NOT NULL;
