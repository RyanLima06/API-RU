import "dotenv/config";
import crypto from "node:crypto";
const hash = (valor) => crypto.createHash("sha256").update(String(valor)).digest();

export const verificarChave = (req, res, next) => {
  const chaveEsperada = process.env.API_KEY ;

  if (!chaveEsperada) {
    console.error("API_KEY não está definida no .env");
    return res.status(500).json({ erro: "Erro interno" });
  }

  const recebida = req.get("X-API-Key");

  if (!recebida || !crypto.timingSafeEqual(hash(recebida), hash(chaveEsperada))) {
    return res.status(401).json({ erro: "Chave de API inválida" });
  }

  next();
};