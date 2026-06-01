import { Banknote, CircleDollarSign } from "lucide-react";
import { PLAYER_ID } from "../lib/config";
import type { Wallet } from "../types/wallet";
import { formatCurrency } from "../utils/format";
import { Brand } from "./Brand";

type TopBarProps = {
  wallet: Wallet | null;
  onLogout: () => void;
};

export function TopBar({ wallet, onLogout }: TopBarProps) {
  return (
    <header className="topbar">
      <Brand />
      <div className="account-bar">
        <button className="user-pill" onClick={onLogout}>
          <CircleDollarSign size={16} />
          {PLAYER_ID}
        </button>
        <div className="balance-pill">
          <Banknote size={16} />
          Saldo: <strong>{formatCurrency(wallet?.balanceCents ?? "0")}</strong>
        </div>
      </div>
    </header>
  );
}
