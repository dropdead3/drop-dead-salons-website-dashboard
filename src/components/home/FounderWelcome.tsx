import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import founderHeadshot from "@/assets/founder-headshot.jpg";
import founderSignature from "@/assets/founder-signature.png";

export function FounderWelcome() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  return (
    <section ref={sectionRef} className="py-16 lg:py-24 bg-background">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-16 items-center">
          {/* Left Column - Founder Photo (1/3) */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="flex justify-center md:justify-center"
          >
            <img
              src={founderHeadshot}
              alt="Kristi Day, Founder of Drop Dead Salon"
              className="w-48 h-48 md:w-56 md:h-56 lg:w-64 lg:h-64 rounded-full object-cover"
            />
          </motion.div>

          {/* Right Column - Welcome Message (2/3) */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="md:col-span-2 text-center md:text-left"
          >
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-4">
              A Note From Our Founder
            </p>
            <h2 className="text-3xl md:text-4xl font-display mb-6">
              Welcome to Drop Dead
            </h2>
            <p className="text-foreground/70 text-lg leading-relaxed mb-6">
              When I opened Drop Dead Salon, my vision was simple: create a space where artistry meets authenticity. 
              A place where you can walk in feeling like yourself and leave feeling like the best version of yourself.
            </p>
            <p className="text-foreground/70 text-lg leading-relaxed mb-8">
              Thank you for trusting us with your hair. We can't wait to meet you.
            </p>

            {/* Signature */}
            <div className="flex flex-col items-center md:items-start">
              <img
                src={founderSignature}
                alt="Kristi Day signature"
                className="h-24 md:h-32 lg:h-36 w-auto mb-2"
              />
              <p className="text-sm text-muted-foreground">
                Founder & Lead Stylist
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
