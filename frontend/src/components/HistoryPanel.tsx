import { History } from "lucide-react";
import { formatMultiplier, getHistoryClass } from "../utils/format";

type HistoryPanelProps = {
  history: number[];
};

export function HistoryPanel({ history }: HistoryPanelProps) {
  return (
    <section className="side-card">
      <div className="side-title">
        <History size={18} />
        <h2>Historico</h2>
      </div>
      <div className="history-grid">
        {history.map((value, index) => (
          <span className={getHistoryClass(value)} key={`${value}-${index}`}>
            {formatMultiplier(value)}
          </span>
        ))}
      </div>
    </section>
  );
}
