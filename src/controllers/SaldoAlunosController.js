import { pool } from "../db.js";

const RE_MATRICULA = /^\d{11}$/;
const RE_DATA = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,6})?$/;

const ausente = (v) => v === undefined || v === null || v === "";

function paraDatetimeMySQL(texto) {
  const m = RE_DATA.exec(texto);
  if (!m) return null;

  const [ano, mes, dia, h, min, s] = m.slice(1, 7).map(Number);
  const d = new Date(Date.UTC(ano, mes - 1, dia, h, min, s));
  const existe =
    d.getUTCFullYear() === ano &&
    d.getUTCMonth() === mes - 1 &&
    d.getUTCDate() === dia &&
    d.getUTCHours() === h &&
    d.getUTCMinutes() === min &&
    d.getUTCSeconds() === s;

  return existe ? `${m[1]}-${m[2]}-${m[3]} ${m[4]}:${m[5]}:${m[6]}` : null;
}

const transformarParaISO = (dt) => (dt ? dt.replace(" ", "T") : null);

export const buscarSaldo = async (req, res) => {
  try {
    const { matricula, data } = req.body ?? {};

    if (ausente(matricula)) {
      return res.status(400).json({ erro: "Campo 'matricula' é obrigatório" });
    }
    if (ausente(data)) {
      return res.status(400).json({ erro: "Campo 'data' é obrigatório" });
    }
    if (typeof matricula !== "string" || !RE_MATRICULA.test(matricula)) {
      return res.status(400).json({ erro: "Campo 'matricula' deve ter 11 dígitos" });
    }

    const desde = typeof data === "string" ? paraDatetimeMySQL(data) : null;
    if (!desde) {
      return res.status(400).json({
        erro: "Campo 'data' em formato inválido (use ISO 8601, ex.: 2026-09-20T08:00:00)",
      });
    }
    const [linhas] = await pool.execute(
      `SELECT a.matricula,
              a.nome,
              a.foto,
              a.foto_atualizada_em,
              s.saldo,
              s.atualizado_em AS saldo_atualizado_em,
              q.codigo        AS qrcode,
              q.gerado_em     AS qrcode_gerado_em
       FROM alunos a
       LEFT JOIN saldos  s ON s.matricula = a.matricula
       LEFT JOIN qrcodes q ON q.id = (
         SELECT id FROM qrcodes
         WHERE matricula = a.matricula
         ORDER BY gerado_em DESC, id DESC
         LIMIT 1
       )
       WHERE a.matricula = ?`,
      [matricula]
    );

    if (linhas.length === 0) {
      return res.status(404).json({ erro: "Matrícula não encontrada" });
    }
    const aluno = linhas[0];

    const fotoMudou = aluno.foto_atualizada_em > desde;
    const qrMudou = aluno.qrcode_gerado_em != null && aluno.qrcode_gerado_em > desde;

    return res.json({
      matricula: aluno.matricula,
      nome: aluno.nome,
      saldo: aluno.saldo === null ? null : Number(aluno.saldo),
      DHAtualizacaoSaldo: transformarParaISO(aluno.saldo_atualizado_em),
      strQrCode: qrMudou ? aluno.qrcode : null,
      foto: fotoMudou ? aluno.foto : null,  
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ erro: "Erro interno" });
  }
};