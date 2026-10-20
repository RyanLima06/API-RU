import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { recarregar, logout, getSessao } from "../../services/api.js";

const RE_MATRICULA = /^\d{11}$/;

export default function Recarga() {
  const [sessao, setSessao] = useState(getSessao());
  const [matricula, setMatricula] = useState("");
  const [valor, setValor] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(null);
  const [sucesso, setSucesso] = useState(null);

 if (!sessao) return <Navigate to="/login" replace />;

  function sair() {
    logout();
    setSessao(null);
  }

  function validar() {
    if (!RE_MATRICULA.test(matricula)) return "Matrícula deve ter 11 dígitos.";
    const n = Number(valor);
    if (!valor || !Number.isFinite(n) || n <= 0) return "Informe um valor maior que zero.";
    return null;
  }

  async function aoEnviar(evento) {
    evento.preventDefault();
    setSucesso(null);
    const msg = validar();
    if (msg) return setErro(msg);

    setCarregando(true);
    setErro(null);
    try {
      const r = await recarregar(matricula, Number(valor));
      setSucesso(
        `Recarga registrada. Novo saldo: ${Number(r.saldo).toLocaleString("pt-BR", {
          style: "currency", currency: "BRL",
        })}`
      );
      setMatricula("");
      setValor("");
    } catch (e) {
      if (e.status === 401) {
        setSessao(null); // sessão expirou: volta para o login
      } else if (e.status === 404) {
        setErro("Matrícula não encontrada.");
      } else {
        setErro(e.message || "Não foi possível registrar a recarga agora.");
      }
    } finally {
      setCarregando(false);
    }
  }

  return (
    <form className="cartao formulario" onSubmit={aoEnviar}>
      <h1>Recarga</h1>
      <p className="legenda">
        Operador: <strong>{sessao.nome}</strong>{" "}
        <button type="button" onClick={sair}>Sair</button>
      </p>

      <label className="campo-rotulo" htmlFor="matricula">Matrícula do aluno</label>
      <input id="matricula" className="campo-matricula" type="text"
        inputMode="numeric" maxLength={11} placeholder="20251200001"
        value={matricula}
        onChange={(e) => setMatricula(e.target.value.replace(/\D/g, ""))} />

      <label className="campo-rotulo" htmlFor="valor">Valor da recarga (R$)</label>
      <input id="valor" className="campo-matricula" type="number"
        step="0.01" min="0.01" placeholder="20,00"
        value={valor} onChange={(e) => setValor(e.target.value)} />

      {erro && <p className="mensagem-erro">{erro}</p>}
      {sucesso && <p className="mensagem-sucesso">{sucesso}</p>}

      <button type="submit" disabled={carregando}>
        {carregando ? "Registrando..." : "Recarregar"}
      </button>
      <Link className="link-rodape" to="/">Voltar para consulta de saldo</Link>
    </form>
  );
}