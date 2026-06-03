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
  const particleRefs = useRef<Array<SVGSVGElement | null>>([]);

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

      const particles = particleRefs.current.filter(Boolean);
      const jackpotItems = jackpotRefs.current.filter(Boolean);
      const accent = tone === "win" ? "#22c55e" : "#ef4444";
      const drift = tone === "win" ? -56 : 42;

      gsap.set(root, { autoAlpha: 0 });
      gsap.set(card, { y: 18, scale: 0.92, rotate: tone === "win" ? -1.5 : 1.5 });
      gsap.set(title, { scale: 0.72 });
      gsap.set(glow, { scale: 0.55, opacity: 0 });
      gsap.set(jackpotItems, { autoAlpha: 0, y: -24, scale: 0.84, rotate: -3 });
      gsap.set(particles, { autoAlpha: 0, color: accent, scale: 0.35 });

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
            rotate: 0,
            stagger: 0.12,
            duration: 0.34,
            ease: "back.out(2.2)",
          },
          0.32,
        );
      }

      if (tone === "lose") {
        timeline.to(card, { x: -8, duration: 0.05, repeat: 5, yoyo: true, ease: "power1.inOut" }, "<+0.02").to(card, {
          x: 0,
          duration: 0.08,
        });
      }

      particles.forEach((particle, index) => {
        const side = index % 2 === 0 ? -1 : 1;
        const distance = 34 + index * 7;
        timeline.to(
          particle,
          {
            autoAlpha: 0.85,
            x: side * distance,
            y: drift - index * 5,
            scale: 1,
            duration: 0.52,
            ease: "power2.out",
          },
          0.12 + index * 0.025,
        );
        timeline.to(
          particle,
          {
            autoAlpha: 0,
            scale: 0.2,
            duration: 0.35,
            ease: "power1.in",
          },
          0.62 + index * 0.025,
        );
      });

      timeline
        .to(glow, { opacity: 0.25, scale: 1.35, duration: 1.25, ease: "sine.inOut" }, "<")
        .to(root, { autoAlpha: 0, duration: 0.28, ease: "power1.in" }, 2.35);
    }, root);

    return () => ctx.revert();
  }, [onComplete, resultId, tone]);

  return {
    cardRef,
    glowRef,
    jackpotRefs,
    particleRefs,
    rootRef,
    titleRef,
  };
}
