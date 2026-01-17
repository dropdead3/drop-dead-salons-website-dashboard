import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Section, SectionHeader } from "@/components/ui/section";
import { ArrowRight } from "lucide-react";

const services = [
  {
    title: "Color & Blonding",
    description: "Expert color work from subtle dimension to bold transformation.",
  },
  {
    title: "Extensions",
    description: "Seamless, high-quality extensions installed with precision.",
  },
  {
    title: "Cutting & Styling",
    description: "Modern cuts and styling that complement your unique features.",
  },
  {
    title: "Treatments & Care",
    description: "Restorative treatments that nurture and protect your hair.",
  },
];

export function ServicesPreview() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <Section>
      <SectionHeader
        title="Our Specialties"
        subtitle="We focus on fewer services, executed exceptionally well."
      />

      <div ref={ref} className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
        {services.map((service, index) => (
          <motion.div
            key={service.title}
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            className="group p-8 lg:p-10 bg-card border border-border hover:border-muted-foreground/30 transition-all duration-500"
          >
            <h3 className="font-serif text-xl lg:text-2xl font-medium text-foreground mb-3">
              {service.title}
            </h3>
            <p className="text-muted-foreground font-sans font-light leading-relaxed">
              {service.description}
            </p>
            <div className="mt-6 flex items-center gap-2 text-sm uppercase tracking-[0.15em] text-foreground/60 group-hover:text-foreground transition-colors">
              <span className="font-sans">Learn more</span>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-12 text-center">
        <Link
          to="/services"
          className="inline-flex items-center gap-3 text-sm uppercase tracking-[0.2em] font-sans text-foreground link-underline"
        >
          View All Services
          <ArrowRight size={16} />
        </Link>
      </div>
    </Section>
  );
}
