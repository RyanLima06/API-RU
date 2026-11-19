import "dotenv/config";
import express from "express";
import { router } from "./routes.js";
import { verificarChave } from "./middleweares/verificarChaveApi.js";
const app = express();
app.set("trust proxy", 1); // <-- Coloque aqui no appRU.js!
const PORT = 8080;


if(!process.env.API_KEY){
  console.error("Chave da API não está definida no .env");
  res.status(500).json({ error: "Erro interno" });
}

app.use(router);

app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "JSON inválido" });
  }
  console.error(err);
  res.status(500).json({ error: "Erro interno" });
});

  app.listen(PORT, "0.0.0.0", () => console.log(`Servidor rodando na porta ${PORT}`));