import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-secondary/30" />
      
      {/* Subtle decorative element */}
      <div className="absolute top-1/4 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 left-0 w-64 h-64 bg-muted/10 rounded-full blur-3xl" />

      <div className="relative container mx-auto px-6 lg:px-12 pt-24 lg:pt-32">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="font-serif text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-medium tracking-tight text-foreground leading-[1.1]"
          >
            Luxury Hair,
            <br />
            <span className="italic">Reimagined.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="mt-8 text-lg md:text-xl text-muted-foreground font-sans font-light max-w-xl mx-auto leading-relaxed"
          >
            A creative salon specializing in transformative color, extensions,
            and elevated artistry.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
            className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6"
          >
            <Link
              to="/booking"
              className="w-full sm:w-auto px-10 py-4 text-sm uppercase tracking-[0.2em] font-sans font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-center"
            >
              Book Your Experience
            </Link>
            <Link
              to="/services"
              className="w-full sm:w-auto px-10 py-4 text-sm uppercase tracking-[0.2em] font-sans font-light border border-border text-foreground hover:bg-secondary transition-colors text-center"
            >
              Explore the Salon
            </Link>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1 }}
          className="absolute bottom-12 left-1/2 -translate-x-1/2"
        >
          <div className="flex flex-col items-center gap-3">
            <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground font-sans">
              Scroll
            </span>
            <div className="w-[1px] h-12 bg-gradient-to-b from-muted-foreground/50 to-transparent" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
