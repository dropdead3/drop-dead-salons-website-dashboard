import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { ArrowUpRight } from "lucide-react";

export function CTASection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section
      ref={ref}
      className="py-24 lg:py-32 bg-foreground text-background"
    >
      <div className="container mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20 items-center">
          {/* Left - Text */}
          <div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8 }}
              className="font-serif text-4xl md:text-5xl lg:text-6xl font-normal tracking-tight"
            >
              Ready for Something
              <br />
              <span className="italic font-light">Better?</span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="mt-6 text-base text-background/70 font-sans font-light max-w-md"
            >
              Experience the difference of a salon that truly cares about artistry and results.
            </motion.p>
          </div>

          {/* Right - Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex flex-col items-start lg:items-end gap-4"
          >
            <Link
              to="/booking"
              className="group inline-flex items-center gap-2 px-8 py-4 text-sm font-sans border border-background text-background hover:bg-background hover:text-foreground transition-all duration-300 active:scale-[0.98]"
            >
              <span>Book consult</span>
              <motion.span
                className="inline-block"
                whileHover={{ x: 4, y: -4 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <ArrowUpRight size={16} />
              </motion.span>
            </Link>
            <p className="text-xs text-background/60 font-sans lg:text-right">
              We start every journey with a personalized consultation
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
