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

const migrations = await Promise.all(nomes.map(async (nome) => {
  const sql = await readFile(path.join(pastaSql, nome), "utf8");
  return {
    nome,
    sql,
    checksum: crypto.createHash("sha256").update(sql).digest("hex"),
  };
}));

const connection = await mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database,
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
    "Empresa", "Usuario", "Produto", "planos", "assinaturas", "pagamentos",
    "notificacoes", "recuperacao_senha", "AdministradorPlataforma",
    "tickets_suporte", "auditoria",
  ];
  const colunas = [
    ["Empresa", "bloqueada"], ["Empresa", "nuit"], ["Empresa", "email"],
    ["Empresa", "telefone"], ["Empresa", "endereco"], ["Empresa", "session_version"],
    ["Usuario", "token_version"], ["Produto", "estoque_minimo"],
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
    if (aplicada && aplicada.checksum !== migration.checksum) {
      throw new Error(`A migração já aplicada foi alterada: ${migration.nome}`);
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
