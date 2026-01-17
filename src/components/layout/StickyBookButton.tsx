import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

export function StickyBookButton() {
  const [isVisible, setIsVisible] = useState(false);
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

  if (isBookingPage) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-8 right-8 z-40"
        >
          <Link
            to="/booking"
            className="inline-flex items-center gap-2 px-6 py-4 text-sm uppercase tracking-[0.15em] font-sans font-normal bg-foreground text-background hover:bg-foreground/90 transition-colors shadow-2xl"
          >
            Book Now
            <ArrowUpRight size={14} />
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
