import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex flex-col">
      <div className="flex-1 flex items-center justify-center py-24 lg:py-32">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="max-w-5xl mx-auto text-center">
            {/* Tagline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-xs uppercase tracking-[0.4em] text-muted-foreground font-sans mb-8"
            >
              Hair • Color • Artistry
            </motion.p>

            {/* Main headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="font-serif text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-normal tracking-tight text-foreground leading-[0.95]"
            >
              Drop Dead
              <br />
              <span className="italic font-light">Salon</span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="mt-10 text-base md:text-lg text-muted-foreground font-sans font-light max-w-md mx-auto leading-relaxed"
            >
              Step into a world where science meets artistry.
              <br />
              We believe in more than just treatments.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link
                to="/booking"
                className="w-full sm:w-auto px-8 py-4 text-sm uppercase tracking-[0.15em] font-sans font-normal border border-foreground text-foreground hover:bg-foreground hover:text-background transition-all duration-300 text-center"
              >
                Book Appointment
              </Link>
              <Link
                to="/services"
                className="w-full sm:w-auto px-8 py-4 text-sm uppercase tracking-[0.15em] font-sans font-normal bg-foreground text-background hover:bg-foreground/90 transition-all duration-300 text-center"
              >
                View Services
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
