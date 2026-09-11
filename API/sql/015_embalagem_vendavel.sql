-- Permite usar a embalagem apenas para compras/entradas, sem a oferecer no ponto de venda.
ALTER TABLE ProdutoApresentacao
  ADD COLUMN IF NOT EXISTS vendavel BOOLEAN NOT NULL DEFAULT TRUE AFTER codigo_barras;
