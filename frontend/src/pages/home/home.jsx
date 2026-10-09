import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import  { Link }  from "react-router-dom";
import { buscarSaldo, lerCache, limparCache, urlDaFoto } from "../../api.js";
import "./style.css";
export default function Home() {
  const [dados, setDados] = useState(() => lerCache());
  const [matriculaDigitada, setMatriculaDigitada] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(null);

  // Se já existe matrícula salva, sincroniza automaticamente ao abrir a página.
  useEffect(() => {
    if (dados?.matricula) {
      sincronizar(dados.matricula);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function sincronizar(matricula) {
    setCarregando(true);
    setErro(null);
    try {
      const atualizado = await buscarSaldo(matricula, lerCache());
      setDados(atualizado);
    } catch (e) {
      if (e.status === 404) {
        setErro("Matrícula não encontrada.");
        limparCache();
        setDados(null);
      } else if (e.status === 401) {
        setErro("Chave de API inválida. Confira o .env do frontend.");
      } else {
        setErro(e.message || "Não foi possível consultar o saldo agora.");
      }
    } finally {
      setCarregando(false);
    }
  }

  function aoEnviarFormulario(evento) {
    evento.preventDefault();
    const matricula = matriculaDigitada.trim();
    if (!/^\d{11}$/.test(matricula)) {
      setErro("Digite uma matrícula com 11 dígitos.");
      return;
    }
    sincronizar(matricula);
  }

  function trocarAluno() {
    limparCache();
    setDados(null);
    setMatriculaDigitada("");
    setErro(null);
  }

  return (
    <div className="pagina">
      {dados ? (
        <Cracha
          dados={dados}
          carregando={carregando}
          erro={erro}
          onAtualizar={() => sincronizar(dados.matricula)}
          onTrocar={trocarAluno}
        />
      ) : (
        <FormularioMatricula
          valor={matriculaDigitada}
          onMudar={setMatriculaDigitada}
          onEnviar={aoEnviarFormulario}
          carregando={carregando}
          erro={erro}
        />
      )}
    </div>
  );
}

function FormularioMatricula({ valor, onMudar, onEnviar, carregando, erro }) {
  return (
    <form className="cartao formulario" onSubmit={onEnviar}>
      <h1>Crachá do RU</h1>
      <p className="legenda">Digite sua matrícula para carregar seu crachá.</p>
      <input
        className="campo-matricula"
        type="text"
        inputMode="numeric"
        maxLength={11}
        placeholder="20251200001"
        value={valor}
        onChange={(e) => onMudar(e.target.value.replace(/\D/g, ""))}
      />
      {erro && <p className="mensagem-erro">{erro}</p>}
      <button type="submit" disabled={carregando}>
        {carregando ? "Consultando..." : "Consultar"}
      </button>
    </form>
  );
}

function Cracha({ dados, carregando, erro, onAtualizar, onTrocar }) {
  const foto = urlDaFoto(dados.foto);

  return (
    <div className="cartao cracha">
      <div className="cracha-topo">
        <div className="cracha-foto">
          {foto ? (
            <img src={foto} alt={`Foto de ${dados.nome}`} /> //  Usar 'foto' processada
          ) : (
            <div className="cracha-foto-vazia" aria-hidden="true" />
          )}
        </div>
        <div className="cracha-identificacao">
          <span className="rotulo">Restaurante Universitário</span>
          <h1 className="cracha-nome">{dados.nome}</h1>
          <span className="cracha-matricula">{dados.matricula}</span>
        </div>
      </div>

      <div className="cracha-saldo">
        <span className="rotulo">Saldo disponível</span>
        <span className="cracha-saldo-valor">
          {Number(dados.saldo).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          })}
        </span>
      </div>

      <div className="linha-corte" aria-hidden="true" />

      <div className="cracha-qrcode">
        {dados.strQrCode ? (
          <QRCodeSVG value={dados.strQrCode} size={168} bgColor="transparent" fgColor="#ffffff" />
        ) : (
          <p className="mensagem-erro">Nenhum QR code disponível ainda.</p>
        )}
      </div>

      {erro && <p className="mensagem-erro">{erro}</p>}

      <div className="cracha-acoes">
        <button type="button" onClick={onAtualizar} disabled={carregando}>
          {carregando ? "Atualizando..." : "Atualizar"}
        </button>
        <button type="button" className="botao-secundario" onClick={onTrocar}>
          Trocar matrícula
        </button>
      </div>
      <div>
          <Link className="link-rodape" to="/recarga">
            Recarregar saldo
          </Link>
      </div>
    </div>
  );
}