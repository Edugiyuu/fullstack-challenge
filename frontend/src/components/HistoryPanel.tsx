import { History } from "lucide-react";
import { formatMultiplier, getHistoryClass } from "../utils/format";

type HistoryPanelProps = {
  history: number[];
};

export function HistoryPanel({ history }: HistoryPanelProps) {
  return (
    <section className="rounded-lg border border-neutral-800 bg-black p-4">
      <div className="mb-4 flex items-center gap-2 text-sm font-bold text-white">
        <History className="text-green-500" size={18} />
        <h2>Historico</h2>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {history.map((value, index) => (
          <span
            className={`rounded-md px-3 py-2 text-center text-xs font-bold text-white ${getHistoryClass(value)}`}
            key={`${value}-${index}`}
          >
            {formatMultiplier(value)}
          </span>
        ))}
      </div>
    </section>
  );
}
