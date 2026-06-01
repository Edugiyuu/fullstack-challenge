import { Circle, CircleDollarSign, Zap } from "lucide-react";
import { formatCurrency } from "../utils/format";
import { NoticeBar } from "./NoticeBar";

type BetControlsProps = {
  autoCashout: string;
  betAmount: string;
  canCashout: boolean;
  isBetting: boolean;
  isCashingOut: boolean;
  notice: string;
  possiblePayout: string;
  roundStatus?: string;
  onAutoCashoutChange: (value: string) => void;
  onBet: () => void;
  onBetAmountChange: (value: string) => void;
  onCashout: () => void;
};

export function BetControls({
  autoCashout,
  betAmount,
  canCashout,
  isBetting,
  isCashingOut,
  notice,
  possiblePayout,
  roundStatus,
  onAutoCashoutChange,
  onBet,
  onBetAmountChange,
  onCashout,
}: BetControlsProps) {
  const isBetDisabled = isBetting || roundStatus === "RUNNING";

  return (
    <section className="rounded-lg border border-neutral-800 bg-black p-4 shadow-[0_18px_60px_rgba(0,0,0,0.35)]">
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <label className="text-xs font-medium text-neutral-400" htmlFor="bet-amount">
            Valor da Aposta
          </label>
          <div className="flex h-12 items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900 px-3 focus-within:border-green-500/70">
            <span className="text-sm text-neutral-500">R$</span>
            <input
              className="min-w-0 flex-1 bg-transparent text-base font-semibold text-white outline-none"
              id="bet-amount"
              value={betAmount}
              onChange={(event) => onBetAmountChange(event.target.value)}
              inputMode="decimal"
            />
            <button
              className="rounded-md bg-neutral-800 px-2 py-1 text-xs font-bold text-neutral-300 transition hover:bg-neutral-700"
              onClick={() => onBetAmountChange((Number.parseFloat(betAmount || "0") / 2).toFixed(2))}
            >
              1/2
            </button>
            <button
              className="rounded-md bg-neutral-800 px-2 py-1 text-xs font-bold text-neutral-300 transition hover:bg-neutral-700"
              onClick={() => onBetAmountChange((Number.parseFloat(betAmount || "0") * 2).toFixed(2))}
            >
              2x
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-neutral-400" htmlFor="auto-cashout">
            Auto Cash Out (Opcional)
          </label>
          <div className="flex h-12 items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900 px-3 focus-within:border-green-500/70">
            <input
              className="min-w-0 flex-1 bg-transparent text-base font-semibold text-white outline-none"
              id="auto-cashout"
              value={autoCashout}
              onChange={(event) => onAutoCashoutChange(event.target.value)}
            />
            <Zap size={18} className="text-green-500" />
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <button
          className="flex h-12 items-center justify-center gap-2 rounded-lg bg-green-500 px-4 text-sm font-bold text-white transition hover:bg-green-400 disabled:cursor-not-allowed disabled:bg-neutral-800 disabled:text-neutral-500"
          onClick={onBet}
          disabled={isBetDisabled}
        >
          <CircleDollarSign size={18} />
          {isBetting ? "Apostando..." : "Apostar"}
        </button>
        <button
          className="flex h-12 items-center justify-center gap-2 rounded-lg border border-neutral-700 bg-neutral-900 px-4 text-sm font-bold text-neutral-300 transition hover:border-neutral-500 hover:bg-neutral-800 disabled:cursor-not-allowed disabled:text-neutral-600"
          disabled={!canCashout || isCashingOut}
          onClick={onCashout}
        >
          <Circle size={18} />
          {isCashingOut ? "Sacando..." : "Cash Out"}
        </button>
        <button
          className="flex h-12 items-center justify-center gap-2 rounded-lg bg-green-600 px-4 text-sm font-bold text-white transition hover:bg-green-500 disabled:cursor-not-allowed disabled:bg-neutral-800 disabled:text-neutral-500"
          disabled={!canCashout}
          onClick={onCashout}
        >
          <Circle size={18} />
          Cash Out <strong>{formatCurrency(possiblePayout)}</strong>
        </button>
      </div>

      <NoticeBar>{notice}</NoticeBar>
    </section>
  );
}
