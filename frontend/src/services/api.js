const API_URL = import.meta.env.VITE_API_URL;
const CHAVE_TOKEN = "ru_operador";

const EPOCA = "2026-09-20T08:00:00";
const CHAVE_STORAGE = "ru_cracha";

export const getSessao = () => {
  try { return JSON.parse(sessionStorage.getItem(CHAVE_TOKEN)); } catch { return null; }
};
const salvarSessao = (s) => sessionStorage.setItem(CHAVE_TOKEN, JSON.stringify(s));
export const logout = () => sessionStorage.removeItem(CHAVE_TOKEN);

async function requisitar(caminho, opcoes = {}) {
  const headers = {
    ...(opcoes.body ? { "Content-Type": "application/json" } : {}),
    ...opcoes.headers,
  };
  const sessao = getSessao();
  if (sessao?.token) headers.Authorization = `Bearer ${sessao.token}`;

  const resposta = await fetch(`${API_URL}${caminho}`, { ...opcoes, headers });
  const corpo = await resposta.json().catch(() => ({}));

  if (!resposta.ok) {
    if (resposta.status === 401 && sessao) logout(); // sessão expirou
    const erro = new Error(corpo.erro || `Erro ${resposta.status}`);
    erro.status = resposta.status;
    throw erro;
  }
  return corpo;
}

export async function login(usuario, senha) {
  const corpo = await requisitar("/web/login", {
    method: "POST",
    body: JSON.stringify({ usuario, senha }),
  });
  salvarSessao({ token: corpo.token, nome: corpo.nome });
  return corpo;
}

// recarregar: o operador sai da assinatura
export async function recarregarOperador(matricula, valor) {
  const corpo = await requisitar("/web/recarga", {
    method: "POST",
    body: JSON.stringify({ matricula, valor }),
  });
  return {
    saldo: corpo.saldo,
    ultimaSincronizacao: new Date().toISOString().slice(0, 19),
  };
}
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
  const mesmaMatricula = cacheAnterior?.matricula === matricula;
  const cacheValido = mesmaMatricula ? cacheAnterior : null;
  const data = cacheValido?.ultimaSincronizacao ?? EPOCA;

  const corpo = await requisitar("/web/saldo", {
    method: "POST",
    body: JSON.stringify({ matricula, data }),
  });

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
  const corpo = await requisitar("/web/recarga", {
    method: "POST",
    body: JSON.stringify({ matricula, valor, operador }),
  });

  return {
    saldo: corpo.saldo,
    ultimaSincronizacao: new Date().toISOString().slice(0, 19),
  };
}
