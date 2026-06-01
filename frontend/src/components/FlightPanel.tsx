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
    <section className="flight-panel" aria-label="Multiplicador atual">
      <div className="flight-status">
        <span className={`status-dot ${status === "CRASHED" ? "danger" : "ready"}`} />
        {getStatusLabel(status)}
      </div>
      <div className="round-timer">
        <Clock3 size={16} />
        {status === "RUNNING" ? "ao vivo" : "5s"}
      </div>
      <div className="multiplier-wrap">
        <div className={`multiplier ${status === "CRASHED" ? "crashed" : ""}`}>{formatMultiplier(multiplier)}</div>
        <div className="flight-line" />
      </div>
    </section>
  );
}
