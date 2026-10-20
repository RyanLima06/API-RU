import "dotenv/config";
import jwt from "jsonwebtoken";

export const verificarOperador = (req, res, next) => {
  const [tipo, token] = (req.get("Authorization") ?? "").split(" ");
  if (tipo !== "Bearer" || !token) {
    return res.status(401).json({ erro: "Não autenticado" });
  }
  try {
    const p = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
    req.operador = { id: p.sub, nome: p.nome };
    next();
  } catch {
    return res.status(401).json({ erro: "Sessão inválida ou expirada" });
  }
};