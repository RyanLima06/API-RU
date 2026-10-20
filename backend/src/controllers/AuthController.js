import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../db.js";

// Hash falso: o tempo de resposta é o mesmo com usuário existente ou não
const HASH_FALSO = bcrypt.hashSync("senha-falsa", 12);

export const login = async (req, res) => {
  try {
    const { usuario, senha } = req.body ?? {};
    if (typeof usuario !== "string" || typeof senha !== "string" || !usuario || !senha) {
      return res.status(400).json({ erro: "Informe usuário e senha" });
    }

    const [linhas] = await pool.execute(
      "SELECT id, nome, senha_hash FROM operadores WHERE usuario = ? AND ativo = 1",
      [usuario]
    );
    const op = linhas[0];
    const ok = await bcrypt.compare(senha, op?.senha_hash ?? HASH_FALSO);

    if (!op || !ok) {
      return res.status(401).json({ erro: "Usuário ou senha inválidos" });
    }

    const token = jwt.sign({ nome: op.nome }, process.env.JWT_SECRET, {
      subject: String(op.id),
      expiresIn: "8h",
      algorithm: "HS256",
    });

    return res.json({ token, nome: op.nome });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ erro: "Erro interno" });
  }
};