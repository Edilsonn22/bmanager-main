import pool from "../config/db.js";

const empresaId = Number(process.argv[2]);

if (!Number.isInteger(empresaId) || empresaId <= 0) {
  throw new Error("Uso: node scripts/seedProdutosEmpresa.js <empresa_id>");
}

const simples = (nome, categoria, fornecedor, custo, preco, quantidade, unidade = "Unidade") => ({
  nome, categoria, fornecedor, custo, preco, quantidade, unidade, embalagem: null,
});

const multiplo = (nome, categoria, fornecedor, custo, preco, caixas, embalagem, fator, precoEmbalagem, unidade = "Unidade") => ({
  nome, categoria, fornecedor, custo, preco, quantidade: caixas * fator, unidade,
  embalagem: { nome: embalagem, fator, preco: precoEmbalagem, custo: custo * fator },
});

const produtos = [
  multiplo("Coca-Cola 500ml", "Bebidas", "Moz Bebidas", 35, 50, 12, "Grade", 24, 1080, "Garrafa"),
  multiplo("Fanta Laranja 500ml", "Bebidas", "Moz Bebidas", 34, 50, 10, "Grade", 24, 1080, "Garrafa"),
  multiplo("Sprite 500ml", "Bebidas", "Moz Bebidas", 34, 50, 10, "Grade", 24, 1080, "Garrafa"),
  multiplo("Água Mineral 500ml", "Bebidas", "Moz Bebidas", 14, 25, 18, "Fardo", 12, 270, "Garrafa"),
  multiplo("Água Mineral 1.5L", "Bebidas", "Moz Bebidas", 28, 45, 12, "Fardo", 6, 240, "Garrafa"),
  multiplo("Sumo de Manga 1L", "Bebidas", "Moz Bebidas", 75, 110, 8, "Caixa", 12, 1180, "Pacote"),
  multiplo("Sumo de Laranja 1L", "Bebidas", "Moz Bebidas", 75, 110, 8, "Caixa", 12, 1180, "Pacote"),
  multiplo("Leite UHT 1L", "Bebidas", "Distribuidora Maputo", 72, 95, 10, "Caixa", 12, 1020, "Pacote"),
  multiplo("Refrigerante Cola 2L", "Bebidas", "Moz Bebidas", 78, 110, 8, "Fardo", 6, 600, "Garrafa"),
  multiplo("Bebida Energética 250ml", "Bebidas", "Moz Bebidas", 48, 75, 8, "Caixa", 24, 1620, "Lata"),

  multiplo("Arroz Agulha 1kg", "Mercearia", "Distribuidora Maputo", 62, 85, 10, "Saco", 25, 1900, "Pacote"),
  multiplo("Açúcar Branco 1kg", "Mercearia", "Distribuidora Maputo", 58, 78, 10, "Fardo", 10, 700, "Pacote"),
  multiplo("Farinha de Milho 1kg", "Mercearia", "Distribuidora Maputo", 48, 68, 10, "Fardo", 10, 610, "Pacote"),
  multiplo("Óleo Alimentar 1L", "Mercearia", "Distribuidora Maputo", 115, 145, 8, "Caixa", 12, 1560, "Garrafa"),
  multiplo("Massa Esparguete 500g", "Mercearia", "Distribuidora Maputo", 38, 55, 10, "Caixa", 20, 990, "Pacote"),
  multiplo("Feijão Manteiga 1kg", "Mercearia", "Distribuidora Maputo", 92, 125, 8, "Fardo", 10, 1120, "Pacote"),
  multiplo("Sal Refinado 1kg", "Mercearia", "Distribuidora Maputo", 22, 35, 8, "Fardo", 20, 620, "Pacote"),
  multiplo("Bolacha Maria 200g", "Mercearia", "Distribuidora Maputo", 28, 45, 12, "Caixa", 24, 960, "Pacote"),
  multiplo("Atum em Lata 170g", "Mercearia", "Distribuidora Maputo", 65, 90, 8, "Caixa", 24, 1940, "Lata"),
  multiplo("Tomate Pelado 400g", "Mercearia", "Distribuidora Maputo", 42, 65, 6, "Caixa", 24, 1380, "Lata"),
  multiplo("Chá Preto 100 saquetas", "Mercearia", "Distribuidora Maputo", 105, 145, 5, "Caixa", 12, 1560, "Pacote"),
  simples("Café Solúvel 100g", "Mercearia", "Distribuidora Maputo", 145, 195, 35, "Frasco"),
  simples("Maionese 500ml", "Mercearia", "Distribuidora Maputo", 105, 145, 30, "Frasco"),
  simples("Ketchup 500ml", "Mercearia", "Distribuidora Maputo", 92, 130, 30, "Frasco"),
  simples("Cereais de Milho 500g", "Mercearia", "Distribuidora Maputo", 155, 210, 25, "Caixa"),

  multiplo("Sabão em Barra 200g", "Higiene", "Higiene & Lar", 24, 40, 10, "Caixa", 48, 1680, "Unidade"),
  multiplo("Pasta Dentífrica 100ml", "Higiene", "Higiene & Lar", 55, 80, 8, "Caixa", 24, 1720, "Tubo"),
  multiplo("Papel Higiénico 4 Rolos", "Higiene", "Higiene & Lar", 78, 110, 8, "Fardo", 12, 1180, "Pacote"),
  multiplo("Pensos Higiénicos 8 Unidades", "Higiene", "Higiene & Lar", 48, 70, 8, "Caixa", 24, 1500, "Pacote"),
  simples("Champô 400ml", "Higiene", "Higiene & Lar", 135, 190, 24, "Frasco"),
  simples("Gel de Banho 500ml", "Higiene", "Higiene & Lar", 125, 175, 22, "Frasco"),
  simples("Desodorizante Roll-on 50ml", "Higiene", "Higiene & Lar", 82, 120, 30, "Frasco"),
  simples("Escova de Dentes Média", "Higiene", "Higiene & Lar", 42, 65, 40),
  simples("Creme Corporal 400ml", "Higiene", "Higiene & Lar", 145, 210, 20, "Frasco"),
  simples("Lâminas de Barbear 3 Unidades", "Higiene", "Higiene & Lar", 75, 110, 24, "Pacote"),

  multiplo("Detergente em Pó 500g", "Limpeza", "Higiene & Lar", 52, 75, 10, "Fardo", 12, 810, "Pacote"),
  multiplo("Lixívia 1L", "Limpeza", "Higiene & Lar", 38, 60, 10, "Caixa", 12, 650, "Garrafa"),
  multiplo("Detergente de Loiça 750ml", "Limpeza", "Higiene & Lar", 68, 95, 8, "Caixa", 12, 1020, "Garrafa"),
  multiplo("Sacos de Lixo 30L", "Limpeza", "Higiene & Lar", 45, 70, 8, "Caixa", 20, 1260, "Rolo"),
  simples("Vassoura Doméstica", "Limpeza", "Higiene & Lar", 110, 165, 20),
  simples("Esfregona de Algodão", "Limpeza", "Higiene & Lar", 125, 180, 18),
  simples("Balde Plástico 15L", "Limpeza", "Higiene & Lar", 135, 195, 16),
  simples("Esponja de Cozinha", "Limpeza", "Higiene & Lar", 18, 30, 60),
  simples("Limpa-vidros 500ml", "Limpeza", "Higiene & Lar", 72, 105, 24, "Frasco"),
  simples("Inseticida Aerosol 300ml", "Limpeza", "Higiene & Lar", 115, 165, 20, "Lata"),

  simples("Caderno A4 96 Folhas", "Papelaria", "Papelaria Central", 58, 85, 45),
  simples("Caneta Azul", "Papelaria", "Papelaria Central", 8, 15, 100),
  simples("Lápis HB", "Papelaria", "Papelaria Central", 6, 12, 100),
  simples("Resma de Papel A4", "Papelaria", "Papelaria Central", 285, 360, 25, "Resma"),
  simples("Marcador Permanente Preto", "Papelaria", "Papelaria Central", 28, 45, 50),
];

