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
  return (
    <section className="bet-panel">
      <div className="field-group">
        <label htmlFor="bet-amount">Valor da Aposta</label>
        <div className="amount-input">
          <span>R$</span>
          <input id="bet-amount" value={betAmount} onChange={(event) => onBetAmountChange(event.target.value)} inputMode="decimal" />
          <button onClick={() => onBetAmountChange((Number.parseFloat(betAmount || "0") / 2).toFixed(2))}>1/2</button>
          <button onClick={() => onBetAmountChange((Number.parseFloat(betAmount || "0") * 2).toFixed(2))}>2x</button>
        </div>
      </div>

      <div className="field-group">
        <label htmlFor="auto-cashout">Auto Cash Out (Opcional)</label>
        <div className="amount-input">
          <input id="auto-cashout" value={autoCashout} onChange={(event) => onAutoCashoutChange(event.target.value)} />
          <Zap size={18} className="input-icon" />
        </div>
      </div>

      <div className="action-row">
        <button className="primary-button" onClick={onBet} disabled={isBetting || roundStatus === "RUNNING"}>
          <CircleDollarSign size={18} />
          {isBetting ? "Apostando..." : "Apostar"}
        </button>
        <button className="ghost-button" disabled={!canCashout || isCashingOut} onClick={onCashout}>
          <Circle size={18} />
          {isCashingOut ? "Sacando..." : "Cash Out"}
        </button>
        <button className="cashout-preview" disabled={!canCashout} onClick={onCashout}>
          <Circle size={18} />
          Cash Out <strong>{formatCurrency(possiblePayout)}</strong>
        </button>
      </div>

      <NoticeBar>{notice}</NoticeBar>
    </section>
  );
}
