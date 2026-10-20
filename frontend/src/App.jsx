import { Routes, Route } from "react-router-dom";
import Home from "./pages/home/home.jsx";
import Recarga from "./pages/recarga/recarga.jsx";
import Login from "./pages/login/login.jsx";

export default function App() {
  return (
    <div className="pagina">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/recarga" element={<Recarga />} />
      </Routes>
    </div>
  );
}