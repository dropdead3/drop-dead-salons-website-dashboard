import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const milestones = [
  {
    year: "2016",
    title: "The Beginning",
    description: "Drop Dead opens its doors in Gilbert, Arizona with a vision to create an elevated salon experience.",
  },
  {
    year: "2019",
    title: "Growing Family",
    description: "Our team expands to 10 stylists as word spreads about our commitment to artistry and client care.",
  },
  {
    year: "2021",
    title: "Second Location",
    description: "We open our Scottsdale studio to bring the Drop Dead experience to more of the Valley.",
  },
  {
    year: "2024",
    title: "Industry Recognition",
    description: "Named one of Arizona's top salons, with stylists recognized for excellence in color and extensions.",
  },
];

export function StorySection() {
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
          <span className="inline-block text-xs uppercase tracking-[0.25em] text-muted-foreground mb-4 font-display">
            Our Journey
          </span>
          <h2 className="text-3xl md:text-4xl font-display">
            How We Got Here
          </h2>
        </motion.div>

        <div className="max-w-3xl mx-auto">
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-px bg-border md:-translate-x-px" />

            {milestones.map((milestone, index) => (
              <motion.div
                key={milestone.year}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: index * 0.15 }}
                className={`relative flex items-start gap-6 md:gap-12 mb-12 last:mb-0 ${
                  index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                }`}
              >
                {/* Timeline dot */}
                <div className="absolute left-4 md:left-1/2 w-3 h-3 bg-foreground rounded-full -translate-x-1/2 mt-1.5 z-10" />

                {/* Content */}
                <div className={`flex-1 pl-10 md:pl-0 ${index % 2 === 0 ? "md:text-right md:pr-12" : "md:text-left md:pl-12"}`}>
                  <span className="inline-block text-xs uppercase tracking-wider text-foreground/50 mb-2">
                    {milestone.year}
                  </span>
                  <h3 className="text-xl font-display mb-2">{milestone.title}</h3>
                  <p className="text-sm text-foreground/60 leading-relaxed">
                    {milestone.description}
                  </p>
                </div>

                {/* Spacer for alternating layout */}
                <div className="hidden md:block flex-1" />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
