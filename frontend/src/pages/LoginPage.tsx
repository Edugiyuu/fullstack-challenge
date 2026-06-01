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
    <main className="flex min-h-screen flex-col items-center justify-center bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08),rgba(0,0,0,0)_30%),#171717] px-5 text-neutral-950">
      <section className="flex w-full max-w-420px flex-col items-center rounded-lg bg-white px-8 py-12 shadow-[0_28px_80px_rgba(0,0,0,0.45)]" aria-label="Login">
        <Rocket className="mb-4 text-green-500" size={58} strokeWidth={1.8} />
        <h1 className="text-3xl font-black">Crash Game</h1>
        <p className="mt-8 text-xl font-semibold">Bem-vindo ao Crash Game</p>
        <p className="mt-5 text-sm text-neutral-500">Faca login para comecar a jogar</p>
        <button
          className="mt-8 flex h-12 w-full max-w-280px items-center justify-center gap-2 rounded-lg bg-green-500 px-4 text-sm font-bold text-white transition hover:bg-green-400 disabled:cursor-not-allowed disabled:bg-neutral-300"
          onClick={handleLogin}
          disabled={isLoading}
        >
          <ShieldCheck size={18} />
          {isLoading ? "Entrando..." : "Entrar com Keycloak"}
        </button>
        <span className="mt-7 flex items-center gap-2 rounded-md bg-neutral-100 px-4 py-3 text-xs font-semibold text-green-700">
          <Lock size={14} />
          Conexao segura via OIDC
        </span>
      </section>
      <p className="mt-8 text-sm text-neutral-500">Autenticacao segura atraves do Keycloak</p>
    </main>
  );
}
