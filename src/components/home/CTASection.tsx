import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { ArrowUpRight } from "lucide-react";

export function CTASection() {
  const ref = useRef(null);
  
  // Track scroll to hide at page top
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 300], [0, 1]);

  return (
    <motion.section
      ref={ref}
      data-theme="light"
      className="py-10 lg:py-12 bg-secondary"
      style={{ opacity }}
    >
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 lg:gap-12">
          <h2 className="font-script text-3xl md:text-4xl lg:text-5xl text-foreground whitespace-nowrap">
            Book Your Consult
          </h2>
          
          <p className="text-muted-foreground font-sans text-sm md:text-base text-center md:text-left">
            Every great transformation begins with a conversation.
          </p>
          
          <Link
            to="/booking"
            className="group inline-flex items-center gap-2 px-6 py-3 text-sm font-sans bg-foreground text-background rounded-full hover:bg-foreground/90 transition-all duration-300 active:scale-[0.98] whitespace-nowrap"
          >
            <span>Book consult</span>
            <ArrowUpRight size={16} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </motion.section>
  );
}
