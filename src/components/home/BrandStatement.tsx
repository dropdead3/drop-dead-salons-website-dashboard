import { motion, useScroll, useTransform, useInView } from "framer-motion";
import { useRef } from "react";
import { Section } from "@/components/ui/section";
import { Eyebrow } from "@/components/ui/Eyebrow";

export function BrandStatement() {
  const containerRef = useRef(null);
  const contentRef = useRef(null);
  const isInView = useInView(contentRef, { once: true, margin: "-100px" });

  // Scroll-based opacity: starts transparent, fully visible when centered
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "center center"]
  });

  const opacity = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <Section className="bg-background" theme="light">
      <motion.div 
        ref={containerRef}
        data-theme="dark"
        className="bg-foreground text-background rounded-2xl p-12 md:p-20 lg:p-24"
        style={{ opacity }}
      >
        <div ref={contentRef} className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-8 lg:gap-12 items-center">
          {/* Left side - Title */}
          <motion.div
            initial={{ opacity: 0, x: -20, filter: "blur(4px)" }}
            animate={isInView ? { opacity: 1, x: 0, filter: "blur(0px)" } : {}}
            transition={{ duration: 0.9, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <Eyebrow className="text-background/60 mb-4">
              Drop Dead is
            </Eyebrow>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-normal tracking-tight leading-[1.1]">
              Not Your
              <br />
              <span className="font-light">Average Salon.</span>
            </h2>
          </motion.div>

          {/* Right side - Description */}
          <motion.div
            initial={{ opacity: 0, x: 20, filter: "blur(4px)" }}
            animate={isInView ? { opacity: 1, x: 0, filter: "blur(0px)" } : {}}
            transition={{ duration: 0.9, delay: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
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
      </motion.div>
    </Section>
  );
}
