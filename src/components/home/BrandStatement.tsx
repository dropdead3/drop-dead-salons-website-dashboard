import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Section } from "@/components/ui/section";
import { TypewriterText } from "@/components/ui/TypewriterText";

// Arizona state outline path (accurate shape)
const arizonaPath = "M186.8,41.3L186.6,122.9L188.1,205.8L152.4,199.8L114.6,193.2L76.1,185.8L37.1,177.5L0,168.1L12.7,119.4L24.7,72.5L35.3,29.3L49.2,31.2L48.5,42L60.4,43.7L60.8,53.5L89.4,57.2L98.5,51.4L103.5,39.9L116.5,30.9L122.5,21.7L132.3,17.4L145.5,17.5L154.5,6.9L157.6,0L167.9,7.3L176.1,20.4L186.8,41.3Z";

export function BrandStatement() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <Section className="bg-foreground text-background">
      <div ref={ref} className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        {/* Left side - Arizona outline and title */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.8 }}
        >
          {/* Arizona outline */}
          <div className="mb-6">
            <svg
              width="44"
              height="52"
              viewBox="0 0 190 210"
              fill="none"
              className="text-background/40"
            >
              <motion.path
                d={arizonaPath}
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                initial={{ pathLength: 0 }}
                animate={isInView ? { pathLength: 1 } : { pathLength: 0 }}
                transition={{ duration: 2, ease: "easeInOut", delay: 0.3 }}
              />
            </svg>
          </div>
          <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl font-normal tracking-tight leading-[1.1]">
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
