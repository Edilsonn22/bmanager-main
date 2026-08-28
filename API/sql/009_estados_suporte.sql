-- Execute uma vez nas bases existentes para ativar o fluxo completo de suporte.
ALTER TABLE tickets_suporte
  MODIFY COLUMN estado ENUM('aberto','em_andamento','resolvido','fechado')
  NOT NULL DEFAULT 'aberto';
