import { useState, useEffect } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { ArrowUp } from "lucide-react";

export function ScrollProgressButton() {
  const [isVisible, setIsVisible] = useState(false);
  const { scrollYProgress } = useScroll();
  
  // Transform scroll progress to stroke dashoffset
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
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
          className="relative w-16 h-16 flex items-center justify-center hover:scale-110 transition-transform cursor-pointer"
          style={{ mixBlendMode: "exclusion" }}
          aria-label="Back to top"
        >
          {/* SVG with rotating text and progress */}
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 64 64"
          >
            <defs>
              {/* Circular path for text - centered at 32,32 */}
              <path
                id="textCircle"
                d="M 32,32 m -24,0 a 24,24 0 1,1 48,0 a 24,24 0 1,1 -48,0"
                fill="none"
              />
            </defs>
            
            {/* Background circle for progress */}
            <circle
              cx="32"
              cy="32"
              r={radius}
              fill="none"
              stroke="black"
              strokeWidth="1"
              opacity="0.2"
            />
            
            {/* Progress circle */}
            <motion.circle
              cx="32"
              cy="32"
              r={radius}
              fill="none"
              stroke="black"
              strokeWidth="1.5"
              strokeLinecap="round"
              style={{
                strokeDasharray: circumference,
                strokeDashoffset,
                transform: "rotate(-90deg)",
                transformOrigin: "32px 32px",
              }}
            />
            
            {/* Rotating text */}
            <motion.g
              animate={{ rotate: 360 }}
              transition={{
                duration: 12,
                repeat: Infinity,
                ease: "linear",
              }}
              style={{ transformOrigin: "32px 32px" }}
            >
              <text
                fill="black"
                fontSize="6"
                fontFamily="sans-serif"
                letterSpacing="0.15em"
                textAnchor="middle"
              >
                <textPath href="#textCircle" startOffset="0%">
                  BACK TO TOP • BACK TO TOP • 
                </textPath>
              </text>
            </motion.g>
            
            {/* Arrow icon centered */}
            <g transform="translate(32, 32)">
              <path
                d="M0 4 L0 -4 M-4 0 L0 -4 L4 0"
                stroke="black"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </g>
          </svg>
        </motion.button>
      )}
    </AnimatePresence>
  );
}