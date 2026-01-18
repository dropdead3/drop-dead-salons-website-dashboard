import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useRef, useState } from "react";
import { TypewriterText } from "@/components/ui/TypewriterText";
import { ConsultationFormDialog } from "@/components/ConsultationFormDialog";

export function HeroSection() {
  const [consultationOpen, setConsultationOpen] = useState(false);
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

  // Floating decorative elements config - alternating oat and foreground tints
  const floatingElements = [
    { size: 300, x: "10%", y: "20%", duration: 20, delay: 0, color: "oat" },
    { size: 200, x: "85%", y: "15%", duration: 25, delay: 2, color: "foreground" },
    { size: 150, x: "75%", y: "70%", duration: 18, delay: 4, color: "oat" },
    { size: 250, x: "5%", y: "65%", duration: 22, delay: 1, color: "foreground" },
    { size: 100, x: "50%", y: "80%", duration: 15, delay: 3, color: "oat" },
  ];

  return (
    <section ref={sectionRef} className="relative min-h-screen flex flex-col overflow-hidden">
      {/* Floating Decorative Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {floatingElements.map((el, index) => (
          <motion.div
            key={index}
            className="absolute rounded-full"
            style={{
              width: el.size,
              height: el.size,
              left: el.x,
              top: el.y,
              background: el.color === "oat" 
                ? `radial-gradient(circle, hsl(var(--oat) / 0.15) 0%, transparent 70%)`
                : `radial-gradient(circle, hsl(var(--foreground) / 0.03) 0%, transparent 70%)`,
            }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ 
              opacity: [0.3, 0.6, 0.3],
              scale: [1, 1.1, 1],
              x: [0, 30, -20, 0],
              y: [0, -40, 20, 0],
            }}
            transition={{
              duration: el.duration,
              delay: el.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
        
        {/* Subtle gradient orbs */}
        <motion.div
          className="absolute w-[600px] h-[600px] -top-[200px] -right-[200px] rounded-full"
          style={{
            background: "radial-gradient(circle, hsl(var(--foreground) / 0.02) 0%, transparent 60%)",
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute w-[500px] h-[500px] -bottom-[150px] -left-[150px] rounded-full"
          style={{
            background: "radial-gradient(circle, hsl(var(--foreground) / 0.02) 0%, transparent 60%)",
          }}
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.6, 0.4, 0.6],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Thin floating lines */}
        <motion.div
          className="absolute w-[1px] h-32 bg-gradient-to-b from-transparent via-foreground/10 to-transparent"
          style={{ left: "20%", top: "30%" }}
          animate={{
            y: [0, 50, 0],
            opacity: [0, 0.5, 0],
            rotate: [0, 5, 0],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute w-[1px] h-24 bg-gradient-to-b from-transparent via-foreground/10 to-transparent"
          style={{ right: "25%", top: "40%" }}
          animate={{
            y: [0, -40, 0],
            opacity: [0, 0.4, 0],
            rotate: [0, -5, 0],
          }}
          transition={{
            duration: 10,
            delay: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      <div className="flex-1 flex items-center justify-center py-24 lg:py-32 relative z-10">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="max-w-5xl mx-auto text-center">
            {/* Tagline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-xs uppercase tracking-[0.4em] text-muted-foreground font-display mb-8"
              style={{ 
                opacity,
                y: taglineY
              }}
            >
              <TypewriterText text="Hair" isInView={true} delay={300} speed={280} />
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 1.5 }}
              >
                {" "}•{" "}
              </motion.span>
              <TypewriterText text="Color" isInView={true} delay={1800} speed={280} />
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 3.2 }}
              >
                {" "}•{" "}
              </motion.span>
              <TypewriterText text="Artistry" isInView={true} delay={3500} speed={280} />
            </motion.p>

            {/* Main headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="font-display text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-normal text-foreground leading-[0.95]"
              style={{ 
                opacity,
                y: headlineY,
                filter: useTransform(blur, (v) => `blur(${v}px)`)
              }}
            >
              Drop Dead Salon
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="mt-10 text-base md:text-lg text-muted-foreground font-sans font-light max-w-md mx-auto leading-relaxed"
              style={{ 
                opacity,
                y: subheadlineY
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
                y: ctaY
              }}
            >
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={() => setConsultationOpen(true)}
                  className="group w-full sm:w-auto px-8 py-4 text-sm font-sans font-normal bg-foreground text-background hover:bg-foreground/90 hover:shadow-xl transition-all duration-300 text-center active:scale-[0.98]"
                >
                  <span className="relative z-10">I am a new client</span>
                </button>
                <Link
                  to="/booking"
                  className="group w-full sm:w-auto px-8 py-4 text-sm font-sans font-normal border border-foreground text-foreground hover:bg-foreground hover:text-background transition-all duration-300 text-center relative overflow-hidden"
                >
                  <span className="relative z-10">I am a returning client</span>
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
        <span className="text-xs uppercase tracking-[0.2em] font-display">Scroll</span>
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

      {/* Consultation Form Dialog */}
      <ConsultationFormDialog open={consultationOpen} onOpenChange={setConsultationOpen} />
    </section>
  );
}