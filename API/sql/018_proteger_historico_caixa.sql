-- Uma empresa com sessões de caixa não deve ser eliminada acidentalmente em cascata.
ALTER TABLE CaixaSessao
  DROP FOREIGN KEY fk_caixa_empresa,
  ADD CONSTRAINT fk_caixa_empresa FOREIGN KEY (empresa_id) REFERENCES Empresa(id)
    ON DELETE RESTRICT ON UPDATE CASCADE;
