import express, { Router } from "express";
import cors from "cors";
import { verificarChave } from "./middleweares/verificarChaveApi.js";
import { buscarSaldo } from "./controllers/SaldoAlunosController.js";

export const router = Router();

const origemFrontend = process.env.FRONTEND_ORIGIN || "http://localhost:5173";

router.use(
  cors({
    origin: origemFrontend,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-API-Key"],
  })
);

router.use(express.json());

router.post("/saldo", verificarChave, buscarSaldo);
//essa é outra rota para proteger/esconder a chave da api 
router.post("/web/saldo", buscarSaldo);