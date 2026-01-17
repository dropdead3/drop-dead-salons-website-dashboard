import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Section } from "@/components/ui/section";

const testimonial = {
  quote:
    "From the consultation to the final result, everything felt intentional and elevated. This is the only salon that truly understands what luxury should feel like.",
  author: "Sarah M.",
  service: "Color & Extensions",
};

export function TestimonialSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <Section>
      <div ref={ref} className="max-w-3xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.8 }}
        >
          <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground font-sans">
            Client Experience
          </span>
        </motion.div>

        <motion.blockquote
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mt-8"
        >
          <p className="font-serif text-2xl md:text-3xl lg:text-4xl font-light italic text-foreground leading-relaxed">
            "{testimonial.quote}"
          </p>
        </motion.blockquote>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-8"
        >
          <p className="text-sm font-sans font-medium text-foreground">
            {testimonial.author}
          </p>
          <p className="text-xs text-muted-foreground font-sans mt-1">
            {testimonial.service}
          </p>
        </motion.div>

        {/* Decorative quotes */}
        <div className="absolute top-0 left-0 text-8xl font-serif text-muted/20 select-none hidden lg:block">
          "
        </div>
      </div>
    </Section>
  );
}
