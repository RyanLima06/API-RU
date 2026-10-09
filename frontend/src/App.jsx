import { Routes, Route } from "react-router-dom";
import Home from "./pages/home/home.jsx";
import Recarga from "./pages/recarga/recarga.jsx";

export default function App() {
  return (
    <div className="pagina">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/recarga" element={<Recarga />} />
      </Routes>
    </div>
  );
}