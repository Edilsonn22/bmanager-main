-- Permite usar a embalagem apenas para compras/entradas, sem a oferecer no ponto de venda.
SET @sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ProdutoApresentacao' AND COLUMN_NAME = 'vendavel') = 0, 'ALTER TABLE ProdutoApresentacao ADD COLUMN vendavel BOOLEAN NOT NULL DEFAULT TRUE AFTER codigo_barras', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
