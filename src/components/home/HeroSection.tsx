import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { ChevronDown, ArrowRight } from "lucide-react";
import { useRef, useState } from "react";
import { ConsultationFormDialog } from "@/components/ConsultationFormDialog";
import { Eyebrow } from "@/components/ui/Eyebrow";

interface HeroSectionProps {
  videoSrc?: string;
}

export function HeroSection({ videoSrc }: HeroSectionProps) {
  const [consultationOpen, setConsultationOpen] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"]
  });

  // Transform scroll progress to opacity and blur
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const blur = useTransform(scrollYProgress, [0, 0.5], [0, 20]);
  const blurFilter = useTransform(blur, (v) => `blur(${v}px)`);
  
  // Heading-specific blur (starts earlier, more intense)
  const headingBlur = useTransform(scrollYProgress, [0, 0.3], [0, 15]);
  const headingBlurFilter = useTransform(headingBlur, (v) => `blur(${v}px)`);
  
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

  // Shared spring config for organic animations
  const springTransition = { type: "spring" as const, stiffness: 50, damping: 20 };

  return (
    <section ref={sectionRef} data-theme="light" className="relative min-h-screen flex flex-col overflow-hidden">
      {/* Video Background */}
      {videoSrc && (
        <motion.div 
          className="absolute inset-0 z-0"
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5 }}
        >
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          >
            <source src={videoSrc} type="video/mp4" />
          </video>
          {/* Overlay for text readability */}
          <div className="absolute inset-0 bg-background/60" />
        </motion.div>
      )}

      {/* Subtle gradient orbs - only show when no video */}
      {!videoSrc && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div
            className="absolute w-[600px] h-[600px] -top-[200px] -right-[200px] rounded-full"
            style={{
              background: "radial-gradient(circle, hsl(var(--foreground) / 0.02) 0%, transparent 60%)",
            }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
              opacity: [0.5, 0.8, 0.5],
              scale: [1, 1.2, 1],
            }}
            transition={{
              opacity: { duration: 15, repeat: Infinity, ease: "easeInOut" },
              scale: { duration: 15, repeat: Infinity, ease: "easeInOut" },
            }}
          />
          <motion.div
            className="absolute w-[500px] h-[500px] -bottom-[150px] -left-[150px] rounded-full"
            style={{
              background: "radial-gradient(circle, hsl(var(--foreground) / 0.02) 0%, transparent 60%)",
            }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
              opacity: [0.6, 0.4, 0.6],
              scale: [1.2, 1, 1.2],
            }}
            transition={{
              opacity: { duration: 18, repeat: Infinity, ease: "easeInOut" },
              scale: { duration: 18, repeat: Infinity, ease: "easeInOut" },
            }}
          />
        </div>
      )}

      <motion.div 
        className="flex-1 flex items-center justify-center pt-32 pb-24 lg:pt-40 lg:pb-32 relative z-0"
        style={{ opacity }}
      >
        <div className="container mx-auto px-6 lg:px-12">
          <div className="max-w-5xl mx-auto text-center">
            {/* Tagline */}
            <motion.div
              initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ ...springTransition, delay: 2.0 }}
              style={{ y: taglineY }}
            >
              <Eyebrow className="text-muted-foreground mb-8">
                Hair • Color • Artistry
              </Eyebrow>
            </motion.div>

            {/* Main headline - Split into two lines for stagger effect */}
            <motion.h1
              className="font-display text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-normal text-foreground leading-[0.95]"
              style={{ y: headlineY, filter: headingBlurFilter }}
            >
              <motion.span 
                className="whitespace-nowrap inline-block"
                initial={{ opacity: 0, y: 40, filter: "blur(12px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ ...springTransition, delay: 2.5 }}
              >
                Drop Dead
              </motion.span>
              {" "}
              <motion.span
                className="inline-block"
                initial={{ opacity: 0, y: 40, filter: "blur(12px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ ...springTransition, delay: 3.0 }}
              >
                Salon
              </motion.span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ ...springTransition, delay: 3.6 }}
              className="mt-10 text-base md:text-lg text-muted-foreground font-sans font-light max-w-md mx-auto leading-relaxed"
              style={{ y: subheadlineY }}
            >
              Step into a world where science meets artistry.
              <br />
              We believe in more than just treatments.
            </motion.p>

            {/* CTAs */}
            <motion.div
              className="mt-12 flex flex-col items-center gap-4"
              style={{ y: ctaY }}
            >
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <motion.div
                  initial={{ opacity: 0, y: 25, filter: "blur(8px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{ ...springTransition, delay: 4.2 }}
                >
                  <button
                    onClick={() => setConsultationOpen(true)}
                    className="group w-full sm:w-auto px-10 py-6 text-lg font-sans font-normal bg-foreground text-background rounded-full hover:bg-foreground/90 hover:shadow-xl transition-all duration-300 text-center active:scale-[0.98] inline-flex items-center justify-center gap-0 hover:gap-2 hover:pr-8"
                  >
                    <span className="relative z-10">I am a new client</span>
                    <ArrowRight className="w-0 h-4 opacity-0 group-hover:w-4 group-hover:opacity-100 transition-all duration-300" />
                  </button>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 25, filter: "blur(8px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{ ...springTransition, delay: 4.6 }}
                >
                  <Link
                    to="/booking"
                    className="group w-full sm:w-auto px-10 py-6 text-lg font-sans font-normal border border-foreground text-foreground rounded-full transition-all duration-300 text-center relative overflow-hidden inline-flex items-center justify-center gap-0 hover:gap-2 hover:pr-8"
                  >
                    <span className="relative z-10">I am a returning client</span>
                    <ArrowRight className="w-0 h-4 opacity-0 group-hover:w-4 group-hover:opacity-100 transition-all duration-300" />
                  </Link>
                </motion.div>
              </div>
              <motion.div 
                initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ ...springTransition, delay: 5.1 }}
                className="flex flex-col items-center gap-1 text-sm text-muted-foreground font-sans"
              >
                <p>New clients begin with a $15 consultation</p>
                <p>Returning clients are free to book their known services</p>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Scroll Indicator */}
      <motion.button
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springTransition, delay: 5.8 }}
        onClick={scrollToContent}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer z-20"
        aria-label="Scroll down"
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
