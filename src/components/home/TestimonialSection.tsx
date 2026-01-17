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
    <Section className="bg-secondary">
      <div ref={ref} className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.8 }}
          className="mb-8"
        >
          <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground font-sans">
            Client Experience
          </span>
        </motion.div>

        <motion.blockquote
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <p className="font-serif text-2xl md:text-3xl lg:text-4xl font-light italic text-foreground leading-relaxed">
            "{testimonial.quote}"
          </p>
        </motion.blockquote>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-10 flex items-center gap-4"
        >
          {/* Avatar placeholder */}
          <div className="w-12 h-12 rounded-full bg-muted" />
          <div>
            <p className="text-sm font-sans font-medium text-foreground">
              {testimonial.author}
            </p>
            <p className="text-xs text-muted-foreground font-sans mt-0.5">
              {testimonial.service}
            </p>
          </div>
        </motion.div>
      </div>
    </Section>
  );
}
