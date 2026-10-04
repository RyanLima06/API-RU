import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mysql from "mysql2/promise";
import "dotenv/config";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurações da conexão direta (com suporte a múltiplos comandos SQL)
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_SETUP_USER,
  password: process.env.DB_SETUP_PASS,
  multipleStatements: true, // Necessário para executar arquivos .sql com vários comandos
};

async function rodarSetup() {
  let conexao;
  try {
    console.log(" Conectando ao MySQL");
    conexao = await mysql.createConnection(dbConfig);

    // Ajuste os caminhos caso seus arquivos .sql estejam em outro local
    // (Por padrão considera que schema.sql e seed.sql estão na raiz do projeto)
    const caminhoSchema = path.resolve(__dirname, "../../src/models/ruTeste.schema.sql");
    const caminhoSeed = path.resolve(__dirname, "../../src/models/ruTeste.seeds.sql");

    console.log(" Criando banco e tabelas (schema.sql)...");
    const sqlSchema = await fs.readFile(caminhoSchema, "utf-8");
    await conexao.query(sqlSchema);
    console.log(" Schema executado com sucesso!");

    console.log(" Populando banco de dados (seed.sql)...");
    const sqlSeed = await fs.readFile(caminhoSeed, "utf-8");
    await conexao.query(sqlSeed);
    console.log(" Seed executado com sucesso!");

    console.log(" Banco de dados resetado e pronto para uso!");
  } catch (erro) {
    console.error(" Erro durante o setup do banco de dados:", erro.message);
    process.exit(1);
  } finally {
    if (conexao) await conexao.end();
  }
}

rodarSetup();