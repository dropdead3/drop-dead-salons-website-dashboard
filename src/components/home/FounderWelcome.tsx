import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import founderHeadshot from "@/assets/founder-headshot.jpg";
import founderSignature from "@/assets/founder-signature.png";

export function FounderWelcome() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  return (
    <section ref={sectionRef} className="py-20 lg:py-32 bg-background">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto text-center">
          {/* Founder Photo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <img
              src={founderHeadshot}
              alt="Kristi Day, Founder of Drop Dead Salon"
              className="w-40 h-40 md:w-48 md:h-48 rounded-full mx-auto object-cover shadow-lg"
            />
          </motion.div>

          {/* Welcome Message */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-4">
              A Note From Our Founder
            </p>
            <h2 className="text-3xl md:text-4xl font-display mb-6">
              Welcome to Drop Dead
            </h2>
            <p className="text-foreground/70 text-lg leading-relaxed max-w-2xl mx-auto mb-8">
              When I opened Drop Dead Salon, my vision was simple: create a space where artistry meets authenticity. 
              A place where you can walk in feeling like yourself and leave feeling like the best version of yourself. 
              Every stylist on our team shares this passion for transformation and the belief that great hair 
              isn't just about looking good—it's about feeling unstoppable.
            </p>
            <p className="text-foreground/70 text-lg leading-relaxed max-w-2xl mx-auto mb-10">
              Thank you for trusting us with your hair. We can't wait to meet you.
            </p>
          </motion.div>

          {/* Signature */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col items-center"
          >
            <img
              src={founderSignature}
              alt="Kristi Day signature"
              className="h-16 md:h-20 w-auto mb-2"
            />
            <p className="text-sm text-muted-foreground">
              Founder & Lead Stylist
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
