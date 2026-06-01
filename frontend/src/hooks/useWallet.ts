import { useCallback, useState } from "react";
import { createWallet, getWallet } from "../lib/api";
import type { Wallet } from "../types/wallet";

export function useWallet() {
  const [wallet, setWallet] = useState<Wallet | null>(null);

  const refreshWallet = useCallback(async () => {
    const currentWallet = await getWallet();
    setWallet(currentWallet);
  }, []);

  const ensureWallet = useCallback(async () => {
    await createWallet();
    await refreshWallet();
  }, [refreshWallet]);

  return {
    ensureWallet,
    refreshWallet,
    wallet,
  };
}
