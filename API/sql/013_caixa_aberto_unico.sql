ALTER TABLE CaixaSessao
  ADD COLUMN caixa_aberto_empresa_id INT UNSIGNED
    GENERATED ALWAYS AS (CASE WHEN estado = 'aberto' THEN empresa_id ELSE NULL END) STORED,
  ADD UNIQUE KEY uq_caixa_aberto_empresa (caixa_aberto_empresa_id);
