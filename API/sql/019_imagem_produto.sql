-- Guarda uma fotografia otimizada por produto sem depender do disco efémero do servidor.
SET @sql_imagem = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Produto' AND COLUMN_NAME = 'imagem') = 0, 'ALTER TABLE Produto ADD COLUMN imagem MEDIUMBLOB DEFAULT NULL', 'SELECT 1');
PREPARE stmt_imagem FROM @sql_imagem;
EXECUTE stmt_imagem;
DEALLOCATE PREPARE stmt_imagem;

SET @sql_imagem_mime = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Produto' AND COLUMN_NAME = 'imagem_mime') = 0, 'ALTER TABLE Produto ADD COLUMN imagem_mime VARCHAR(50) DEFAULT NULL', 'SELECT 1');
PREPARE stmt_imagem_mime FROM @sql_imagem_mime;
EXECUTE stmt_imagem_mime;
DEALLOCATE PREPARE stmt_imagem_mime;
