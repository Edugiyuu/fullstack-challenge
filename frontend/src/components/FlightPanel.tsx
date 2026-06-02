import { Clock3 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { Round } from "../types/game";
import { formatMultiplier, getStatusLabel } from "../utils/format";

type FlightPanelProps = {
  round: Round | null;
};

export function FlightPanel({ round }: FlightPanelProps) {
  const multiplier = round?.currentMultiplier ?? 100;
  const status = round?.status ?? "BETTING";
  const isRoundEnded = status === "CRASHED" || status === "SETTLED";
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, []);

  const timerLabel = useMemo(() => {
    if (status === "RUNNING") {
      return "ao vivo";
    }

    if (status === "CRASHED") {
      return "crash";
    }

    if (status === "SETTLED") {
      return "fim";
    }

    if (!round?.bettingEndsAt) {
      return "--";
    }

    const remainingSeconds = Math.max(0, Math.ceil((new Date(round.bettingEndsAt).getTime() - now) / 1000));
    return `${remainingSeconds}s`;
  }, [now, round?.bettingEndsAt, status]);

  const graph = useMemo(() => {
    const progress = Math.min(1, Math.max(0, (multiplier - 100) / 500));
    const endX = 18 + progress * 70;
    const endY = 80 - Math.pow(progress, 1.35) * 58;

    return {
      pointX: endX,
      pointY: endY,
    };
  }, [multiplier]);

  return (
    <section
      className="relative min-h-[320px] overflow-hidden rounded-lg border border-neutral-800 bg-[radial-gradient(circle_at_center,rgba(34,197,94,0.12),rgba(0,0,0,0)_34%),#020202] p-4 md:min-h-[480px]"
      aria-label="Multiplicador atual"
    >
      <div className="absolute left-4 top-4 flex items-center gap-2 text-sm font-semibold text-neutral-200">
        <span className={`h-3 w-3 rounded-full ${isRoundEnded ? "bg-red-500" : "bg-amber-400"}`} />
        {getStatusLabel(status)}
      </div>
      <div className="absolute right-4 top-4 flex items-center gap-2 rounded-md bg-neutral-900 px-3 py-2 text-sm font-bold text-amber-400">
        <Clock3 size={16} />
        {timerLabel}
      </div>
      <svg
        className="pointer-events-none absolute inset-x-0 bottom-0 h-full w-full opacity-80"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="flight-line" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor={isRoundEnded ? "#7f1d1d" : "#14532d"} stopOpacity="0" />
            <stop offset="55%" stopColor={isRoundEnded ? "#ef4444" : "#22c55e"} stopOpacity="0.82" />
            <stop offset="100%" stopColor={isRoundEnded ? "#fb7185" : "#86efac"} stopOpacity="1" />
          </linearGradient>
        </defs>
        <path d="M 0 82 H 100" stroke="#262626" strokeWidth="0.35" />
        <path d="M 10 22 V 88" stroke="#171717" strokeWidth="0.28" />
        {[24, 38, 52, 66].map((x) => (
          <path d={`M ${x} 22 V 88`} key={x} stroke="#171717" strokeWidth="0.18" />
        ))}
        {[34, 50, 66].map((y) => (
          <path d={`M 10 ${y} H 92`} key={y} stroke="#171717" strokeWidth="0.18" />
        ))}
        <path
          d={`M 10 82 L ${graph.pointX.toFixed(1)} ${graph.pointY.toFixed(1)}`}
          fill="none"
          stroke="url(#flight-line)"
          strokeLinecap="round"
          strokeWidth="1.2"
        />
      </svg>
      <div className="relative z-10 flex h-full min-h-[288px] flex-col items-center justify-center md:min-h-[448px]">
        <div className={`text-6xl font-black md:text-8xl ${isRoundEnded ? "text-red-500" : "text-green-500"}`}>
          {formatMultiplier(multiplier)}
        </div>
        <div className="mt-8 h-1 w-56 rounded-full bg-gradient-to-r from-transparent via-green-500 to-transparent opacity-70" />
      </div>
    </section>
  );
}
