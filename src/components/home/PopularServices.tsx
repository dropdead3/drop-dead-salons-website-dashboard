import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Section } from "@/components/ui/section";
import { ArrowUpRight } from "lucide-react";
import { Eyebrow } from "@/components/ui/Eyebrow";

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
    <Section className="pt-0 md:pt-0 pb-20 md:pb-28" theme="light">
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
        className="text-center"
      >
        <Eyebrow className="text-muted-foreground mb-12">
          Other Popular Services
        </Eyebrow>

        <div className="flex flex-wrap justify-center gap-3 md:gap-4 max-w-6xl mx-auto">
          {popularServices.map((service, index) => (
            <motion.div
              key={service}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: index * 0.03 }}
            >
              <Link
                to="/services"
                className="group/btn inline-flex items-center px-6 py-4 text-base font-sans text-foreground bg-card border border-border rounded-xl transition-all duration-300 ease-out hover:bg-foreground hover:text-background hover:border-foreground hover:scale-105 hover:shadow-lg"
              >
                {service}
                <span className="inline-flex w-0 overflow-hidden group-hover/btn:w-6 group-hover/btn:ml-2 transition-all duration-300">
                  <ArrowUpRight 
                    size={18} 
                    className="flex-shrink-0 translate-x-0.5 -translate-y-0.5" 
                  />
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </Section>
  );
}
