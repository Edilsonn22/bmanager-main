import crypto from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import mysql from "mysql2/promise";

dotenv.config();

const modo = process.argv[2] || "up";
const modosValidos = new Set(["up", "status", "baseline"]);
if (!modosValidos.has(modo)) {
  console.error("Uso: node scripts/migrarBanco.js [up|status|baseline]");
  process.exit(1);
}

const database = process.env.DB_NAME || "bmanager";
const bancosProtegidos = new Set(["information_schema", "mysql", "performance_schema", "sys"]);
if (bancosProtegidos.has(database.toLowerCase())) {
  throw new Error(`Migrações recusadas no banco de sistema: ${database}`);
}

const pastaSql = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../sql");
const nomes = (await readdir(pastaSql))
  .filter((nome) => /^\d+_[\w-]+\.sql$/i.test(nome))
  .sort((a, b) => a.localeCompare(b, "en", { numeric: true }));

const calcularChecksum = (conteudo) => crypto.createHash("sha256").update(conteudo).digest("hex");

// Estas duas migrações foram publicadas em duas versões antes da adoção da
// regra de imutabilidade. Os hashes ficam explícitos para reconhecer somente
// essas versões históricas já aplicadas, sem aceitar alterações arbitrárias.
const checksumsHistoricos = {
  "005_operacao_saas.sql": [
    "bb760fac9368ff1319d9a8c6c5f78257ce0b05d831d5601969d16937b687d7bd",
    "6b59d8368320cd593faaa2fc2fb68505a59ce3e821a3d44adc37e7a28b37393a",
    "0f182f41df9a35ed7b9a6f97e599c4b51f74133bd3ddc97a11db1233d074eabe",
  ],
  "011_vendas_clientes_caixa.sql": [
    "15534d13e270d8af32325745853989a61e89e95431b31ed19652c614bddee372",
    "e540b8581cd5453d360939af8a990a99f24aa4826b83ad8fc1b2981fd23b9cf6",
    "616662c1ceafb50f3ba99b171e9491403d42b93eb76da00619dfbe80176266a1",
  ],
};

const migrations = await Promise.all(nomes.map(async (nome) => {
  const sql = await readFile(path.join(pastaSql, nome), "utf8");
  const sqlNormalizado = sql.replace(/\r\n?/g, "\n");
  const checksumsAceitos = new Set([
    calcularChecksum(sql),
    calcularChecksum(sqlNormalizado),
    calcularChecksum(sqlNormalizado.replace(/\n/g, "\r\n")),
    ...(checksumsHistoricos[nome] || []),
  ]);
  return {
    nome,
    sql,
    // Novos registos usam LF como formato canónico, independentemente do SO.
    checksum: calcularChecksum(sqlNormalizado),
    checksumsAceitos,
  };
}));

const connection = await mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database,
  ...(process.env.DB_SSL === "true"
    ? { ssl: { minVersion: "TLSv1.2", rejectUnauthorized: true } }
    : {}),
  multipleStatements: true,
});

const lockName = `bmanager:migrations:${database}`;
let lockObtido = false;

const tabelaExiste = async (tabela) => {
  const [rows] = await connection.execute(
    "SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND LOWER(TABLE_NAME) = LOWER(?) LIMIT 1",
    [database, tabela],
  );
  return rows.length > 0;
};

const colunaExiste = async (tabela, coluna) => {
  const [rows] = await connection.execute(
    "SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND LOWER(TABLE_NAME) = LOWER(?) AND LOWER(COLUMN_NAME) = LOWER(?) LIMIT 1",
    [database, tabela, coluna],
  );
  return rows.length > 0;
};

