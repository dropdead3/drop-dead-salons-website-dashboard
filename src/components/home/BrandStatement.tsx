import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Section } from "@/components/ui/section";
import { TypewriterText } from "@/components/ui/TypewriterText";

export function BrandStatement() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <Section className="bg-foreground text-background">
      <div ref={ref} className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        {/* Left side - Title */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.8 }}
        >
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-normal tracking-tight leading-[1.1]">
            Not Your
            <br />
            <span className="italic font-light">
              <TypewriterText text="Average" isInView={isInView} delay={600} /> Salon.
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
