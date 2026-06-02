import { useCallback, useState } from "react";
import { createWallet, getWallet } from "../lib/api";
import type { Wallet } from "../types/wallet";

export function useWallet() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshWallet = useCallback(async () => {
    const currentWallet = await getWallet();
    setWallet(currentWallet);
  }, []);

  const ensureWallet = useCallback(async () => {
    setIsLoading(true);
    try {
      await createWallet();
      await refreshWallet();
    } finally {
      setIsLoading(false);
    }
  }, [refreshWallet]);

  return {
    ensureWallet,
    isLoading,
    refreshWallet,
    wallet,
  };
}
