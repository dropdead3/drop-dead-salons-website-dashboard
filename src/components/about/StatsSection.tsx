import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { useCounterAnimation } from "@/hooks/use-counter-animation";

const stats = [
  { value: 8, suffix: "+", label: "Years of Excellence" },
  { value: 25, suffix: "+", label: "Expert Stylists" },
  { value: 15, suffix: "K+", label: "Happy Clients" },
  { value: 2, suffix: "", label: "Valley Locations" },
];

function StatItem({ value, suffix, label, delay }: { value: number; suffix: string; label: string; delay: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-50px" });
  const { count, ref: counterRef } = useCounterAnimation({ 
    end: value, 
    duration: 2000,
    startOnView: false 
  });

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay }}
      className="text-center"
    >
      <div className="text-4xl md:text-5xl lg:text-6xl font-display mb-2">
        <span ref={counterRef}>{isInView ? count : 0}</span>{suffix}
      </div>
      <p className="text-sm uppercase tracking-wider text-foreground/50">
        {label}
      </p>
    </motion.div>
  );
}

export function StatsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  return (
    <section ref={sectionRef} className="py-16 lg:py-24 bg-secondary">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 lg:mb-16"
        >
          <span className="inline-block text-xs uppercase tracking-[0.25em] text-muted-foreground mb-4">
            By The Numbers
          </span>
          <h2 className="text-3xl md:text-4xl font-display">
            Our Impact
          </h2>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 max-w-4xl mx-auto">
          {stats.map((stat, index) => (
            <StatItem
              key={stat.label}
              value={stat.value}
              suffix={stat.suffix}
              label={stat.label}
              delay={index * 0.15}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
