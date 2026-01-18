import { useRef } from "react";
import { useScroll, useTransform, MotionValue } from "framer-motion";

interface ScrollRevealOptions {
  /** Starting blur in pixels (default: 8) */
  blurStart?: number;
  /** Starting opacity (default: 0) */
  opacityStart?: number;
  /** Starting Y offset in pixels (default: 40) */
  yStart?: number;
  /** Scroll progress at which animation completes (default: 0.6) */
  endProgress?: number;
  /** Scroll offset configuration */
  offset?: ["start end" | "start center" | "center center", "start center" | "start 0.6" | "center center" | "end start"];
}

interface ScrollRevealReturn {
  ref: React.RefObject<HTMLDivElement>;
  opacity: MotionValue<number>;
  y: MotionValue<number>;
  blur: MotionValue<number>;
  blurFilter: MotionValue<string>;
  scrollYProgress: MotionValue<number>;
}

export function useScrollReveal(options: ScrollRevealOptions = {}): ScrollRevealReturn {
  const {
    blurStart = 8,
    opacityStart = 0,
    yStart = 40,
    endProgress = 0.7,
    offset = ["start end", "start 0.6"],
  } = options;

  const ref = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset,
  });

  const opacity = useTransform(scrollYProgress, [0, endProgress], [opacityStart, 1]);
  const blur = useTransform(scrollYProgress, [0, endProgress * 0.7], [blurStart, 0]);
  const blurFilter = useTransform(blur, (v) => `blur(${v}px)`);
  const y = useTransform(scrollYProgress, [0, endProgress], [yStart, 0]);

  return {
    ref,
    opacity,
    y,
    blur,
    blurFilter,
    scrollYProgress,
  };
}
