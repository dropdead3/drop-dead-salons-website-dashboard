import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { Section } from "@/components/ui/section";

// Typewriter component for the word "Typical"
function TypewriterText({ text, isInView, delay = 0 }: { text: string; isInView: boolean; delay?: number }) {
  const [displayedText, setDisplayedText] = useState("");
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    if (isInView && !hasStarted) {
      const startTimeout = setTimeout(() => {
        setHasStarted(true);
      }, delay);
      return () => clearTimeout(startTimeout);
    }
  }, [isInView, delay, hasStarted]);

  useEffect(() => {
    if (!hasStarted) return;

    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex <= text.length) {
        setDisplayedText(text.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(interval);
      }
    }, 80); // Speed of typing

    return () => clearInterval(interval);
  }, [hasStarted, text]);

  return (
    <span className="inline-block">
      {displayedText}
      {hasStarted && displayedText.length < text.length && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.5, repeat: Infinity }}
          className="inline-block w-[3px] h-[0.9em] bg-current ml-0.5 align-middle"
        />
      )}
    </span>
  );
}

export function BrandStatement() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <Section className="bg-foreground text-background">
      <div ref={ref} className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        {/* Left side - Editorial number and title */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.8 }}
        >
          <span className="text-xs font-sans tracking-[0.2em] text-background/50 block mb-4">
            01
          </span>
          <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl font-normal tracking-tight leading-[1.1]">
            Not Your
            <br />
            <span className="italic font-light">
              <TypewriterText text="Typical" isInView={isInView} delay={600} /> Salon.
            </span>
          </h2>
        </motion.div>

        {/* Right side - Description */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="space-y-6"
        >
          <p className="text-base md:text-lg font-sans font-light leading-relaxed text-background/80">
            Located in the heart of Mesa and Gilbert, Arizona, Drop Dead Salon has become the Phoenix Valley's destination for transformative hair experiences. Clients travel from Scottsdale, Chandler, Tempe, and across the East Valley to experience our artistry.
          </p>
          <p className="text-base md:text-lg font-sans font-light leading-relaxed text-background/80">
            Experience an extensive range of innovative treatments meticulously crafted by our artist-led team—where science meets beauty in Arizona's premier luxury salon.
          </p>
        </motion.div>
      </div>
    </Section>
  );
}
