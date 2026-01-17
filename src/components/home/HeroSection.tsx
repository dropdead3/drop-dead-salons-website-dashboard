import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useRef } from "react";

export function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"]
  });

  // Transform scroll progress to opacity and blur
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const blur = useTransform(scrollYProgress, [0, 0.5], [0, 20]);
  
  // Parallax transforms - different speeds for depth effect
  const taglineY = useTransform(scrollYProgress, [0, 1], [0, -50]);
  const headlineY = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const subheadlineY = useTransform(scrollYProgress, [0, 1], [0, -150]);
  const ctaY = useTransform(scrollYProgress, [0, 1], [0, -200]);

  const scrollToContent = () => {
    window.scrollTo({
      top: window.innerHeight - 100,
      behavior: "smooth",
    });
  };

  return (
    <section ref={sectionRef} className="relative min-h-screen flex flex-col overflow-hidden">
      <div className="flex-1 flex items-center justify-center py-24 lg:py-32">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="max-w-5xl mx-auto text-center">
            {/* Tagline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-xs uppercase tracking-[0.4em] text-muted-foreground font-sans mb-8"
              style={{ 
                opacity,
                y: taglineY,
                filter: useTransform(blur, (v) => `blur(${v}px)`)
              }}
            >
              Hair • Color • Artistry
            </motion.p>

            {/* Main headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="font-serif text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-normal tracking-tight text-foreground leading-[0.95]"
              style={{ 
                opacity,
                y: headlineY,
                filter: useTransform(blur, (v) => `blur(${v}px)`)
              }}
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
              style={{ 
                opacity,
                y: subheadlineY,
                filter: useTransform(blur, (v) => `blur(${v}px)`)
              }}
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
              className="mt-12 flex flex-col items-center gap-4"
              style={{ 
                opacity,
                y: ctaY,
                filter: useTransform(blur, (v) => `blur(${v}px)`)
              }}
            >
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  to="/new-client-consultation"
                  className="group w-full sm:w-auto px-8 py-4 text-sm uppercase tracking-[0.15em] font-sans font-normal bg-foreground text-background hover:bg-foreground/90 hover:shadow-xl transition-all duration-300 text-center active:scale-[0.98]"
                >
                  <span className="relative z-10">I Am a New Client</span>
                </Link>
                <Link
                  to="/booking"
                  className="group w-full sm:w-auto px-8 py-4 text-sm uppercase tracking-[0.15em] font-sans font-normal border border-foreground text-foreground hover:bg-foreground hover:text-background transition-all duration-300 text-center relative overflow-hidden"
                >
                  <span className="relative z-10">I Am a Returning Client</span>
                </Link>
              </div>
              <div className="flex flex-col items-center gap-1 text-xs text-muted-foreground font-sans">
                <p>New clients begin with a complimentary consultation</p>
                <p>Returning clients are free to book their known services</p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 1 }}
        onClick={scrollToContent}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        aria-label="Scroll down"
        style={{ opacity }}
      >
        <span className="text-xs uppercase tracking-[0.2em] font-sans">Scroll</span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ 
            duration: 1.5, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
        >
          <ChevronDown size={20} />
        </motion.div>
      </motion.button>
    </section>
  );
}