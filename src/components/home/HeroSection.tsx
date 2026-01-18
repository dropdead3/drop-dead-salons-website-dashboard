import { Link } from "react-router-dom";
import { motion, useScroll, useTransform, MotionValue } from "framer-motion";
import { ChevronDown, ArrowRight } from "lucide-react";
import { useRef, useState } from "react";
import { ConsultationFormDialog } from "@/components/ConsultationFormDialog";
import { Eyebrow } from "@/components/ui/Eyebrow";

// Hero circle images
import heroCircle1 from "@/assets/hero/hero-circle-1.jpg";
import heroCircle2 from "@/assets/hero/hero-circle-2.jpg";
import heroCircle3 from "@/assets/hero/hero-circle-3.jpg";
import heroCircle4 from "@/assets/hero/hero-circle-4.jpg";

interface FloatingCircleConfig {
  src: string;
  size: number;
  x: string;
  y: string;
  duration: number;
  delay: number;
  zIndex: number;
  parallaxSpeed: number;
}

// Floating circle image configuration
const floatingCircleImages: FloatingCircleConfig[] = [
  { 
    src: heroCircle1, 
    size: 180, 
    x: "8%", 
    y: "25%", 
    duration: 18, 
    delay: 0,
    zIndex: 5,
    parallaxSpeed: 0.3,
  },
  { 
    src: heroCircle2, 
    size: 140, 
    x: "85%", 
    y: "18%", 
    duration: 22, 
    delay: 1.5,
    zIndex: 15,
    parallaxSpeed: 0.5,
  },
  { 
    src: heroCircle3, 
    size: 160, 
    x: "78%", 
    y: "62%", 
    duration: 20, 
    delay: 0.8,
    zIndex: 5,
    parallaxSpeed: 0.4,
  },
  { 
    src: heroCircle4, 
    size: 120, 
    x: "3%", 
    y: "58%", 
    duration: 16, 
    delay: 2,
    zIndex: 15,
    parallaxSpeed: 0.6,
  },
];

// Separate component for each floating circle to properly use hooks
function FloatingCircle({ 
  config, 
  scrollYProgress,
  isFront,
}: { 
  config: FloatingCircleConfig; 
  scrollYProgress: MotionValue<number>;
  isFront: boolean;
}) {
  const parallaxY = useTransform(
    scrollYProgress, 
    [0, 1], 
    [0, isFront ? -150 * config.parallaxSpeed : -100 * config.parallaxSpeed]
  );

  return (
    <motion.div
      className="absolute rounded-full overflow-hidden shadow-2xl pointer-events-none"
      style={{
        width: config.size,
        height: config.size,
        left: config.x,
        top: config.y,
        zIndex: config.zIndex,
        y: parallaxY,
      }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ 
        opacity: 1,
        scale: 1,
        x: isFront ? [0, -12, 18, 0] : [0, 15, -10, 0],
        y: isFront ? [0, 15, -12, 0] : [0, -20, 10, 0],
      }}
      transition={{
        opacity: { duration: 0.8, delay: config.delay },
        scale: { duration: 0.8, delay: config.delay },
        x: {
          duration: config.duration,
          delay: config.delay,
          repeat: Infinity,
          ease: "easeInOut",
        },
        y: {
          duration: config.duration,
          delay: config.delay,
          repeat: Infinity,
          ease: "easeInOut",
        },
      }}
    >
      <img 
        src={config.src} 
        alt="Hair styling showcase"
        className="w-full h-full object-cover"
      />
      {/* Soft edge overlay */}
      <div className="absolute inset-0 rounded-full ring-1 ring-foreground/5" />
    </motion.div>
  );
}

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

  const backCircles = floatingCircleImages.filter(img => img.zIndex < 10);
  const frontCircles = floatingCircleImages.filter(img => img.zIndex >= 10);

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
          }}
          transition={{
            duration: 10,
            delay: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      {/* Floating Circle Images - Behind content layer */}
      {backCircles.map((config, index) => (
        <FloatingCircle 
          key={`circle-back-${index}`}
          config={config}
          scrollYProgress={scrollYProgress}
          isFront={false}
        />
      ))}

      <div className="flex-1 flex items-center justify-center py-24 lg:py-32 relative z-10">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="max-w-5xl mx-auto text-center">
            {/* Tagline */}
            <motion.div
              initial={{ opacity: 0, y: 15, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
              style={{ 
                opacity,
                y: taglineY
              }}
            >
              <Eyebrow className="text-muted-foreground mb-8">
                Hair • Color • Artistry
              </Eyebrow>
            </motion.div>

            {/* Main headline */}
            <motion.h1
              initial={{ opacity: 0, y: 25, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 1, delay: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
              className="font-display text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-normal text-foreground leading-[0.95]"
              style={{ 
                opacity,
                y: headlineY,
                filter: useTransform(blur, (v) => `blur(${v}px)`)
              }}
            >
              <span className="whitespace-nowrap">Drop Dead</span> Salon
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
                  className="group w-full sm:w-auto px-10 py-6 text-lg font-sans font-normal bg-foreground text-background hover:bg-foreground/90 hover:shadow-xl transition-all duration-300 text-center active:scale-[0.98] inline-flex items-center justify-center gap-0 hover:gap-2 hover:pr-8"
                >
                  <span className="relative z-10">I am a new client</span>
                  <ArrowRight className="w-0 h-4 opacity-0 group-hover:w-4 group-hover:opacity-100 transition-all duration-300" />
                </button>
                <Link
                  to="/booking"
                  className="group w-full sm:w-auto px-10 py-6 text-lg font-sans font-normal border border-foreground text-foreground transition-all duration-300 text-center relative overflow-hidden inline-flex items-center justify-center gap-0 hover:gap-2 hover:pr-8"
                >
                  <span className="relative z-10">I am a returning client</span>
                  <ArrowRight className="w-0 h-4 opacity-0 group-hover:w-4 group-hover:opacity-100 transition-all duration-300" />
                </Link>
              </div>
              <div className="flex flex-col items-center gap-1 text-sm text-muted-foreground font-sans">
                <p>New clients begin with a $15 consultation</p>
                <p>Returning clients are free to book their known services</p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Floating Circle Images - In front of content layer */}
      {frontCircles.map((config, index) => (
        <FloatingCircle 
          key={`circle-front-${index}`}
          config={config}
          scrollYProgress={scrollYProgress}
          isFront={true}
        />
      ))}

      {/* Scroll Indicator */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 1 }}
        onClick={scrollToContent}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer z-20"
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
