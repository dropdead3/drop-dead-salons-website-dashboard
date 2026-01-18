import { useState, useEffect } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { ArrowUp } from "lucide-react";

export function ScrollProgressButton() {
  const [isVisible, setIsVisible] = useState(false);
  const { scrollYProgress } = useScroll();
  
  // Transform scroll progress to stroke dashoffset
  const circumference = 2 * Math.PI * 26; // radius = 26
  const strokeDashoffset = useTransform(
    scrollYProgress,
    [0, 1],
    [circumference, 0]
  );

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > window.innerHeight * 0.5);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ 
            type: "spring",
            stiffness: 400,
            damping: 15,
          }}
          onClick={scrollToTop}
          className="relative w-16 h-16 flex items-center justify-center bg-background border border-border hover:bg-muted transition-colors shadow-lg rounded-full"
          aria-label="Back to top"
        >
          {/* SVG with rotating text and progress */}
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 64 64"
          >
            <defs>
              {/* Circular path for text */}
              <path
                id="textCircle"
                d="M 32, 32 m -22, 0 a 22,22 0 1,1 44,0 a 22,22 0 1,1 -44,0"
                fill="none"
              />
            </defs>
            
            {/* Background circle for progress */}
            <circle
              cx="32"
              cy="32"
              r="26"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              className="text-muted/30"
            />
            
            {/* Progress circle */}
            <motion.circle
              cx="32"
              cy="32"
              r="26"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              className="text-foreground"
              style={{
                strokeDasharray: circumference,
                strokeDashoffset,
                transform: "rotate(-90deg)",
                transformOrigin: "center",
              }}
            />
            
            {/* Rotating text */}
            <motion.g
              animate={{ rotate: 360 }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: "linear",
              }}
              style={{ transformOrigin: "center" }}
            >
              <text
                className="fill-foreground text-[7px] uppercase tracking-[0.3em] font-sans"
              >
                <textPath href="#textCircle" startOffset="0%">
                  BACK TO TOP • BACK TO TOP • 
                </textPath>
              </text>
            </motion.g>
          </svg>
          
          {/* Arrow icon */}
          <ArrowUp size={16} className="relative z-10 text-foreground" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}