import { pool } from "../db.js";
import { Decimal } from "decimal.js";

const ausente = (v) => v === undefined || v === null || v === "";

export const recarga = async (req, res) => {
  try {
    const { matricula, valor, operador } = req.body;
    if (ausente(matricula))
      return res.status(400).json({ erro: "Campo 'matricula' é obrigatório" });
    if (ausente(valor))
      return res.status(400).json({ erro: "Campo 'valor' é obrigatório" });
    if (ausente(operador))
      return res.status(400).json({ erro: "Campo 'operador' é obrigatório" });

    if (typeof matricula !== "string" || !/^\d{11}$/.test(matricula)) {
      return res
        .status(400)
        .json({ erro: "Campo 'matricula' deve ter 11 dígitos" });
    }

    if (typeof operador !== "string" || operador.trim() === "") {
      return res.status(400).json({ erro: "Campo 'operador' é obrigatório" });
    }
    let valorRecarga;
    try {
      const valorFormatado = String(valor).replace(",", ".");
      valorRecarga = new Decimal(valorFormatado);

      if (valorRecarga.lte(0)) {
        return res
          .status(400)
          .json({ erro: "Campo 'valor' deve ser um número positivo" });
      }
    } catch {
      return res
        .status(400)
        .json({ erro: "Campo 'valor' deve ser um decimal válido" });
    }
    // transação para garantir que a atualização do saldo e a gravação do log sejam atômicas
    try {
      await pool.query("BEGIN");

      const [resultados] = await pool.execute(
        "SELECT saldo FROM saldos WHERE matricula = ? FOR UPDATE",
        [matricula]
      );

      if (resultados.length === 0) {
        await pool.query("ROLLBACK");
        return res.status(404).json({ message: "Matrícula não encontrada" });
      }

      const saldoAnterior = new Decimal(resultados[0].saldo);
      const saldoDepois = saldoAnterior.plus(valorRecarga);

      const strSaldoAnterior = saldoAnterior.toFixed(2);
      const strSaldoDepois = saldoDepois.toFixed(2);
      const strValorRecarga = valorRecarga.toFixed(2);

      // Atualiza o saldo
      await pool.execute("UPDATE saldos SET saldo = ? WHERE matricula = ?", [
        strSaldoDepois,
        matricula,
      ]);

      // Grava o log da alteração
      await pool.execute(
        "INSERT INTO logs_alteracoes (matricula, operador, tipo_alteracao, dados_anteriores, dados_novos, valor) VALUES (?, ?, 'recarga', ?, ?, ?)",
        [matricula, operador, strSaldoAnterior, strSaldoDepois, strValorRecarga]
      );

      const [logs] = await pool.execute(
        "SELECT * FROM logs_alteracoes WHERE matricula = ? ORDER BY realizado_em DESC LIMIT 1",
        [matricula]
      );

      // Confirma a transação
      await pool.query("COMMIT");

      return res.status(200).json({
        message: "Recarga realizada com sucesso",
        saldo: strSaldoDepois,
        logs: logs[0],
      });
    } catch (error) {
      // Garante o rollback de TUDO caso a atualização ou a gravação do log falhe
      await pool.query("ROLLBACK");
      console.error("Erro na transação de recarga:", error);
      return res
        .status(500)
        .json({ erro: "Erro interno do servidor ao processar banco de dados" });
    }
  } catch (error) {
    console.error("Erro geral ao processar recarga:", error);
    return res.status(500).json({ message: "Erro interno do servidor" });
  }
};