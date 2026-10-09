const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

const EPOCA = "2026-09-20T08:00:00";
const CHAVE_STORAGE = "ru_cracha";

export function lerCache() {
  try {
    const bruto = localStorage.getItem(CHAVE_STORAGE);
    return bruto ? JSON.parse(bruto) : null;
  } catch {
    return null;
  }
}

export function salvarCache(dados) {
  try {
    localStorage.setItem(CHAVE_STORAGE, JSON.stringify(dados));
  } catch {
    /* ignora */
  }
}

export function limparCache() {
  try {
    localStorage.removeItem(CHAVE_STORAGE);
  } catch {
    /* ignora */
  }
}

export function urlDaFoto(caminhoOuBase64) {
  if (!caminhoOuBase64) return null;
  if (caminhoOuBase64.startsWith("data:")) {
    return caminhoOuBase64;
  }
  return `${API_URL}/${caminhoOuBase64}`;
}

export async function buscarSaldo(matricula, cacheAnterior) {
  // Só considera o cache se for da MESMA matrícula digitada
  const MesmaMatricula = cacheAnterior?.matricula === matricula;
  const cacheValido = MesmaMatricula ? cacheAnterior : null;

  // Se for outro aluno, envia a EPOCA (1970) para forçar baixar a foto dele
  const data = cacheValido?.ultimaSincronizacao ?? EPOCA;

  const resposta = await fetch(`${API_URL}/web/saldo`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ matricula, data }),
  });

  const corpo = await resposta.json().catch(() => ({}));

  if (!resposta.ok) {
    const erro = new Error(corpo.erro || `Erro ${resposta.status}`);
    erro.status = resposta.status;
    throw erro;
  }

  // Se a API mandou null (nada mudou), mantém a foto/QR apenas se for o mesmo aluno
  const mesclado = {
    matricula: corpo.matricula,
    ultimaSincronizacao: new Date().toISOString().slice(0, 19),
    nome: corpo.nome,
    saldo: corpo.saldo,
    DHAtualizacaoSaldo: corpo.DHAtualizacaoSaldo,
    foto: corpo.foto ?? cacheValido?.foto ?? null,
    strQrCode: corpo.strQrCode ?? cacheValido?.strQrCode ?? null,
  };

  salvarCache(mesclado);
  return mesclado;
}

export async function recarregar(matricula, valor, operador) {
  const respostaRecarga = await fetch(`${API_URL}/web/recarga`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ matricula, valor, operador }),
  });
  const corpo = await respostaRecarga.json().catch(() => ({}));

  if (!respostaRecarga.ok) {
    const erro = new Error(corpo.erro || `Erro ${respostaRecarga.status}`);
    erro.status = respostaRecarga.status;
    throw erro;
  }
  const mesclar = {
    saldo: corpo.saldo,
    ultimaSincronizacao: new Date().toISOString().slice(0, 19),
  };
  return mesclar;
}