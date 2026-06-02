import { Banknote, CircleDollarSign } from "lucide-react";
import type { Wallet } from "../types/wallet";
import { formatCurrency } from "../utils/format";
import { Brand } from "./Brand";

type TopBarProps = {
  isWalletLoading: boolean;
  playerId: string;
  wallet: Wallet | null;
  onLogout: () => void;
};

export function TopBar({ isWalletLoading, playerId, wallet, onLogout }: TopBarProps) {
  return (
    <header className="flex flex-col gap-4 bg-black px-5 py-4 md:flex-row md:items-center md:justify-between md:px-8">
      <Brand />
      <div className="flex flex-wrap gap-3">
        <button
          className="flex items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2 text-sm font-semibold text-neutral-200 transition hover:border-neutral-600"
          onClick={onLogout}
        >
          <CircleDollarSign size={16} />
          {playerId}
        </button>
        <div className="flex items-center gap-2 rounded-lg border border-green-600 bg-green-950/20 px-4 py-2 text-sm text-neutral-200">
          <Banknote size={16} />
          Saldo:{" "}
          <strong className="min-w-24 text-green-400">
            {isWalletLoading || !wallet ? "Carregando..." : formatCurrency(wallet.balanceCents)}
          </strong>
        </div>
      </div>
    </header>
  );
}
