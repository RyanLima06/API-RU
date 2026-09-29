import "dotenv/config";
import express from "express";
import { router } from "./routes.js";

const app = express();
const PORT = 3000;

app.use(router);

app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ erro: "JSON inválido" });
  }
  console.error(err);
  res.status(500).json({ erro: "Erro interno" });
});

app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));