const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

// Data usada quando ainda não existe sincronização anterior: força a API
// a devolver foto e QR code na primeira consulta.
const EPOCA = "1970-01-01T00:00:00";

const CHAVE_STORAGE = "ru_cracha";

// Formato salvo no localStorage:
// { matricula, ultimaSincronizacao, nome, saldo, DHAtualizacaoSaldo, foto, strQrCode }
export function lerCache() {
  try {
    const bruto = localStorage.getItem(CHAVE_STORAGE);
    return bruto ? JSON.parse(bruto) : null;
    console.log("Cache lido:", bruto);
  } catch {
    // localStorage indisponível (modo privado, por exemplo) ou JSON corrompido
    return null;
  }
}

export function salvarCache(dados) {
  try {
    localStorage.setItem(CHAVE_STORAGE, JSON.stringify(dados));
  } catch {
    // se não der para gravar, a próxima consulta simplesmente baixa tudo de novo
  }
}

export function limparCache() {
  try {
    localStorage.removeItem(CHAVE_STORAGE);
  } catch {
    /* ignora */
  }
}

// Monta a URL completa da foto (o backend devolve um caminho relativo, ex.: "fotos/xxx.jpg")
export function urlDaFoto(caminhoRelativo) {
  if (!caminhoRelativo) return null;
  return `${API_URL}/${caminhoRelativo}`;
}

export async function buscarSaldo(matricula, cacheAnterior) {
  const data = cacheAnterior?.ultimaSincronizacao ?? EPOCA;

  // Rota sem chave: quem exige "X-API-Key" é só "/saldo", usada por
  // ferramentas externas. O front nunca guarda nem envia a chave.
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

  // foto e strQrCode só vêm quando mudaram; senão a API manda null e
  // a gente mantém o que já estava salvo do celular/navegador.
  const mesclado = {
    matricula: corpo.matricula,
    ultimaSincronizacao: new Date().toISOString().slice(0, 19),
    nome: corpo.nome,
    saldo: corpo.saldo,
    DHAtualizacaoSaldo: corpo.DHAtualizacaoSaldo,
    foto: corpo.foto ?? cacheAnterior?.foto ?? null,
    strQrCode: corpo.strQrCode ?? cacheAnterior?.strQrCode ?? null,
  };

  salvarCache(mesclado);
  return mesclado;
}