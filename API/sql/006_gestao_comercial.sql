-- Migração para bases existentes: downgrade e cancelamento agendados.
ALTER TABLE assinaturas
  ADD COLUMN IF NOT EXISTS cancelamento_agendado_em DATETIME DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS plano_pendente_id INT UNSIGNED DEFAULT NULL,
  ADD CONSTRAINT fk_assinaturas_plano_pendente
    FOREIGN KEY (plano_pendente_id) REFERENCES planos(id)
    ON DELETE SET NULL ON UPDATE CASCADE;
