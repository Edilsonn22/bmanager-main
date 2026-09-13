import assert from "node:assert/strict";
import crypto from "node:crypto";
import { readFile } from "node:fs/promises";
import http from "node:http";
import { after, before, beforeEach, describe, test } from "node:test";

const executar = process.env.RUN_INTEGRATION_TESTS === "1";

describe("API: autenticação, isolamento e pagamentos", { skip: !executar }, () => {
  let appServer;
  let debitoServer;
  let baseUrl;
  let pool;
  let adminConnection;

  const resposta = async (path, options = {}) => {
    const response = await fetch(`${baseUrl}${path}`, options);
    return { status: response.status, body: await response.json() };
  };

  const criarEmpresaComAdmin = async (nome, email, role = "admin") => {
    const bcrypt = (await import("bcryptjs")).default;
    const [empresa] = await pool.execute("INSERT INTO Empresa (nome) VALUES (?)", [nome]);
    const empresaId = empresa.insertId;
    const senha = "SenhaTeste123";
    const senhaHash = await bcrypt.hash(senha, 10);
    const [usuario] = await pool.execute(
      "INSERT INTO Usuario (nome, email, senha, empresa_id, role) VALUES (?, ?, ?, ?, ?)",
      [nome, email, senhaHash, empresaId, role],
    );
    await pool.execute(
      "INSERT INTO assinaturas (empresa_id, plano_id, estado, inicia_em) VALUES (?, 1, 'ativa', NOW())",
      [empresaId],
    );
    return { empresaId, usuarioId: usuario.insertId, email, senha };
  };

  const iniciarSessao = async ({ email, senha }) => {
    const result = await resposta("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, senha }),
    });
    assert.equal(result.status, 200);
    return result.body.token;
  };

  before(async () => {
    process.env.NODE_ENV = "test";
    process.env.DB_NAME = process.env.TEST_DB_NAME || "bmanager_test";
    process.env.JWT_SECRET = "jwt-secret-exclusivo-para-testes";
    process.env.JWT_EXPIRES = "1h";
    process.env.DEBITO_WEBHOOK_SECRET = "webhook-secret-de-testes";
    process.env.RESEND_API_KEY = "";
    process.env.EMAIL_FROM = "";

    const dotenv = (await import("dotenv")).default;
    dotenv.config();
    const mysql = (await import("mysql2/promise")).default;
    const connectionOptions = {
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      multipleStatements: true,
    };
    adminConnection = await mysql.createConnection(connectionOptions);
    await adminConnection.query(`DROP DATABASE IF EXISTS \`${process.env.DB_NAME}\``);
    await adminConnection.query(`CREATE DATABASE \`${process.env.DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);

    const schema = await readFile(new URL("../../bmanager.sql", import.meta.url), "utf8");
    const schemaSemBanco = schema.replace(/DROP DATABASE[\s\S]*?USE bmanager;\s*/i, "");
    const schemaConnection = await mysql.createConnection({ ...connectionOptions, database: process.env.DB_NAME });
    await schemaConnection.query(schemaSemBanco);
    await schemaConnection.end();

    debitoServer = http.createServer(async (req, res) => {
      if (req.method !== "POST" || req.url !== "/payment-orchestrator") {
        res.writeHead(404).end();
        return;
      }
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: true, payment_id: "DBT_TEST_123", status: "pending" }));
    });
    await new Promise((resolve) => debitoServer.listen(0, "127.0.0.1", resolve));
    const debitoPort = debitoServer.address().port;
    process.env.DEBITO_BASE_URL = `http://127.0.0.1:${debitoPort}`;
    process.env.DEBITO_API_TOKEN = "token-de-teste";
    process.env.DEBITO_MERCHANT_ID = "merchant-test";
    process.env.DEBITO_WALLET_CODE = "wallet-test";

    const [{ default: importedPool }, { createApp }] = await Promise.all([
      import("../config/db.js"),
      import("../server.js"),
    ]);
    pool = importedPool;
    appServer = createApp().listen(0, "127.0.0.1");
    await new Promise((resolve) => appServer.once("listening", resolve));
    baseUrl = `http://127.0.0.1:${appServer.address().port}`;
  });

  beforeEach(async () => {
    const { limparRateLimits } = await import("../middlewares/rateLimit.js");
    limparRateLimits();
  });

  after(async () => {
    await new Promise((resolve) => appServer.close(resolve));
    await new Promise((resolve) => debitoServer.close(resolve));
    await pool.end();
    await adminConnection.query(`DROP DATABASE IF EXISTS \`${process.env.DB_NAME}\``);
    await adminConnection.end();
  });

  test("login aceita credenciais válidas e rejeita senha incorreta", async () => {
    const conta = await criarEmpresaComAdmin("Empresa Login", "login.teste@vendai.local");
    const sucesso = await resposta("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: conta.email, senha: conta.senha }),
    });
    assert.equal(sucesso.status, 200);
    assert.ok(sucesso.body.token);

    const falha = await resposta("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: conta.email, senha: "senha-errada" }),
    });
    assert.equal(falha.status, 401);
  });

  test("recuperação de senha gera um token temporário sem revelar se o e-mail existe", async () => {
    const conta = await criarEmpresaComAdmin("Empresa Recuperação", "recuperacao@teste.local");
    const existente = await resposta("/api/auth/recuperar-senha", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: conta.email }),
    });
    const inexistente = await resposta("/api/auth/recuperar-senha", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "nao-existe@teste.local" }),
    });
    assert.equal(existente.status, 200);
    assert.equal(existente.body.message, inexistente.body.message);
    const [tokens] = await pool.execute("SELECT id FROM recuperacao_senha WHERE usuario_id = ? AND usado_em IS NULL", [conta.usuarioId]);
    assert.equal(tokens.length, 1);
  });

  test("operador não pode gerir utilizadores", async () => {
    const operador = await criarEmpresaComAdmin("Empresa Operador", "operador@teste.local", "operador");
    const token = await iniciarSessao(operador);
    const result = await resposta("/api/auth/usuarios", {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(result.status, 403);
  });

  test("troca de senha revoga o token anterior e entrega um novo token", async () => {
    const empresa = await criarEmpresaComAdmin("Empresa Sessao", "sessao@teste.local");
    const tokenAntigo = await iniciarSessao(empresa);
    const alteracao = await resposta("/api/auth/senha", {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenAntigo}` },
      body: JSON.stringify({ senhaAtual: empresa.senha, novaSenha: "NovaSenhaTeste123" }),
    });
    assert.equal(alteracao.status, 200);
    assert.ok(alteracao.body.token);

    const sessaoAntiga = await resposta("/api/auth/perfil", { headers: { Authorization: `Bearer ${tokenAntigo}` } });
    const sessaoNova = await resposta("/api/auth/perfil", { headers: { Authorization: `Bearer ${alteracao.body.token}` } });
    assert.equal(sessaoAntiga.status, 401);
    assert.equal(sessaoNova.status, 200);
  });

  test("perfil atualiza dados pessoais e legais da empresa", async () => {
    const empresa = await criarEmpresaComAdmin("Empresa Perfil", "perfil@teste.local");
    const token = await iniciarSessao(empresa);
    const perfil = await resposta("/api/auth/perfil", {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ nome: "Ana Perfil", email: "ana.perfil@teste.local" }),
    });
    assert.equal(perfil.status, 200);
    assert.equal(perfil.body.usuario.email, "ana.perfil@teste.local");

    const empresaAtualizada = await resposta("/api/auth/empresa", {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ nome: "Empresa Perfil Legal", nuit: "123456789", email: "legal@teste.local", telefone: "840000000", endereco: "Maputo" }),
    });
    assert.equal(empresaAtualizada.status, 200);
    const conta = await resposta("/api/auth/minha-conta", { headers: { Authorization: `Bearer ${token}` } });
    assert.equal(conta.status, 200);
    assert.equal(conta.body.conta.nuit, "123456789");
    assert.equal(conta.body.conta.empresa_endereco, "Maputo");
  });

  test("suporte lista apenas tickets enviados pelo próprio utilizador", async () => {
    const empresaA = await criarEmpresaComAdmin("Empresa Suporte A", "suporte-a@teste.local");
    const empresaB = await criarEmpresaComAdmin("Empresa Suporte B", "suporte-b@teste.local");
    const tokenA = await iniciarSessao(empresaA);
    const tokenB = await iniciarSessao(empresaB);
    const bcrypt = (await import("bcryptjs")).default;
    const emailOperador = "operador-suporte@teste.local";
    const senhaOperador = "SenhaTeste123";
    await pool.execute(
      "INSERT INTO Usuario (nome, email, senha, empresa_id, role) VALUES (?, ?, ?, ?, 'operador')",
      ["Operador Suporte", emailOperador, await bcrypt.hash(senhaOperador, 10), empresaA.empresaId],
    );
    const tokenOperador = await iniciarSessao({ email: emailOperador, senha: senhaOperador });
    const criado = await resposta("/api/suporte/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ assunto: "Preciso de ajuda", mensagem: "Não consigo exportar o relatório." }),
    });
    assert.equal(criado.status, 201);
    const ticketsA = await resposta("/api/suporte/tickets", { headers: { Authorization: `Bearer ${tokenA}` } });
    const ticketsB = await resposta("/api/suporte/tickets", { headers: { Authorization: `Bearer ${tokenB}` } });
    const ticketsOperador = await resposta("/api/suporte/tickets", { headers: { Authorization: `Bearer ${tokenOperador}` } });
    assert.equal(ticketsA.body.tickets.length, 1);
    assert.equal(ticketsA.body.tickets[0].assunto, "Preciso de ajuda");
    assert.equal(ticketsB.body.tickets.length, 0);
    assert.equal(ticketsOperador.body.tickets.length, 0);
  });

  test("fatura apresenta dados legais e não vaza entre empresas", async () => {
    const empresaA = await criarEmpresaComAdmin("Empresa Fatura", "fatura@teste.local");
    const empresaB = await criarEmpresaComAdmin("Empresa Fatura B", "fatura-b@teste.local");
    await pool.execute("UPDATE Empresa SET nuit = ?, endereco = ? WHERE id = ?", ["987654321", "Rua da Fatura", empresaA.empresaId]);
    const [pagamento] = await pool.execute(
      `INSERT INTO pagamentos (empresa_id, plano_id, id_usuario, referencia, gateway, valor, estado, pago_em)
       VALUES (?, 1, ?, 'FATURA-TESTE-001', 'manual', 500, 'pago', NOW())`,
      [empresaA.empresaId, empresaA.usuarioId],
    );
    const tokenA = await iniciarSessao(empresaA);
    const tokenB = await iniciarSessao(empresaB);
    const fatura = await resposta(`/api/historico-pagamentos/${pagamento.insertId}/fatura`, { headers: { Authorization: `Bearer ${tokenA}` } });
    assert.equal(fatura.status, 200);
    assert.equal(fatura.body.fatura.empresa_nuit, "987654321");
    assert.equal(fatura.body.fatura.empresa_endereco, "Rua da Fatura");
    assert.match(fatura.body.fatura.numero_fiscal, /^BM-\d{4}-\d{6}$/);
    const bloqueada = await resposta(`/api/historico-pagamentos/${pagamento.insertId}/fatura`, { headers: { Authorization: `Bearer ${tokenB}` } });
    assert.equal(bloqueada.status, 404);
  });

  test("empresa não consegue listar produtos de outra empresa", async () => {
    const empresaA = await criarEmpresaComAdmin("Empresa A", "admin-a@teste.local");
    const empresaB = await criarEmpresaComAdmin("Empresa B", "admin-b@teste.local");
    const [[categoria], [fornecedor]] = await Promise.all([
      pool.execute("INSERT INTO Categoria (empresa_id, nome, descr) VALUES (?, ?, ?)", [empresaB.empresaId, "Categoria B", "Teste"]),
      pool.execute("INSERT INTO Fornecedor (empresa_id, nome) VALUES (?, ?)", [empresaB.empresaId, "Fornecedor B"]),
    ]);
    await pool.execute(
      "INSERT INTO Produto (empresa_id, nome, idCategoria, precoFornecedor, preco, idFornecedor, quantidade) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [empresaB.empresaId, "Produto exclusivo B", categoria.insertId, 10, 20, fornecedor.insertId, 3],
    );

    const tokenA = await iniciarSessao(empresaA);
    const result = await resposta("/api/produtos", { headers: { Authorization: `Bearer ${tokenA}` } });
    assert.equal(result.status, 200);
    assert.equal(result.body.produtos.some((produto) => produto.nome === "Produto exclusivo B"), false);
  });

  test("relatório preserva os preços praticados antes da alteração do produto", async () => {
    const empresa = await criarEmpresaComAdmin("Empresa Histórico", "historico@teste.local");
    const token = await iniciarSessao(empresa);
    const abertura = await resposta("/api/caixa/abrir", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ valor_abertura: 0 }),
    });
    assert.equal(abertura.status, 201);
    const [categoria] = await pool.execute(
      "INSERT INTO Categoria (empresa_id, nome, descr) VALUES (?, ?, ?)",
      [empresa.empresaId, "Categoria Histórica", "Teste"],
    );
    const [fornecedor] = await pool.execute(
      "INSERT INTO Fornecedor (empresa_id, nome) VALUES (?, ?)",
      [empresa.empresaId, "Fornecedor Histórico"],
    );
    const [produto] = await pool.execute(
      "INSERT INTO Produto (empresa_id, nome, idCategoria, precoFornecedor, preco, idFornecedor, quantidade) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [empresa.empresaId, "Produto Histórico", categoria.insertId, 40, 100, fornecedor.insertId, 10],
    );

    const vendaCriada = await resposta("/api/vendas", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        itens: [{ produto_id: produto.insertId, quantidade: 2 }],
        forma_pagamento: "dinheiro",
        valor_recebido: 200,
      }),
    });
    assert.equal(vendaCriada.status, 201);

    await pool.execute(
      "UPDATE Produto SET precoFornecedor = 80, preco = 250 WHERE id = ?",
      [produto.insertId],
    );
    const resumo = await resposta("/api/financeiro/resumo", {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(resumo.status, 200);
    const venda = resumo.body.movimentos.find((item) => Number(item.venda_id) === Number(vendaCriada.body.venda.id));
    assert.equal(Number(venda.preco_unitario), 100);
    assert.equal(Number(venda.custo_unitario), 40);
  });

  test("fluxo comercial integra cliente, caixa, venda, devolução, stock e financeiro", async () => {
    const empresa = await criarEmpresaComAdmin("Empresa Vendas", "vendas@teste.local");
    const token = await iniciarSessao(empresa);
    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
    const [categoria] = await pool.execute("INSERT INTO Categoria (empresa_id,nome,descr) VALUES (?,?,'Teste')", [empresa.empresaId, "Vendas"]);
    const [fornecedor] = await pool.execute("INSERT INTO Fornecedor (empresa_id,nome) VALUES (?,?)", [empresa.empresaId, "Fornecedor"]);
    const [produto] = await pool.execute("INSERT INTO Produto (empresa_id,nome,idCategoria,precoFornecedor,preco,idFornecedor,quantidade,codigo_barras) VALUES (?,?,?,?,?,?,?,?)", [empresa.empresaId, "Produto vendido", categoria.insertId, 40, 100, fornecedor.insertId, 10, "789123"]);

    const cliente = await resposta("/api/clientes", { method: "POST", headers, body: JSON.stringify({ nome: "Cliente Teste", nuit: "123" }) });
    assert.equal(cliente.status, 201);
    const caixa = await resposta("/api/caixa/abrir", { method: "POST", headers, body: JSON.stringify({ valor_abertura: 500 }) });
    assert.equal(caixa.status, 201);
    const venda = await resposta("/api/vendas", { method: "POST", headers, body: JSON.stringify({ itens: [{ produto_id: produto.insertId, quantidade: 3 }], cliente_id: cliente.body.cliente.id, desconto: 10, forma_pagamento: "dinheiro", valor_recebido: 300 }) });
    assert.equal(venda.status, 201);
    assert.equal(Number(venda.body.venda.total), 290);
    assert.equal(Number(venda.body.venda.troco), 10);
    const [[stockAposVenda]] = await pool.execute("SELECT quantidade FROM Produto WHERE id=?", [produto.insertId]);
    assert.equal(stockAposVenda.quantidade, 7);

    const detalhe = await resposta(`/api/vendas/${venda.body.venda.id}`, { headers });
    assert.equal(detalhe.status, 200);
    const devolucao = await resposta(`/api/vendas/${venda.body.venda.id}/itens/${detalhe.body.venda.itens[0].id}/devolver`, { method: "POST", headers, body: JSON.stringify({ quantidade: 1 }) });
    assert.equal(devolucao.status, 200);
    const [[stockAposDevolucao]] = await pool.execute("SELECT quantidade FROM Produto WHERE id=?", [produto.insertId]);
    assert.equal(stockAposDevolucao.quantidade, 8);
    const resumo = await resposta("/api/financeiro/resumo", { headers });
    const movimento = resumo.body.movimentos.find((item) => Number(item.venda_id) === Number(venda.body.venda.id));
    assert.equal(Number(movimento.quantidade), 2);

    const segundaVenda = await resposta("/api/vendas", { method: "POST", headers, body: JSON.stringify({ itens: [{ produto_id: produto.insertId, quantidade: 2 }], forma_pagamento: "mpesa" }) });
    assert.equal(segundaVenda.status, 201);
    const cancelamento = await resposta(`/api/vendas/${segundaVenda.body.venda.id}/cancelar`, { method: "POST", headers });
    assert.equal(cancelamento.status, 200);
    const [[stockFinal]] = await pool.execute("SELECT quantidade FROM Produto WHERE id=?", [produto.insertId]);
    assert.equal(stockFinal.quantidade, 8);
  });

  test("venda exige caixa aberto e preserva o nome do cliente avulso", async () => {
    const empresa = await criarEmpresaComAdmin("Empresa Cliente Avulso", "avulso@teste.local");
    const token = await iniciarSessao(empresa);
    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
    const [categoria] = await pool.execute("INSERT INTO Categoria (empresa_id,nome,descr) VALUES (?,?,'Teste')", [empresa.empresaId, "Avulso"]);
    const [fornecedor] = await pool.execute("INSERT INTO Fornecedor (empresa_id,nome) VALUES (?,?)", [empresa.empresaId, "Fornecedor Avulso"]);
    const [produto] = await pool.execute("INSERT INTO Produto (empresa_id,nome,idCategoria,precoFornecedor,preco,idFornecedor,quantidade) VALUES (?,?,?,?,?,?,?)", [empresa.empresaId, "Produto Avulso", categoria.insertId, 20, 50, fornecedor.insertId, 5]);
    const corpo = { itens: [{ produto_id: produto.insertId, quantidade: 1 }], cliente_nome: "Cliente do Balcão", forma_pagamento: "dinheiro", valor_recebido: 50 };

    const semCaixa = await resposta("/api/vendas", { method: "POST", headers, body: JSON.stringify(corpo) });
    assert.equal(semCaixa.status, 409);

    const caixa = await resposta("/api/caixa/abrir", { method: "POST", headers, body: JSON.stringify({ valor_abertura: 100 }) });
    assert.equal(caixa.status, 201);
    const criada = await resposta("/api/vendas", { method: "POST", headers, body: JSON.stringify(corpo) });
    assert.equal(criada.status, 201);
    const detalhe = await resposta(`/api/vendas/${criada.body.venda.id}`, { headers });
    assert.equal(detalhe.body.venda.cliente, "Cliente do Balcão");
    const lista = await resposta("/api/vendas", { headers });
    assert.equal(lista.body.vendas.find((item) => item.id === criada.body.venda.id)?.cliente, "Cliente do Balcão");
  });

  test("caixa impede abertura duplicada e restringe o fecho ao responsável", async () => {
    const empresa = await criarEmpresaComAdmin("Empresa Caixa Seguro", "caixa-admin@teste.local");
    const tokenAdmin = await iniciarSessao(empresa);
    const bcrypt = (await import("bcryptjs")).default;
    const senha = "SenhaOperador123";
    const [operador] = await pool.execute(
      "INSERT INTO Usuario (nome,email,senha,empresa_id,role) VALUES (?,?,?,?, 'operador')",
      ["Operador Caixa", "caixa-operador@teste.local", await bcrypt.hash(senha, 10), empresa.empresaId],
    );
    const tokenOperador = await iniciarSessao({ email: "caixa-operador@teste.local", senha });
    const headersAdmin = { "Content-Type": "application/json", Authorization: `Bearer ${tokenAdmin}` };
    const [primeira, segunda] = await Promise.all([
      resposta("/api/caixa/abrir", { method: "POST", headers: headersAdmin, body: JSON.stringify({ valor_abertura: 250 }) }),
      resposta("/api/caixa/abrir", { method: "POST", headers: headersAdmin, body: JSON.stringify({ valor_abertura: 250 }) }),
    ]);
    const resultados = [primeira, segunda].sort((a, b) => a.status - b.status);
    assert.deepEqual(resultados.map((item) => item.status), [201, 409]);
    const caixaId = resultados[0].body.id;

    const fechoNegado = await resposta(`/api/caixa/${caixaId}/fechar`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenOperador}` },
      body: JSON.stringify({ valor_fecho: 250 }),
    });
    assert.equal(fechoNegado.status, 403);
    assert.ok(operador.insertId);

    const fechoAdmin = await resposta(`/api/caixa/${caixaId}/fechar`, {
      method: "POST",
      headers: headersAdmin,
      body: JSON.stringify({ valor_fecho: 240 }),
    });
    assert.equal(fechoAdmin.status, 200);
    assert.equal(Number(fechoAdmin.body.fecho.diferenca), -10);
  });

  test("downgrade e cancelamento preservam o período contratado", async () => {
    const empresa = await criarEmpresaComAdmin("Empresa Comercial", "comercial@teste.local");
    await pool.execute(
      "UPDATE assinaturas SET plano_id = 2, expira_em = DATE_ADD(NOW(), INTERVAL 1 MONTH) WHERE empresa_id = ?",
      [empresa.empresaId],
    );
    const token = await iniciarSessao(empresa);

    const downgrade = await resposta("/api/assinaturas/downgrade", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ planoId: 1 }),
    });
    assert.equal(downgrade.status, 200);

    const cancelamento = await resposta("/api/assinaturas/cancelar", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(cancelamento.status, 200);

    const [assinaturas] = await pool.execute(
      "SELECT estado, plano_pendente_id, cancelamento_agendado_em FROM assinaturas WHERE empresa_id = ?",
      [empresa.empresaId],
    );
    assert.equal(assinaturas[0].estado, "ativa");
    assert.equal(assinaturas[0].plano_pendente_id, 1);
    assert.ok(assinaturas[0].cancelamento_agendado_em);

    const reativacao = await resposta("/api/assinaturas/reativar", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(reativacao.status, 200);
  });

  test("pagamento pendente é criado e webhook assinado ativa a assinatura", async () => {
    const empresa = await criarEmpresaComAdmin("Empresa Pagamentos", "pagamento@teste.local");
    const token = await iniciarSessao(empresa);
    const pagamento = await resposta("/api/pagamentos", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ planoId: 2, method: "mpesa", phone: "851234567" }),
    });
    assert.equal(pagamento.status, 201);
    assert.equal(pagamento.body.pagamento.id, "DBT_TEST_123");

    const evento = JSON.stringify({ event: "payment.completed", data: { payment_id: "DBT_TEST_123", transaction_id: "tx_123" } });
    const assinatura = crypto.createHmac("sha256", process.env.DEBITO_WEBHOOK_SECRET).update(evento).digest("hex");
    const webhook = await resposta("/api/webhooks/debito", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-debitopay-signature": assinatura },
      body: evento,
    });
    assert.equal(webhook.status, 200);

    const [pagamentos] = await pool.execute("SELECT estado FROM pagamentos WHERE gateway_reference = ?", ["DBT_TEST_123"]);
    const [assinaturas] = await pool.execute("SELECT plano_id, estado FROM assinaturas WHERE empresa_id = ?", [empresa.empresaId]);
    assert.equal(pagamentos[0].estado, "pago");
    assert.equal(assinaturas[0].plano_id, 2);
    assert.equal(assinaturas[0].estado, "ativa");
  });

  test("rotina diária expira, cancela e aplica downgrade ao fim do ciclo", async () => {
    const downgrade = await criarEmpresaComAdmin("Empresa Downgrade", "downgrade@teste.local");
    const cancelamento = await criarEmpresaComAdmin("Empresa Cancelamento", "cancelamento@teste.local");
    await pool.execute(
      `UPDATE assinaturas SET plano_id = 2, plano_pendente_id = 1,
       expira_em = DATE_SUB(NOW(), INTERVAL 1 DAY), estado = 'ativa' WHERE empresa_id = ?`,
      [downgrade.empresaId],
    );
    await pool.execute(
      `UPDATE assinaturas SET cancelamento_agendado_em = DATE_SUB(NOW(), INTERVAL 1 DAY),
       expira_em = DATE_SUB(NOW(), INTERVAL 1 DAY), estado = 'ativa' WHERE empresa_id = ?`,
      [cancelamento.empresaId],
    );

    const { processarRotinaAssinaturas } = await import("../services/rotinaAssinaturasService.js");
    const resumo = await processarRotinaAssinaturas();
    assert.ok(resumo.downgrades >= 1);
    assert.ok(resumo.expiradas >= 1);
    assert.ok(resumo.cancelamentos >= 1);

    const [[assinaturaDowngrade], [assinaturaCancelada]] = await Promise.all([
      pool.execute("SELECT plano_id, plano_pendente_id, estado FROM assinaturas WHERE empresa_id = ?", [downgrade.empresaId]),
      pool.execute("SELECT estado, plano_pendente_id FROM assinaturas WHERE empresa_id = ?", [cancelamento.empresaId]),
    ]);
    assert.equal(assinaturaDowngrade[0].plano_id, 1);
    assert.equal(assinaturaDowngrade[0].plano_pendente_id, null);
    assert.equal(assinaturaDowngrade[0].estado, "expirada");
    assert.equal(assinaturaCancelada[0].estado, "cancelada");
    assert.equal(assinaturaCancelada[0].plano_pendente_id, null);
  });
});
