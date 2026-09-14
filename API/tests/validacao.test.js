import assert from "node:assert/strict";
import test from "node:test";
import { emailValido, noveDigitos } from "../src/utils/validacao.js";

test("aceita endereços de e-mail completos", () => {
  assert.equal(emailValido("edilson.nhanombe@gmail.com"), true);
  assert.equal(emailValido(" comercial@empresa.co.mz "), true);
});

test("rejeita endereços de e-mail incompletos ou mal formados", () => {
  for (const email of ["edilson.nhanombe@gmail.", "nome@empresa", "nome@.com", "nome..apelido@gmail.com", ".nome@gmail.com", "nome@gmail.c", "nome @gmail.com"]) {
    assert.equal(emailValido(email), false, email);
  }
});

test("telefone e NUIT exigem exatamente nove dígitos", () => {
  assert.equal(noveDigitos("841234567"), true);
  assert.equal(noveDigitos("84123456"), false);
  assert.equal(noveDigitos("84123A567"), false);
});
