import { CircleDollarSign, OctagonAlert, Sparkles, Zap } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useBetResultAnimation } from "../hooks/animations/useBetResultAnimation";
import { formatCurrency, formatMultiplier } from "../utils/format";

export type BetResultOverlayState = {
  id: number;
  type: "WIN" | "LOSE";
  payoutCents?: string;
  multiplier?: number;
};

type BetResultOverlayProps = {
  result: BetResultOverlayState;
  onDone: () => void;
};

export function BetResultOverlay({ result, onDone }: BetResultOverlayProps) {
  const tone = result.type === "WIN" ? "win" : "lose";
  const { cardRef, glowRef, jackpotRefs, particleRefs, rootRef, titleRef } = useBetResultAnimation({
    resultId: result.id,
    tone,
    onComplete: onDone,
  });
  const setParticleRef = useCallback(
    (index: number) => (element: SVGSVGElement | null) => {
      particleRefs.current[index] = element;
    },
    [particleRefs],
  );
  const setJackpotRef = useCallback(
    (index: number) => (element: HTMLDivElement | null) => {
      jackpotRefs.current[index] = element;
    },
    [jackpotRefs],
  );

  const isWin = result.type === "WIN";
  const jackpotNumber = useMemo(() => ((result.id - 1) % 3) + 1, [result.id]);
  const title = isWin ? "Cashout!" : "Crash!";
  const detail = isWin
    ? result.payoutCents
      ? `Voce ganhou ${formatCurrency(result.payoutCents)}`
      : "Voce garantiu o lucro"
    : result.multiplier
      ? `Rodada caiu em ${formatMultiplier(result.multiplier)}`
      : "Sua aposta caiu com a rodada";
  const Icon = isWin ? CircleDollarSign : OctagonAlert;
  const ParticleIcon = isWin ? Sparkles : Zap;

  return (
    <div
      ref={rootRef}
      className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black/18 px-4"
      aria-live="polite"
      aria-atomic="true"
    >
      <div
        ref={glowRef}
        className={`absolute h-64 w-64 rounded-full blur-3xl md:h-96 md:w-96 ${
          isWin ? "bg-green-500/35" : "bg-red-500/35"
        }`}
      />
      <div
        ref={cardRef}
        className={`relative min-w-[min(92vw,360px)] rounded-lg border px-8 py-7 text-center shadow-[0_26px_90px_rgba(0,0,0,0.45)] ${
          isWin ? "border-green-400/70 bg-green-950/90 text-green-50" : "border-red-400/70 bg-red-950/90 text-red-50"
        }`}
      >
        <div
          className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full ${
            isWin ? "bg-green-400 text-green-950" : "bg-red-400 text-red-950"
          }`}
        >
          <Icon size={30} strokeWidth={2.5} />
        </div>
        <h2 ref={titleRef} className="text-4xl font-black tracking-normal md:text-5xl">
          {title}
        </h2>
        <p className="mt-3 text-base font-bold text-white md:text-lg">{detail}</p>
        {result.multiplier && isWin && <p className="mt-2 text-sm font-semibold text-green-100">{formatMultiplier(result.multiplier)}</p>}
        {isWin && (
          <div className="mt-5 flex justify-center gap-2" aria-label={`Jackpot ${jackpotNumber} ${jackpotNumber} ${jackpotNumber}`}>
            {Array.from({ length: 3 }).map((_, index) => (
              <JackpotTile key={index} number={jackpotNumber} refCallback={setJackpotRef(index)} />
            ))}
          </div>
        )}
        {Array.from({ length: 10 }).map((_, index) => (
          <ParticleIcon
            aria-hidden="true"
            className="absolute left-1/2 top-1/2 h-4 w-4"
            key={index}
            ref={setParticleRef(index)}
            strokeWidth={2.5}
          />
        ))}
      </div>
    </div>
  );
}

type JackpotTileProps = {
  number: number;
  refCallback: (element: HTMLDivElement | null) => void;
};

function JackpotTile({ number, refCallback }: JackpotTileProps) {
  const [hasImage, setHasImage] = useState(true);

  return (
    <div
      ref={refCallback}
      className="flex h-20 w-16 items-center justify-center overflow-hidden rounded-md border border-green-300/60 bg-black/45 shadow-[0_0_22px_rgba(34,197,94,0.28)] md:h-24 md:w-20"
    >
      {hasImage ? (
        <img
          alt={`Numero ${number}`}
          className="h-full w-full object-cover"
          onError={() => setHasImage(false)}
          src={`/hakari-jackpot/${number}.png`}
        />
      ) : (
        <span className="text-4xl font-black text-green-200 md:text-5xl">{number}</span>
      )}
    </div>
  );
}
