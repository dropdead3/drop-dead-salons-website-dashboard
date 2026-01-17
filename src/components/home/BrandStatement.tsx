import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Section } from "@/components/ui/section";

export function BrandStatement() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <div className="relative">
      {/* Slanted top edge */}
      <div 
        className="absolute -top-12 left-0 right-0 h-16 bg-foreground"
        style={{ clipPath: 'polygon(0 100%, 100% 0, 100% 100%, 0 100%)' }}
      />
      <Section className="bg-foreground text-background pt-16">
        <div ref={ref} className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        {/* Left side - Editorial number and title */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.8 }}
        >
          <span className="text-xs font-sans tracking-[0.2em] text-background/50 block mb-4">
            01
          </span>
          <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl font-normal tracking-tight leading-[1.1]">
            Not Your
            <br />
            <span className="italic font-light">Typical Salon.</span>
          </h2>
        </motion.div>

        {/* Right side - Description */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="space-y-6"
        >
          <p className="text-base md:text-lg font-sans font-light leading-relaxed text-background/80">
            In a captivating world where the realms of beauty seamlessly intertwine with the wonders of science, embark on an extraordinary and transformative journey to rejuvenate your hair.
          </p>
          <p className="text-base md:text-lg font-sans font-light leading-relaxed text-background/80">
            Experience an extensive range of innovative treatments meticulously crafted by our artist-led team.
          </p>
        </motion.div>
        </div>
      </Section>
    </div>
  );
}
