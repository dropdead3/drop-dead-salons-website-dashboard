import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export function CTASection() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  return (
    <section ref={sectionRef} data-theme="dark" className="py-16 lg:py-24 bg-foreground text-background">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto text-center"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display mb-6">
            Ready to Experience Drop Dead?
          </h2>
          <p className="text-lg text-background/70 mb-8 max-w-xl mx-auto">
            Whether you're looking for a subtle refresh or a bold transformation, 
            our team is ready to bring your vision to life.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/booking"
              className="inline-flex items-center justify-center gap-2 bg-background text-foreground rounded-full px-8 py-3.5 text-sm font-medium hover:bg-background/90 transition-colors group"
            >
              <span>Book Your Consult</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
            <Link
              to="/stylists"
              className="inline-flex items-center justify-center gap-2 border border-background/30 text-background rounded-full px-8 py-3.5 text-sm font-medium hover:bg-background/10 transition-colors"
            >
              Meet Our Stylists
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
