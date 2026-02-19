import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SidebarGreetingProps {
  greeting: string;
  subtitle?: string;
  firstName: string;
}

export function SidebarGreeting({ greeting, subtitle, firstName }: SidebarGreetingProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(false), 7000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          className="overflow-hidden"
        >
          <div className="px-6 py-3 border-b border-border/30">
            <p className="text-xs font-display font-medium tracking-wide text-foreground/90">
              {greeting} <span className="text-foreground/70">{firstName}</span>
            </p>
            {subtitle && (
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
