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

async function rodarSetup() {
  let conexao;
  try {
    console.log(" Conectando ao MySQL");
    conexao = await mysql.createConnection(dbConfig);

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
      console.log(" Use: npm run criar-operador -- <usuario> \"<Nome>\" <senha>");
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