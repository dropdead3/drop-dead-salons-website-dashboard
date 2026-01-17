import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, ChevronLeft, ChevronRight } from "lucide-react";

const locations = [
  {
    name: "West Hollywood",
    phone: "(323) 555-0123",
  },
  {
    name: "Studio City",
    phone: "(818) 555-0456",
  },
];

export function StickyPhoneSidebar() {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="fixed left-0 top-1/2 -translate-y-1/2 z-40 hidden lg:block">
      <AnimatePresence mode="wait">
        {isExpanded ? (
          <motion.div
            key="expanded"
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -100, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            className="bg-foreground text-background py-6 px-4 flex flex-col items-center gap-6"
          >
            {/* Collapse button */}
            <button
              onClick={() => setIsExpanded(false)}
              className="text-background/60 hover:text-background transition-colors"
              aria-label="Collapse phone sidebar"
            >
              <ChevronLeft size={16} />
            </button>

            {/* Phone numbers - vertical layout */}
            <div className="flex flex-col gap-6">
              {locations.map((location) => (
                <a
                  key={location.name}
                  href={`tel:${location.phone.replace(/[^0-9]/g, "")}`}
                  className="flex flex-col items-center gap-2 group"
                >
                  <Phone size={16} className="text-background/60 group-hover:text-background transition-colors" />
                  <span
                    className="text-xs uppercase tracking-wider font-sans text-background/80 group-hover:text-background transition-colors"
                    style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}
                  >
                    {location.name}
                  </span>
                </a>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.button
            key="collapsed"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -20, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            onClick={() => setIsExpanded(true)}
            className="bg-foreground text-background p-3 hover:bg-foreground/90 transition-colors"
            aria-label="Expand phone sidebar"
          >
            <div className="flex items-center gap-2">
              <Phone size={16} />
              <ChevronRight size={14} />
            </div>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
