import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Section } from "@/components/ui/section";

export function BrandStatement() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <Section className="bg-secondary">
      <div ref={ref} className="max-w-4xl mx-auto text-center">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="font-serif text-3xl md:text-4xl lg:text-5xl font-medium tracking-tight text-foreground"
        >
          Not Your Typical Salon.
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mt-8 space-y-4"
        >
          <p className="text-lg md:text-xl text-muted-foreground font-sans font-light leading-relaxed">
            We're a modern luxury salon built for clients who want more than the ordinary.
          </p>
          <p className="text-lg md:text-xl text-muted-foreground font-sans font-light leading-relaxed">
            Every service is intentional. Every detail matters.
          </p>
          <p className="text-lg md:text-xl text-foreground/80 font-sans font-light leading-relaxed">
            This is hair as art, delivered at the highest level.
          </p>
        </motion.div>

        {/* Decorative line */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={isInView ? { scaleX: 1 } : {}}
          transition={{ duration: 1, delay: 0.4 }}
          className="mt-12 w-24 h-[1px] bg-border mx-auto"
        />
      </div>
    </Section>
  );
}
