import { CircleDollarSign, Users } from "lucide-react";
import type { LiveBet } from "../types/game";
import { formatCurrency, formatMultiplier } from "../utils/format";

type LiveBetsPanelProps = {
  liveBets: LiveBet[];
};

export function LiveBetsPanel({ liveBets }: LiveBetsPanelProps) {
  return (
    <section className="rounded-lg border border-neutral-800 bg-black p-4">
      <div className="mb-4 flex items-center gap-2 text-sm font-bold text-white">
        <Users className="text-green-500" size={18} />
        <h2>Apostas ao Vivo</h2>
        <span className="ml-auto rounded-md bg-green-950 px-2 py-1 text-xs text-green-400">{liveBets.length}</span>
      </div>
      <div className="space-y-2">
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
    <div
      className={`grid grid-cols-[minmax(0,1fr)_auto_auto_auto] items-center gap-3 rounded-md px-3 py-3 text-xs ${
        isCashed ? "bg-green-600 text-white" : isLost ? "bg-red-950 text-red-100" : "bg-neutral-950 text-neutral-300"
      }`}
    >
      <span className="flex min-w-0 items-center gap-2 font-semibold">
        <CircleDollarSign className={isCashed ? "text-white" : "text-green-500"} size={14} />
        {bet.playerId}
      </span>
      <span>{formatCurrency(bet.amountCents)}</span>
      {isCashed && <strong className="rounded bg-green-900 px-2 py-1">{formatMultiplier(bet.cashoutMultiplier ?? 100)}</strong>}
      {isCashed && <span>{formatCurrency(bet.payoutCents ?? "0")}</span>}
      {!isCashed && <em className="rounded bg-amber-500/20 px-2 py-1 font-bold not-italic text-amber-300">{isLost ? "Perdeu" : "Ativo"}</em>}
    </div>
  );
}
