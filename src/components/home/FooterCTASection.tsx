import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { ArrowUpRight, Phone } from "lucide-react";

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

export function FooterCTASection() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  // Content moves up slower than scroll for parallax effect
  const y = useTransform(scrollYProgress, [0, 1], [100, -100]);

  return (
    <div 
      ref={containerRef}
      className="relative h-[60vh] md:h-[70vh] overflow-hidden"
      data-theme="dark"
    >
      {/* Fixed background that will show footer behind */}
      <div className="absolute inset-0 bg-foreground" />
      
      {/* Parallax content */}
      <motion.div 
        style={{ y }}
        className="relative h-full flex items-center justify-center"
      >
        <div className="container mx-auto px-6 lg:px-12 text-center">
          {/* Eyebrow */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-background/60 text-xs uppercase tracking-[0.2em] font-sans mb-6"
          >
            Ready for Something Different?
          </motion.p>

          {/* Main headline */}
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="font-serif text-4xl md:text-6xl lg:text-7xl text-background mb-6"
          >
            Book Your <span className="italic">Consult</span>
          </motion.h2>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-background/70 text-base md:text-lg font-sans font-light max-w-xl mx-auto mb-10"
          >
            Every great transformation begins with a conversation. Let's plan yours.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              to="/booking"
              className="group inline-flex items-center gap-3 px-8 py-4 text-base font-sans font-medium bg-background text-foreground rounded-xl hover:bg-background/90 transition-all duration-300 active:scale-[0.98]"
            >
              <span>Book consult</span>
              <ArrowUpRight size={18} className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>

            {/* Phone numbers */}
            <div className="flex items-center gap-2 text-background/60">
              <span className="text-sm font-sans">or call</span>
              {locations.map((loc, index) => (
                <a
                  key={loc.name}
                  href={`tel:${loc.phone.replace(/[^0-9]/g, "")}`}
                  className="inline-flex items-center gap-1.5 text-sm font-sans text-background/80 hover:text-background transition-colors"
                >
                  <Phone size={14} />
                  <span className="hidden sm:inline">{loc.name}</span>
                  {index < locations.length - 1 && <span className="mx-1 text-background/40">·</span>}
                </a>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
