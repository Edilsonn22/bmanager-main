import assert from "node:assert/strict";
import test from "node:test";
import { validarAmbienteProducao } from "../config/validarAmbiente.js";

test("ambiente de desenvolvimento não exige configurações de produção", () => {
  assert.doesNotThrow(() => validarAmbienteProducao({ NODE_ENV: "development" }));
});

test("produção rejeita segredo fraco e URL sem HTTPS", () => {
  const base = {
    NODE_ENV: "production",
    CLIENT_URL: "http://app.exemplo.com",
    JWT_SECRET: "curto",
    DB_HOST: "database",
    DB_USER: "app",
    DB_PASSWORD: "senha",
    DB_NAME: "bmanager",
  };
  assert.throws(() => validarAmbienteProducao(base), /JWT_SECRET/);
  assert.throws(() => validarAmbienteProducao({ ...base, JWT_SECRET: "a".repeat(48) }), /HTTPS/);
});

test("produção aceita configuração essencial segura", () => {
  assert.doesNotThrow(() => validarAmbienteProducao({
    NODE_ENV: "production",
    CLIENT_URL: "https://app.exemplo.com",
    JWT_SECRET: "a7f0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8",
    DB_HOST: "database",
    DB_USER: "app",
    DB_PASSWORD: "senha-forte",
    DB_NAME: "bmanager",
  }));
});
