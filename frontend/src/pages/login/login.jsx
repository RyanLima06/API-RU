import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { login, getSessao } from "../../services/api.js";
import "../login/style.css";

export default function Login() {
  const navegar = useNavigate();
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(null);

  // Já logado: vai direto para a recarga
  if (getSessao()) return <Navigate to="/recarga" replace />;

  async function aoEnviar(evento) {
    evento.preventDefault();
    if (!usuario.trim() || !senha) {
      setErro("Informe usuário e senha.");
      return;
    }

    setCarregando(true);
    setErro(null);
    try {
      await login(usuario.trim(), senha);
      navegar("/recarga", { replace: true });
    } catch (e) {
      if (e.status === 429) {
        setErro("Muitas tentativas. Aguarde alguns minutos e tente de novo.");
      } else {
        setErro(e.message || "Não foi possível entrar agora.");
      }
      setSenha("");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <form className="cartao formulario" onSubmit={aoEnviar}>
      <h1>Acesso do operador</h1>
      <p className="legenda">Entre para registrar recargas.</p>

      <label className="campo-rotulo" htmlFor="usuario">
        Usuário
      </label>
      <input
        id="usuario"
        className="campo-matricula"
        type="text"
        autoComplete="username"
        autoFocus
        value={usuario}
        onChange={(e) => setUsuario(e.target.value)}
      />

      <label className="campo-rotulo" htmlFor="senha">
        Senha
      </label>
      <input
        id="senha"
        className="campo-matricula"
        type="password"
        autoComplete="current-password"
        value={senha}
        onChange={(e) => setSenha(e.target.value)}
      />

      {erro && <p className="mensagem-erro">{erro}</p>}

      <button type="submit" disabled={carregando}>
        {carregando ? "Entrando..." : "Entrar"}
      </button>

      <Link className="link-rodape" to="/">
        Voltar para consulta de saldo
      </Link>
    </form>
  );
}