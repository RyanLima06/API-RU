import { useState } from "react";
import  { Link }  from "react-router-dom";
import { recarregar } from "../../api.js";

const RE_MATRICULA = /^\d{11}$/;

export default function Recarga() {
  const [matricula, setMatricula] = useState("");
  const [valor, setValor] = useState("");
  const [operador, setOperador] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(null);
  const [sucesso, setSucesso] = useState(null);

  function validar() {
    if (!RE_MATRICULA.test(matricula)) {
      return "Matrícula deve ter 11 dígitos.";
    }
    const numero = Number(valor);
    if (!valor || !Number.isFinite(numero) || numero <= 0) {
      return "Informe um valor de recarga maior que zero.";
    }
    if (!operador.trim()) {
      return "Informe o nome do operador.";
    }
    return null;
  }

  async function aoEnviar(evento) {
    evento.preventDefault();
    setSucesso(null);

    const mensagemValidacao = validar();
    if (mensagemValidacao) {
      setErro(mensagemValidacao);
      return;
    }

    setCarregando(true);
    setErro(null);
    try {
      const resultado = await recarregar(matricula, Number(valor), operador.trim());
      setSucesso(
        `Recarga registrada. Novo saldo: ${Number(resultado.saldo).toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        })}`
      );
      // Limpa só matrícula e valor; o operador costuma fazer várias
      // recargas seguidas, então o nome dele fica preenchido.
      setMatricula("");
      setValor("");
    } catch (e) {
      if (e.status === 404) {
        setErro("Matrícula não encontrada.");
      } else if (e.status === 401) {
        setErro("Chave de API inválida.");
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
      <p className="legenda">Preencha os dados para creditar saldo na matrícula.</p>

      <label className="campo-rotulo" htmlFor="matricula">
        Matrícula do aluno
      </label>
      <input
        id="matricula"
        className="campo-matricula"
        type="text"
        inputMode="numeric"
        maxLength={11}
        placeholder="20251200001"
        value={matricula}
        onChange={(e) => setMatricula(e.target.value.replace(/\D/g, ""))}
      />

      <label className="campo-rotulo" htmlFor="valor">
        Valor da recarga (R$)
      </label>
      <input
        id="valor"
        className="campo-matricula"
        type="number"
        step="0.01"
        min="0.01"
        placeholder="20,00"
        value={valor}
        onChange={(e) => setValor(e.target.value)}
      />

      <label className="campo-rotulo" htmlFor="operador">
        Nome do operador
      </label>
      <input
        id="operador"
        className="campo-matricula"
        type="text"
        placeholder="Nome do operador"
        value={operador}
        onChange={(e) => setOperador(e.target.value)}
      />

      {erro && <p className="mensagem-erro">{erro}</p>}
      {sucesso && <p className="mensagem-sucesso">{sucesso}</p>}

      <button type="submit" disabled={carregando}>
        {carregando ? "Registrando..." : "Recarregar"}
      </button>

      <Link className="link-rodape" to="/">
        Voltar para consulta de saldo
      </Link>
    </form>
  );
}