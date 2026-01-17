import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

export function StickyBookButton() {
  const [isVisible, setIsVisible] = useState(false);
  const [shine, setShine] = useState(false);
  const location = useLocation();
  const isBookingPage = location.pathname === "/booking";

  useEffect(() => {
    const handleScroll = () => {
      // Show after scrolling past hero
      setIsVisible(window.scrollY > window.innerHeight * 0.5);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Shine animation every 6 seconds
  useEffect(() => {
    if (!isVisible) return;
    
    const interval = setInterval(() => {
      setShine(true);
      setTimeout(() => setShine(false), 800);
    }, 6000);

    // Trigger initial shine after a short delay
    const initialTimeout = setTimeout(() => {
      setShine(true);
      setTimeout(() => setShine(false), 800);
    }, 1000);

    return () => {
      clearInterval(interval);
      clearTimeout(initialTimeout);
    };
  }, [isVisible]);

  if (isBookingPage) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          transition={{ 
            type: "spring",
            stiffness: 400,
            damping: 15,
            mass: 1
          }}
          className="fixed bottom-8 right-8 z-40"
        >
          <Link
            to="/booking"
            className="relative inline-flex items-center gap-2 px-6 py-4 text-sm uppercase tracking-[0.15em] font-sans font-normal bg-foreground text-background hover:bg-foreground/90 transition-colors shadow-2xl overflow-hidden"
          >
            {/* Shine effect */}
            <span
              className={`absolute inset-0 transition-transform duration-700 ease-out ${
                shine ? "translate-x-full" : "-translate-x-full"
              }`}
              style={{
                background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)",
                width: "100%",
              }}
            />
            <span className="relative z-10">Book Consult</span>
            <ArrowUpRight size={14} className="relative z-10" />
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
