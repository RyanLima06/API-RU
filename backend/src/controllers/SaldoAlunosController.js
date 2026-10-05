import { pool } from "../db.js";

const RE_MATRICULA = /^\d{11}$/;
const RE_DATA = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})?$/;

const ausente = (v) => v === undefined || v === null || v === "";

function paraDatetimeMySQL(texto) {
  if (typeof texto !== "string") return null;

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

//construção para aprecer a imagem na carteirinha.
function paraDataUri(bufferFoto) {
  if (!bufferFoto || bufferFoto.length === 0) return null;

  // Se já for string (Data URI)
  if (typeof bufferFoto === "string") {
    return bufferFoto.startsWith("data:") ? bufferFoto : `data:image/png;base64,${bufferFoto}`;
  }

  // Deteção do tipo de imagem por magic bytes
  const ehPNG = bufferFoto[0] === 0x89 && bufferFoto[1] === 0x50;
  const ehJPEG = bufferFoto[0] === 0xff && bufferFoto[1] === 0xd8;
  const tipo = ehPNG ? "image/png" : ehJPEG ? "image/jpeg" : "image/png";

  return `data:${tipo};base64,${bufferFoto.toString("base64")}`;
}

export const buscarSaldo = async (req, res) => {
  try {
    const { matricula, data } = req.body ?? {};
    if (ausente(matricula)) return res.status(400).json({ erro: "Campo 'matricula' é obrigatório" });
    if (ausente(data)) return res.status(400).json({ erro: "Campo 'data' é obrigatório" });
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

    //Converter ambas as datas para objetos Date válidos do JS
    const dataCliente = new Date(data);
    const dataFoto = aluno.foto_atualizada_em ? new Date(aluno.foto_atualizada_em) : null;
    const dataQr = aluno.qrcode_gerado_em ? new Date(aluno.qrcode_gerado_em) : null;

    // Se o cliente enviar EPOCA (1970) ou data antiga, fotoMudou será TRUE (isso para requisições vindas do frontend)
    const fotoMudou = dataFoto && dataFoto > dataCliente;
    const qrMudou = dataQr && dataQr > dataCliente;

    return res.json({
      matricula: aluno.matricula,
      nome: aluno.nome,
      saldo: aluno.saldo === null ? null : Number(aluno.saldo),
      DHAtualizacaoSaldo: transformarParaISO(aluno.saldo_atualizado_em),
      strQrCode: qrMudou ? aluno.qrcode : null,
      foto: fotoMudou ? paraDataUri(aluno.foto) : null,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ erro: "Erro interno" });
  }
};