const validarBaseline = async () => {
  const tabelas = [
    "Empresa", "Usuario", "AdministradorPlataforma", "Categoria", "Fornecedor",
    "Produto", "ProdutoApresentacao", "Movimentos", "Cliente", "CaixaSessao", "Venda", "VendaItem",
    "PagamentoVenda", "planos", "assinaturas", "pagamentos", "pagamento_eventos",
    "notificacoes", "recuperacao_senha", "tickets_suporte", "auditoria",
    "ScannerSessao", "ScannerCodigo",
  ];
  const colunas = [
    ["Empresa", "bloqueada"], ["Empresa", "nuit"], ["Empresa", "email"],
    ["Empresa", "telefone"], ["Empresa", "endereco"], ["Empresa", "session_version"],
    ["Usuario", "token_version"], ["Produto", "estoque_minimo"], ["Produto", "codigo_barras"],
    ["Produto", "tipo_produto"], ["Produto", "unidade_base"], ["Produto", "arquivado_em"],
    ["Movimentos", "preco_unitario"], ["Movimentos", "custo_unitario"],
    ["Movimentos", "origem"], ["Movimentos", "motivo"], ["Movimentos", "venda_id"],
    ["Venda", "cliente_nome"], ["VendaItem", "apresentacao_nome"],
    ["VendaItem", "fator_conversao"], ["VendaItem", "quantidade_base"],
    ["CaixaSessao", "caixa_aberto_empresa_id"],
    ["assinaturas", "cancelada_em"], ["assinaturas", "cancelamento_agendado_em"],
    ["assinaturas", "plano_pendente_id"], ["tickets_suporte", "estado"],
  ];

  const faltantes = [];
  for (const tabela of tabelas) if (!(await tabelaExiste(tabela))) faltantes.push(`tabela ${tabela}`);
  for (const [tabela, coluna] of colunas) {
    if (!(await colunaExiste(tabela, coluna))) faltantes.push(`coluna ${tabela}.${coluna}`);
  }
  if (faltantes.length) {
    throw new Error(`Baseline recusado. Estruturas ausentes: ${faltantes.join(", ")}`);
  }
};

try {
  const [[lock]] = await connection.execute("SELECT GET_LOCK(?, 10) AS obtido", [lockName]);
  if (lock.obtido !== 1) throw new Error("Outra execução de migrações está em andamento.");
  lockObtido = true;

  await connection.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      nome VARCHAR(255) NOT NULL,
      checksum CHAR(64) NOT NULL,
      executada_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (nome)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  const [rows] = await connection.query("SELECT nome, checksum, executada_em FROM schema_migrations ORDER BY nome");
  const aplicadas = new Map(rows.map((row) => [row.nome, row]));

  for (const migration of migrations) {
    const aplicada = aplicadas.get(migration.nome);
    if (aplicada && !migration.checksumsAceitos.has(aplicada.checksum)) {
      throw new Error(`A migração já aplicada foi alterada: ${migration.nome} (checksum registado: ${aplicada.checksum})`);
    }
  }

  if (modo === "status") {
    console.log(`Banco: ${database}`);
    for (const migration of migrations) {
      console.log(`${aplicadas.has(migration.nome) ? "aplicada" : "pendente"}  ${migration.nome}`);
    }
  } else if (modo === "baseline") {
    if (aplicadas.size > 0) throw new Error("Baseline recusado: já existem migrações registradas.");
    await validarBaseline();
    await connection.beginTransaction();
    try {
      for (const migration of migrations) {
        await connection.execute(
          "INSERT INTO schema_migrations (nome, checksum) VALUES (?, ?)",
          [migration.nome, migration.checksum],
        );
      }
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    }
    console.log(`Baseline concluído: ${migrations.length} migrações registradas sem executar SQL.`);
  } else {
    if (aplicadas.size === 0) {
      throw new Error("Base sem baseline. Em uma instalação nova, importe bmanager.sql; depois execute: npm run migrate:baseline");
    }

    const pendentes = migrations.filter((migration) => !aplicadas.has(migration.nome));
    for (const migration of pendentes) {
      console.log(`Aplicando ${migration.nome}...`);
      await connection.query(migration.sql);
      await connection.execute(
        "INSERT INTO schema_migrations (nome, checksum) VALUES (?, ?)",
        [migration.nome, migration.checksum],
      );
    }
    console.log(pendentes.length ? `${pendentes.length} migração(ões) aplicada(s).` : "Banco já está atualizado.");
  }
} finally {
  if (lockObtido) await connection.execute("SELECT RELEASE_LOCK(?)", [lockName]);
  await connection.end();
}
