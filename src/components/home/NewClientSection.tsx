import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Link } from "react-router-dom";
import { Check, ArrowRight, Sparkles, Heart, Coffee } from "lucide-react";

const benefits = [
  { text: "Complimentary Drinks & Snacks", icon: Coffee },
  { text: "Fun & Friendly Staff", icon: Heart },
  { text: "No Judgement, All Are Welcome", icon: Sparkles }
];

export const NewClientSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  return (
    <section 
      ref={sectionRef}
      data-theme="light"
      className="py-20 md:py-28 bg-secondary"
    >
      <div className="container mx-auto px-6">
        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          
          {/* Main Content Card - Spans 2 columns */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
            className="md:col-span-2 lg:col-span-2 lg:row-span-2 bg-background rounded-3xl p-8 md:p-10 lg:p-12 flex flex-col justify-between min-h-[320px] lg:min-h-[420px]"
          >
            <div>
              <motion.h2
                initial={{ opacity: 0, y: 20, filter: "blur(4px)" }}
                animate={isInView ? { opacity: 1, y: 0, filter: "blur(0px)" } : { opacity: 0, y: 20, filter: "blur(4px)" }}
                transition={{ duration: 0.9, ease: [0.25, 0.1, 0.25, 1], delay: 0.1 }}
                className="text-3xl md:text-4xl lg:text-5xl font-display mb-6 leading-[1.1]"
              >
                New clients can get<br />started here...
              </motion.h2>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1], delay: 0.2 }}
                className="text-foreground/70 text-base md:text-lg leading-relaxed max-w-xl"
              >
                Let's get you matched to a stylist right for you. We just need some details from you. 
                You may be required to come in for a consultation to best understand your needs.
              </motion.p>
            </div>
          </motion.div>

          {/* CTA Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1], delay: 0.15 }}
            className="bg-primary rounded-3xl p-8 flex flex-col justify-between min-h-[200px]"
          >
            <div className="flex justify-end">
              <ArrowRight className="w-8 h-8 text-primary-foreground/60" />
            </div>
            <Link
              to="/booking"
              className="group"
            >
              <span className="text-2xl md:text-3xl font-display text-primary-foreground group-hover:underline underline-offset-4 transition-all">
                Let's Get Started
              </span>
            </Link>
          </motion.div>

          {/* Benefit Cards */}
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1], delay: 0.2 + index * 0.1 }}
                className="bg-background rounded-3xl p-6 md:p-8 flex flex-col justify-between min-h-[160px]"
              >
                <div className="flex items-center justify-between">
                  <Icon className="w-5 h-5 text-foreground/40" />
                  <Check className="w-5 h-5 text-foreground" strokeWidth={2} />
                </div>
                <p className="text-base md:text-lg font-medium text-foreground leading-snug">
                  {benefit.text}
                </p>
              </motion.div>
            );
          })}

        </div>
      </div>
    </section>
  );
};
