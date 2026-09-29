import { useState } from "react";

export default function App() {
  const [contador, setContador] = useState(0);

  return (
    <div style={{ textAlign: "center", marginTop: "80px" }}>
      <h1>Minha primeira página em React</h1>
      <p>Você clicou {contador} vezes.</p>
      <button onClick={() => setContador(contador + 1)}>
        Clique aqui
      </button>
    </div>
  );
}