const cores = {
  Bebidas: ["#0ea5e9", "#0369a1"], Mercearia: ["#f59e0b", "#b45309"],
  Higiene: ["#8b5cf6", "#6d28d9"], Limpeza: ["#10b981", "#047857"],
  Papelaria: ["#3b82f6", "#1d4ed8"],
};

function escaparSvg(valor) {
  return String(valor).replace(/[&<>"']/g, (caractere) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;",
  })[caractere]);
}

function criarImagem(produto) {
  const [cor1, cor2] = cores[produto.categoria] || cores.Mercearia;
  const nome = escaparSvg(produto.nome);
  const unidade = escaparSvg(produto.unidade);
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${cor1}"/><stop offset="1" stop-color="${cor2}"/></linearGradient></defs>
    <rect width="800" height="800" rx="56" fill="#f8fafc"/><circle cx="400" cy="320" r="225" fill="url(#g)" opacity=".12"/>
    <rect x="260" y="135" width="280" height="365" rx="44" fill="url(#g)"/><rect x="295" y="185" width="210" height="205" rx="28" fill="#fff" opacity=".94"/>
    <path d="M335 265h130M335 305h130" stroke="${cor1}" stroke-width="18" stroke-linecap="round" opacity=".55"/>
    <text x="400" y="575" text-anchor="middle" font-family="Arial,sans-serif" font-size="38" font-weight="700" fill="#0f172a">${nome}</text>
    <text x="400" y="630" text-anchor="middle" font-family="Arial,sans-serif" font-size="25" fill="#64748b">${unidade}</text>
    <text x="400" y="700" text-anchor="middle" font-family="Arial,sans-serif" font-size="24" font-weight="700" fill="${cor2}">VENDAÍ</text>
  </svg>`, "utf8");
}

const connection = await pool.getConnection();
try {
  await connection.beginTransaction();
  const [[empresa]] = await connection.execute("SELECT id, nome FROM Empresa WHERE id=?", [empresaId]);
  if (!empresa) throw new Error(`A empresa ${empresaId} não existe.`);

  const categorias = new Map();
  for (const nome of [...new Set(produtos.map((produto) => produto.categoria))]) {
    const [existentes] = await connection.execute("SELECT id FROM Categoria WHERE empresa_id=? AND nome=? LIMIT 1", [empresaId, nome]);
    if (existentes[0]) categorias.set(nome, existentes[0].id);
    else {
      const [resultado] = await connection.execute("INSERT INTO Categoria (empresa_id,nome,descr) VALUES (?,?,?)", [empresaId, nome, `Produtos de ${nome.toLowerCase()}`]);
      categorias.set(nome, resultado.insertId);
    }
  }

  const fornecedores = new Map();
  for (const nome of [...new Set(produtos.map((produto) => produto.fornecedor))]) {
    const [existentes] = await connection.execute("SELECT id FROM Fornecedor WHERE empresa_id=? AND nome=? LIMIT 1", [empresaId, nome]);
    if (existentes[0]) fornecedores.set(nome, existentes[0].id);
    else {
      const [resultado] = await connection.execute("INSERT INTO Fornecedor (empresa_id,nome,email,contacto,endereco) VALUES (?,?,?,?,?)", [empresaId, nome, null, null, "Maputo, Moçambique"]);
      fornecedores.set(nome, resultado.insertId);
    }
  }

  let inseridos = 0;
  let ignorados = 0;
  const produtosDaCarga = [];
  for (const [indice, produto] of produtos.entries()) {
    const [existentes] = await connection.execute("SELECT id FROM Produto WHERE empresa_id=? AND nome=? LIMIT 1", [empresaId, produto.nome]);
    if (existentes.length) {
      produtosDaCarga.push(existentes[0].id);
      ignorados += 1;
      continue;
    }
    const codigo = `22902${String(indice + 1).padStart(8, "0")}`;
    const [resultado] = await connection.execute(
      `INSERT INTO Produto (empresa_id,nome,idCategoria,precoFornecedor,preco,idFornecedor,quantidade,estoque_minimo,tipo_produto,unidade_base,codigo_barras,imagem,imagem_mime)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [empresaId, produto.nome, categorias.get(produto.categoria), produto.custo, produto.preco, fornecedores.get(produto.fornecedor), produto.quantidade, 5, produto.embalagem ? "multiplas" : "simples", produto.unidade, codigo, criarImagem(produto), "image/svg+xml"],
    );
    produtosDaCarga.push(resultado.insertId);
    if (produto.embalagem) {
      await connection.execute(
        "INSERT INTO ProdutoApresentacao (produto_id,nome,fator_conversao,preco,custo,codigo_barras,vendavel) VALUES (?,?,?,?,?,?,TRUE)",
        [resultado.insertId, produto.embalagem.nome, produto.embalagem.fator, produto.embalagem.preco, produto.embalagem.custo, `23902${String(indice + 1).padStart(8, "0")}`],
      );
    }
    inseridos += 1;
  }

  await connection.commit();
  const marcadores = produtosDaCarga.map(() => "?").join(",");
  const [[resumo]] = await connection.query(
    `SELECT COUNT(*) total, SUM(imagem IS NOT NULL) imagens,
      SUM(tipo_produto='multiplas') grosso, SUM(tipo_produto='simples') retalho
     FROM Produto WHERE id IN (${marcadores})`,
    produtosDaCarga,
  );
  const [[resumoApresentacoes]] = await connection.query(
    `SELECT COUNT(*) apresentacoes FROM ProdutoApresentacao WHERE produto_id IN (${marcadores})`,
    produtosDaCarga,
  );
  console.log(`Empresa: ${empresa.nome} (id=${empresaId})`);
  console.log(`Produtos inseridos: ${inseridos}; já existentes: ${ignorados}.`);
  console.log(`Validação: ${resumo.total} produtos, ${resumo.imagens} imagens, ${resumo.grosso} de grosso, ${resumo.retalho} de retalho e ${resumoApresentacoes.apresentacoes} apresentações.`);
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  connection.release();
  await pool.end();
}
