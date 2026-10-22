import "dotenv/config";
import bcrypt from "bcryptjs";
import mysql from "mysql2/promise";

const [usuario, nome, senha] = process.argv.slice(2);
if (!usuario || !nome || !senha || senha.length < 8) {
  console.error('Uso: npm run criar-operador -- <usuario> "<Nome>" <senha (mín. 8)>');
  process.exit(1);
}

let conexao;
try {
  conexao = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_SETUP_USER,
    password: process.env.DB_SETUP_PASS,
    database: process.env.DB_NAME || "ru_teste",
  });

  const hash = await bcrypt.hash(senha, 12);
  await conexao.execute(
    "INSERT INTO operadores (usuario, nome, senha_hash) VALUES (?, ?, ?)",
    [usuario, nome, hash]
  );
  console.log("Operador criado:", usuario);
} catch (error) {
  if (error.code === "ER_DUP_ENTRY") {
    console.error(`O usuário '${usuario}' já existe.`);
  } else {
    console.error("Erro ao criar operador:", error.message);
  }
  process.exit(1);
} finally {
  if (conexao) await conexao.end();
}