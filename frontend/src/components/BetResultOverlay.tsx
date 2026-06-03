import { CircleDollarSign, OctagonAlert, Sparkles, Zap } from "lucide-react";
import { useCallback, useState } from "react";
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

const jackpotTileIndexes = [0, 1, 2];

export function BetResultOverlay({ result, onDone }: BetResultOverlayProps) {
  const tone = result.type === "WIN" ? "win" : "lose";
  const { cardRef, glowRef, jackpotRefs, jackpotReelRefs, rootRef, titleRef } = useBetResultAnimation({
    resultId: result.id,
    tone,
    onComplete: onDone,
  });
  const setJackpotRef = useCallback(
    (index: number) => (element: HTMLDivElement | null) => {
      jackpotRefs.current[index] = element;
    },
    [jackpotRefs],
  );
  const setJackpotReelRef = useCallback(
    (index: number) => (element: HTMLDivElement | null) => {
      jackpotReelRefs.current[index] = element;
    },
    [jackpotReelRefs],
  );

  const isWin = result.type === "WIN";
  const title = isWin ? "Cashout!" : "Crash!";
  const detail = isWin
    ? result.payoutCents
      ? `Voce ganhou ${formatCurrency(result.payoutCents)}`
      : "Voce garantiu o lucro"
    : result.multiplier
      ? `Rodada caiu em ${formatMultiplier(result.multiplier)}`
      : "Sua aposta caiu com a rodada";
  const Icon = isWin ? CircleDollarSign : OctagonAlert;

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
          <div className="mt-6 flex justify-center gap-3" aria-label="Jackpot 7 7 7">
            {jackpotTileIndexes.map((index) => (
              <JackpotTile key={index} refCallback={setJackpotRef(index)} reelRefCallback={setJackpotReelRef(index)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

type JackpotTileProps = {
  refCallback: (element: HTMLDivElement | null) => void;
  reelRefCallback: (element: HTMLDivElement | null) => void;
};

const reelFrames = Array.from({ length: 7 });

function JackpotTile({ refCallback, reelRefCallback }: JackpotTileProps) {
  const [hasImage, setHasImage] = useState(true);

  return (
    <div
      ref={refCallback}
      className="relative h-28 w-22 overflow-hidden rounded-md border border-green-300/60 bg-black/45 shadow-[0_0_26px_rgba(34,197,94,0.34)] md:h-36 md:w-28"
    >
      <div
        ref={reelRefCallback}
        className="flex h-[700%] flex-col will-change-transform"
      >
        {reelFrames.map((_, index) => (
          <div className="flex h-[14.285%] items-center justify-center" key={index}>
            {hasImage ? (
              <img
                alt="Numero 7"
                className="h-full w-full object-cover"
                onError={() => setHasImage(false)}
                src="/hakari-jackpot/7.png"
              />
            ) : (
              <span className="text-4xl font-black text-green-200 md:text-5xl">7</span>
            )}
          </div>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-5 bg-linear-to-b from-black/70 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-5 bg-linear-to-b from-black/70 to-transparent" />
    </div>
  );
}
