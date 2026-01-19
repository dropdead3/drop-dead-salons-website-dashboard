import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Sparkles, Heart, Users, Palette } from "lucide-react";

const values = [
  {
    icon: Sparkles,
    title: "Artistry First",
    description: "Every stylist is a trained artist. We don't just cut hair—we craft transformations that reflect your unique beauty.",
  },
  {
    icon: Heart,
    title: "Authentic Connection",
    description: "Your chair time is sacred. We listen deeply, understand your vision, and build relationships that last beyond the appointment.",
  },
  {
    icon: Users,
    title: "Community Driven",
    description: "We've built a family of stylists and clients who inspire each other. When you join Drop Dead, you join a movement.",
  },
  {
    icon: Palette,
    title: "Fearless Creativity",
    description: "From subtle enhancements to bold transformations, we encourage you to explore and express yourself without limits.",
  },
];

export function ValuesSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  return (
    <section ref={sectionRef} className="py-16 lg:py-24 bg-background">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 lg:mb-16"
        >
          <span className="inline-block text-xs uppercase tracking-[0.25em] text-muted-foreground mb-4">
            What We Stand For
          </span>
          <h2 className="text-3xl md:text-4xl font-display">
            Our Core Values
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {values.map((value, index) => (
            <motion.div
              key={value.title}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-secondary rounded-2xl p-6 lg:p-8 text-center"
            >
              <div className="w-12 h-12 mx-auto mb-5 rounded-full bg-background flex items-center justify-center">
                <value.icon className="w-5 h-5 text-foreground" />
              </div>
              <h3 className="text-lg font-display mb-3">{value.title}</h3>
              <p className="text-sm text-foreground/60 leading-relaxed">
                {value.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
