import { Clock3 } from "lucide-react";
import type { Round } from "../types/game";
import { formatMultiplier, getStatusLabel } from "../utils/format";

type FlightPanelProps = {
  round: Round | null;
};

export function FlightPanel({ round }: FlightPanelProps) {
  const multiplier = round?.currentMultiplier ?? 100;
  const status = round?.status ?? "BETTING";

  return (
    <section
      className="relative min-h-[320px] overflow-hidden rounded-lg border border-neutral-800 bg-[radial-gradient(circle_at_center,rgba(34,197,94,0.12),rgba(0,0,0,0)_34%),#020202] p-4 md:min-h-[480px]"
      aria-label="Multiplicador atual"
    >
      <div className="absolute left-4 top-4 flex items-center gap-2 text-sm font-semibold text-neutral-200">
        <span className={`h-3 w-3 rounded-full ${status === "CRASHED" ? "bg-red-500" : "bg-amber-400"}`} />
        {getStatusLabel(status)}
      </div>
      <div className="absolute right-4 top-4 flex items-center gap-2 rounded-md bg-neutral-900 px-3 py-2 text-sm font-bold text-amber-400">
        <Clock3 size={16} />
        {status === "RUNNING" ? "ao vivo" : "5s"}
      </div>
      <div className="flex h-full min-h-[288px] flex-col items-center justify-center md:min-h-[448px]">
        <div className={`text-6xl font-black md:text-8xl ${status === "CRASHED" ? "text-red-500" : "text-green-500"}`}>
          {formatMultiplier(multiplier)}
        </div>
        <div className="mt-8 h-1 w-56 rounded-full bg-gradient-to-r from-transparent via-green-500 to-transparent opacity-70" />
      </div>
    </section>
  );
}
