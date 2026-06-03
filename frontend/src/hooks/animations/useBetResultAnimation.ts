import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";

type BetResultAnimationParams = {
  resultId: number;
  tone: "win" | "lose";
  onComplete: () => void;
};

export function useBetResultAnimation({ resultId, tone, onComplete }: BetResultAnimationParams) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const titleRef = useRef<HTMLHeadingElement | null>(null);
  const glowRef = useRef<HTMLDivElement | null>(null);
  const jackpotRefs = useRef<Array<HTMLDivElement | null>>([]);
  const jackpotReelRefs = useRef<Array<HTMLDivElement | null>>([]);

  useLayoutEffect(() => {
    const root = rootRef.current;
    const card = cardRef.current;
    const title = titleRef.current;
    const glow = glowRef.current;

    if (!root || !card || !title || !glow) {
      return;
    }

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ctx = gsap.context(() => {
      if (reduceMotion) {
        gsap
          .timeline({ onComplete })
          .fromTo(root, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.18, ease: "power1.out" })
          .to(root, { autoAlpha: 0, delay: 1.8, duration: 0.22, ease: "power1.in" });
        return;
      }

      const jackpotItems = jackpotRefs.current.filter(Boolean);
      const jackpotReels = jackpotReelRefs.current.filter(Boolean);
      const accent = tone === "win" ? "#22c55e" : "#ef4444";

      gsap.set(root, { autoAlpha: 0 });
      gsap.set(card, { y: 18, scale: 0.92, rotate: tone === "win" ? -1.5 : 1.5 });
      gsap.set(title, { scale: 0.72 });
      gsap.set(glow, { scale: 0.55, opacity: 0 });
      gsap.set(jackpotItems, { autoAlpha: 0, y: 8, scale: 0.96 });
      gsap.set(jackpotReels, { yPercent: 0, filter: "blur(0px)" });

      const timeline = gsap.timeline({ onComplete });
      timeline
        .to(root, { autoAlpha: 1, duration: 0.16, ease: "power1.out" })
        .to(glow, { opacity: 0.72, scale: 1.18, duration: 0.45, ease: "power2.out" }, "<")
        .to(card, { y: 0, scale: 1, rotate: 0, duration: 0.42, ease: "back.out(1.8)" }, "<")
        .to(title, { scale: 1.08, duration: 0.22, ease: "power2.out" }, "<+0.08")
        .to(title, { scale: 1, duration: 0.28, ease: "elastic.out(1, 0.45)" });

      if (tone === "win") {
        timeline.to(
          jackpotItems,
          {
            autoAlpha: 1,
            y: 0,
            scale: 1,
            duration: 0.18,
            ease: "power2.out",
            stagger: 0.1,
          },
          0.26,
        );

        jackpotReels.forEach((reel, index) => {
          const startAt = 0.34 + index * 0.3;

          timeline
            .to(
              reel,
              {
                yPercent: -140,
                filter: "blur(0.5px)",
                duration: 0.34,
                ease: "power1.in",
              },
              startAt,
            )
            .to(reel, {
              yPercent: -85.714,
              filter: "blur(0px)",
              duration: 0.18,
              ease: "back.out(1.7)",
            });

          timeline.to(
            jackpotItems[index],
            {
              scale: 1.1,
              duration: 0.08,
              
              repeat: 1,
              ease: "power1.out",
            },
            startAt + 0.42,
          );
        });
      }

      if (tone === "lose") {
        timeline.to(card, { x: -8, duration: 0.05, repeat: 5, yoyo: true, ease: "power1.inOut" }, "<+0.02").to(card, {
          x: 0,
          duration: 0.08,
        });
      }


      timeline
        .to(glow, { opacity: 0.25, scale: 1.35, duration: 1.25, ease: "sine.inOut" }, "<")
        .to(root, { autoAlpha: 0, duration: 0.28, ease: "power1.in" }, 4);
    }, root);

    return () => ctx.revert();
  }, [onComplete, resultId, tone]);

  return {
    cardRef,
    glowRef,
    jackpotRefs,
    jackpotReelRefs,
    rootRef,
    titleRef,
  };
}
