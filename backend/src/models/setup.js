import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import "dotenv/config";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_SETUP_USER,
  password: process.env.DB_SETUP_PASS,
  multipleStatements: true,
};

// Lê o .sql e troca o placeholder {{DB_PASS}} pela senha do .env,
async function lerSql(caminho, conexao, senhaApp) {
  const bruto = await fs.readFile(caminho, "utf-8");
  const sql = bruto.replaceAll("{{DB_PASS}}", () => conexao.escape(senhaApp));
  if (sql.includes("{{")) {
    throw new Error(`Placeholder não resolvido em ${path.basename(caminho)}`);
  }
  return sql;
}

async function rodarSetup() {
  let conexao;
  try {
    const senhaApp = process.env.DB_PASS;
    if (!senhaApp || senhaApp.length < 8) {
      throw new Error("DB_PASS não definida (ou menor que 8 caracteres) no .env");
    }

    console.log(" Conectando ao MySQL");
    conexao = await mysql.createConnection(dbConfig);

    const caminhoSchema = path.resolve(__dirname, "../../src/models/ruTeste.schema.sql");
    const caminhoSeed = path.resolve(__dirname, "../../src/models/ruTeste.seeds.sql");

    console.log(" Criando banco e tabelas (schema.sql)...");
    await conexao.query(await lerSql(caminhoSchema, conexao, senhaApp));
    console.log(" Schema executado com sucesso!");

    console.log(" Populando banco de dados (seed.sql)...");
    await conexao.query(await lerSql(caminhoSeed, conexao, senhaApp));
    console.log(" Seed executado com sucesso!");

    // Operador inicial (senha vem do .env, nunca do seed.sql)
    const { ADMIN_USUARIO, ADMIN_NOME, ADMIN_SENHA } = process.env;
    if (ADMIN_USUARIO && ADMIN_SENHA) {
      if (ADMIN_SENHA.length < 8) {
        throw new Error("ADMIN_SENHA deve ter pelo menos 8 caracteres");
      }
      console.log(" Criando operador inicial...");
      const hash = await bcrypt.hash(ADMIN_SENHA, 12);
      await conexao.execute(
        "INSERT INTO operadores (usuario, nome, senha_hash) VALUES (?, ?, ?)",
        [ADMIN_USUARIO, ADMIN_NOME || ADMIN_USUARIO, hash]
      );
      console.log(` Operador '${ADMIN_USUARIO}' criado!`);
    } else {
      console.log(" ADMIN_USUARIO/ADMIN_SENHA não definidos: nenhum operador criado.");
      console.log(' Use: node src/criarOperador.js <usuario> "<Nome>" <senha>');
    }

    console.log(" Banco de dados resetado e pronto para uso!");
  } catch (erro) {
    console.error(" Erro durante o setup do banco de dados:", erro.message);
    process.exit(1);
  } finally {
    if (conexao) await conexao.end();
  }
}
rodarSetup();