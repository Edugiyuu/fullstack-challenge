import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { GamePage } from "./pages/GamePage";
import { LoginPage } from "./pages/LoginPage";

export function App() {
  const navigate = useNavigate();

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage onLogin={() => navigate("/game")} />} />
      <Route path="/game" element={<GamePage onLogout={() => navigate("/login")} />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
