import { pool } from "../db.js";

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
    if (typeof valor !== "number" || valor <= 0) {
      return res
        .status(400)
        .json({ erro: "Campo 'valor' deve ser um número positivo" });
    }
    if (typeof operador !== "string" || operador.trim() === "") {
      return res.status(400).json({ erro: "Campo 'operador' é obrigatório" });
    }

    try {
      await pool.query("BEGIN");

      const [resultados] = await pool.execute(
        "SELECT saldo FROM saldos WHERE matricula = ? FOR UPDATE",
        [matricula],
      );
      
      if (resultados.length === 0) {
        await pool.query("ROLLBACK"); // Cancela a transação se não achar a matrícula
        return res.status(404).json({ message: "Matrícula não encontrada" });
      }
      
      const valorRecarga = parseInt(valor);
      const saldoAnterior = parseInt(resultados[0].saldo);
      const saldoDepois = saldoAnterior + valorRecarga;

      await pool.execute("UPDATE saldos SET saldo = ? WHERE matricula = ?", 
        [saldoDepois, matricula]);

      await pool.execute(
        "INSERT INTO logs_alteracoes (matricula, operador, tipo_alteracao, dados_anteriores, dados_novos, valor) VALUES (?, ?, 'recarga', ?, ?, ?)",
        [matricula, operador, saldoAnterior, saldoDepois, valorRecarga],
      );

      const logs = await pool.execute(
        "SELECT * FROM logs_alteracoes WHERE matricula = ? ORDER BY realizado_em DESC LIMIT 1",
        [matricula],
      );

      // Retorna a resposta de sucesso aqui dentro, onde as variáveis existem
      return res.status(200).json({ 
        message: "Recarga realizada com sucesso", 
        saldo: saldoDepois, // Usa a variável que já tem o valor somado correto
        logs: logs[0][0] // Retorna o log da recarga realizada
      });

    } catch (error) {
      // Se der qualquer erro no processo do banco, desfaz o que foi feito
      await pool.query("ROLLBACK");
      console.error("Erro na transação de recarga:", error);
      return res.status(500).json({ erro: "Erro interno do servidor ao processar banco de dados" });
    }

  } catch (error) {
    console.error("Erro geral ao processar recarga:", error);
    return res.status(500).json({ message: "Erro interno do servidor" });
  }
};
