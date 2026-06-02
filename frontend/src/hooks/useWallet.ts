import { useCallback, useState } from "react";
import { createWallet, getWallet } from "../lib/api";
import type { Wallet } from "../types/wallet";

export function useWallet() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshWallet = useCallback(async () => {
    try {
      const currentWallet = await getWallet();
      setWallet(currentWallet);
      setError(null);
    } catch (refreshError) {
      setWallet(null);
      setError(refreshError instanceof Error ? refreshError : new Error("Erro ao carregar carteira."));
      throw refreshError;
    }
  }, []);

  const ensureWallet = useCallback(async () => {
    setIsLoading(true);
    try {
      await createWallet();
      await refreshWallet();
      setError(null);
    } catch (ensureError) {
      setWallet(null);
      setError(ensureError instanceof Error ? ensureError : new Error("Erro ao carregar carteira."));
      throw ensureError;
    } finally {
      setIsLoading(false);
    }
  }, [refreshWallet]);

  return {
    ensureWallet,
    error,
    isLoading,
    refreshWallet,
    wallet,
  };
}
