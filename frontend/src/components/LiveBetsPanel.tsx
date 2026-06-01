import { CircleDollarSign, Users } from "lucide-react";
import type { LiveBet } from "../types/game";
import { formatCurrency, formatMultiplier } from "../utils/format";

type LiveBetsPanelProps = {
  liveBets: LiveBet[];
};

export function LiveBetsPanel({ liveBets }: LiveBetsPanelProps) {
  return (
    <section className="side-card">
      <div className="side-title">
        <Users size={18} />
        <h2>Apostas ao Vivo</h2>
        <span>{liveBets.length}</span>
      </div>
      <div className="live-list">
        {liveBets.map((bet, index) => (
          <LiveBetRow bet={bet} key={`${bet.betId ?? bet.id ?? bet.playerId}-${index}`} />
        ))}
      </div>
    </section>
  );
}

function LiveBetRow({ bet }: { bet: LiveBet }) {
  const isCashed = bet.status === "CASHED_OUT";
  const isLost = bet.status === "LOST";

  return (
    <div className={`live-row ${isCashed ? "cashed" : ""} ${isLost ? "lost" : ""}`}>
      <span className="player-name">
        <CircleDollarSign size={14} />
        {bet.playerId}
      </span>
      <span>{formatCurrency(bet.amountCents)}</span>
      {isCashed && <strong>{formatMultiplier(bet.cashoutMultiplier ?? 100)}</strong>}
      {isCashed && <span>{formatCurrency(bet.payoutCents ?? "0")}</span>}
      {!isCashed && <em>{isLost ? "Perdeu" : "Ativo"}</em>}
    </div>
  );
}
