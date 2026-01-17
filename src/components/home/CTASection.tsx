import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";

export function CTASection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section
      ref={ref}
      className="py-24 lg:py-32 bg-gradient-to-b from-background to-secondary"
    >
      <div className="container mx-auto px-6 lg:px-12 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="font-serif text-3xl md:text-4xl lg:text-5xl font-medium tracking-tight text-foreground"
        >
          Ready for Something Better?
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mt-10"
        >
          <Link
            to="/booking"
            className="inline-block px-12 py-4 text-sm uppercase tracking-[0.2em] font-sans font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Book Now
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
