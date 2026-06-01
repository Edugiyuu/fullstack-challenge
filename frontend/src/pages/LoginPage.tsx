import { useState } from "react";
import { Lock, Rocket, ShieldCheck } from "lucide-react";
import { createWallet } from "../lib/api";

type LoginPageProps = {
  onLogin: () => void;
};

export function LoginPage({ onLogin }: LoginPageProps) {
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogin() {
    setIsLoading(true);
    try {
      await createWallet();
      onLogin();
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="login-shell">
      <section className="login-card" aria-label="Login">
        <Rocket className="login-logo" size={58} strokeWidth={1.8} />
        <h1>Crash Game</h1>
        <p className="login-title">Bem-vindo ao Crash Game</p>
        <p className="login-copy">Faca login para comecar a jogar</p>
        <button className="primary-button login-button" onClick={handleLogin} disabled={isLoading}>
          <ShieldCheck size={18} />
          {isLoading ? "Entrando..." : "Entrar com Keycloak"}
        </button>
        <span className="secure-pill">
          <Lock size={14} />
          Conexao segura via OIDC
        </span>
      </section>
      <p className="login-footnote">Autenticacao segura atraves do Keycloak</p>
    </main>
  );
}
