import type { ReactNode } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { GamePage } from "./pages/GamePage";
import { LoginPage } from "./pages/LoginPage";
import { AuthCallbackPage } from "./pages/AuthCallbackPage";
import { useAuth } from "./hooks/useAuth";

export function App() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage onLogin={() => navigate("/game")} />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
      <Route
        path="/game"
        element={
          <RequireAuth isAuthenticated={isAuthenticated} isLoading={isLoading}>
            <GamePage onLogout={() => navigate("/login")} />
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

type RequireAuthProps = {
  children: ReactNode;
  isAuthenticated: boolean;
  isLoading: boolean;
};

function RequireAuth({ children, isAuthenticated, isLoading }: RequireAuthProps) {
  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-sm font-semibold text-neutral-400">
        Carregando sessao...
      </main>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
