import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight, Phone } from "lucide-react";
import { ScrollProgressButton } from "./ScrollProgressButton";

const locations = [
  {
    name: "North Mesa",
    phone: "(480) 548-1886",
  },
  {
    name: "Val Vista Lakes",
    phone: "(480) 548-1886",
  },
];

export function StickyFooterBar() {
  const [isVisible, setIsVisible] = useState(false);
  const location = useLocation();
  const isBookingPage = location.pathname === "/booking";

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > window.innerHeight * 0.5);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (isBookingPage) return null;

  return (
    <>
      {/* Scroll to top - bottom right */}
      <div className="fixed bottom-8 right-8 z-40">
        <AnimatePresence>
          {isVisible && <ScrollProgressButton />}
        </AnimatePresence>
      </div>

      {/* Glassmorphism footer bar */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
            }}
            className="fixed bottom-4 left-4 right-4 md:left-1/2 md:right-auto md:-translate-x-1/2 md:bottom-8 z-40"
          >
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 p-2 bg-foreground/80 backdrop-blur-xl border border-foreground/20 rounded-2xl shadow-2xl shadow-foreground/20">
              {/* Phone buttons row on mobile */}
              <div className="flex items-center gap-1 md:gap-2">
                {locations.map((loc) => (
                  <a
                    key={loc.name}
                    href={`tel:${loc.phone.replace(/[^0-9]/g, "")}`}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 md:px-4 py-3 text-background/70 hover:text-background hover:bg-background/10 rounded-xl transition-all duration-200"
                  >
                    <Phone size={14} />
                    <span className="text-xs font-medium uppercase tracking-wide whitespace-nowrap">
                      {loc.name}
                    </span>
                  </a>
                ))}
              </div>

              {/* Divider - horizontal on mobile, vertical on desktop */}
              <div className="hidden md:block w-px h-8 bg-background/20" />
              <div className="md:hidden w-full h-px bg-background/20" />

              {/* Book CTA */}
              <Link
                to="/booking"
                className="flex items-center justify-center gap-2 px-5 py-3 bg-background text-foreground rounded-xl hover:bg-background/90 transition-all duration-200 group"
              >
                <span className="text-sm font-medium">Book consult</span>
                <ArrowUpRight size={14} className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
