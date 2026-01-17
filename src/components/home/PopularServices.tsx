import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Section } from "@/components/ui/section";

const popularServices = [
  "Hidden Beaded Row Weft Extension Installs",
  "SecreTape Tape-In Extensions",
  "Root Retouch",
  "Haircuts",
  "Color Corrections",
  "Balayage",
  "Partial & Full Highlights",
  "Blow Out & Style",
  "Root Smudge",
  "Hair Treatments & Masks",
  "Gray Coverage",
  "Eyebrow Tint/Bleach",
];

export function PopularServices() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <Section className="pt-0 md:pt-0 pb-20 md:pb-28">
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
        className="text-center"
      >
        <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground font-sans block mb-12">
          Other Popular Services
        </span>

        <div className="flex flex-wrap justify-center gap-3 md:gap-4 max-w-4xl mx-auto">
          {popularServices.map((service, index) => (
            <motion.div
              key={service}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: index * 0.03 }}
            >
              <Link
                to="/services"
                className="inline-block px-5 py-2.5 text-sm font-sans text-foreground bg-card border border-border rounded-full transition-all duration-300 ease-out hover:bg-foreground hover:text-background hover:border-foreground hover:scale-105 hover:shadow-lg"
              >
                {service}
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </Section>
  );
}
