import express, { Router } from "express";
import cors from "cors";
import { verificarChave } from "./middleweares/verificarChaveApi.js";
import { buscarSaldo } from "./controllers/SaldoAlunosController.js";
import { recarga } from "./controllers/RecargaController.js";
import { verificarOperador } from "./middleweares/verificarOperador.js";
import { login } from "./controllers/AuthController.js";
import rateLimit from "express-rate-limit";

export const router = Router();

const origemFrontend = process.env.FRONTEND_ORIGIN || "http://localhost:5173";

router.use(
  cors({
    origin: origemFrontend,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-API-Key"],
  })
);
/* Sugestão de segurança dada pela IA que eu aproveitei para integrar: Rate limiting por IP (10 consultas/minuto) com express-rate-limit,
para impedir que alguém varra matrículas em sequência (enumeração).*/

router.use(express.json({ limit: "10kb" }));
const limiteSaldo = rateLimit({
  windowMs: 60_000,
  limit: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { erro: "Muitas consultas. Tente novamente em instantes." },
});

const limiteLogin = rateLimit({
  windowMs: 15 * 60_000,
  limit: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { erro: "Muitas tentativas de login. Aguarde alguns minutos." },
});

// Sistemas (catraca/integrações): chave de API
router.post("/saldo", verificarChave, buscarSaldo);
router.post("/recarga", verificarChave, recarga);

// Web: estudante (público, com rate limit) e operador (login)
router.post("/web/saldo", limiteSaldo, buscarSaldo);
router.post("/web/login", limiteLogin, login);
router.post("/web/recarga", verificarOperador, recarga);