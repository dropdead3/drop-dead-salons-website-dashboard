import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { ArrowUpRight, Phone } from "lucide-react";

export function CTASection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section
      ref={ref}
      data-theme="light"
      className="py-16 lg:py-20 bg-secondary"
    >
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h2 className="font-script text-4xl md:text-5xl lg:text-6xl text-foreground mb-4">
            Book Your Consult
          </h2>
          <p className="text-muted-foreground font-sans text-sm md:text-base mb-8">
            Every great transformation begins with a conversation. Let's plan yours.
          </p>
          
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
            <Link
              to="/booking"
              className="group inline-flex items-center gap-2 px-8 py-3.5 text-sm font-sans bg-foreground text-background rounded-full hover:bg-foreground/90 transition-all duration-300 active:scale-[0.98]"
            >
              <span>Book consult</span>
              <ArrowUpRight size={16} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
            
            <span className="text-muted-foreground text-sm">or call</span>
            
            <a 
              href="tel:+14805551234" 
              className="inline-flex items-center gap-2 text-sm text-foreground hover:text-foreground/70 transition-colors"
            >
              <Phone size={14} />
              <span>North Mesa</span>
            </a>
            
            <span className="text-muted-foreground">·</span>
            
            <a 
              href="tel:+14805555678" 
              className="inline-flex items-center gap-2 text-sm text-foreground hover:text-foreground/70 transition-colors"
            >
              <Phone size={14} />
              <span>Val Vista Lakes</span>
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
