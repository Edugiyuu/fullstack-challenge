import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

export function AuthCallbackPage() {
  const { completeLogin } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    completeLogin()
      .then(() => navigate("/game", { replace: true }))
      .catch((callbackError: unknown) => {
        setError(callbackError instanceof Error ? callbackError.message : "Falha ao concluir login.");
      });
  }, [completeLogin, navigate]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-5 text-white">
      <section className="flex w-full max-w-[420px] flex-col items-center rounded-lg border border-neutral-800 bg-neutral-950 px-8 py-10 text-center">
        <ShieldCheck className={error ? "text-red-500" : "text-green-500"} size={44} />
        <h1 className="mt-5 text-2xl font-black">{error ? "Login nao concluido" : "Concluindo login"}</h1>
        <p className="mt-3 text-sm text-neutral-400">{error ?? "Validando retorno do Keycloak..."}</p>
      </section>
    </main>
  );
}
