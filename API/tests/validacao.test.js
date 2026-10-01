import assert from "node:assert/strict";
import test from "node:test";
import { emailValido, noveDigitos } from "../src/utils/validacao.js";
import { validarCorpoJson } from "../middlewares/validation.js";

const verificarMiddleware = (req) => {
  const resposta = { statusCode: 200, body: null };
  const res = {
    status(statusCode) { resposta.statusCode = statusCode; return this; },
    json(body) { resposta.body = body; return this; },
  };
  let continuou = false;
  validarCorpoJson(req, res, () => { continuou = true; });
  return { ...resposta, continuou };
};

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

test("erros de corpo JSON têm formato e mensagem consistentes", () => {
  const formato = verificarMiddleware({
    method: "POST",
    path: "/api/teste",
    headers: { "content-length": "1", "content-type": "text/plain" },
  });
  assert.equal(formato.statusCode, 415);
  assert.equal(formato.body.erro, formato.body.message);

  const corpo = verificarMiddleware({
    method: "POST",
    path: "/api/teste",
    headers: { "content-length": "2", "content-type": "application/json" },
    body: [],
  });
  assert.equal(corpo.statusCode, 400);
  assert.equal(corpo.body.erro, corpo.body.message);
});
