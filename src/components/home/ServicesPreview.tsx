import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Section } from "@/components/ui/section";
import { ArrowUpRight } from "lucide-react";

const services = [
  {
    title: "Color & Blonding",
    price: "From $150",
    description: "Expert color work from subtle dimension to bold transformation. Achieve a refined, natural-looking result.",
  },
  {
    title: "Extensions",
    price: "By Consultation",
    description: "Seamless, high-quality extensions installed with precision for natural-looking length and volume.",
  },
  {
    title: "Cutting & Styling",
    price: "From $85",
    description: "Modern cuts and styling that complement your unique features and lifestyle.",
  },
];

export function ServicesPreview() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <Section className="pb-8 lg:pb-12">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground font-sans">
            Explore Our Treatments ↘
          </span>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <Link
            to="/services"
            className="text-sm uppercase tracking-[0.15em] font-sans text-foreground link-underline"
          >
            View All
          </Link>
        </motion.div>
      </div>

      <div ref={ref} className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
        {services.map((service, index) => (
          <motion.div
            key={service.title}
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            className="group"
          >
            {/* Icon placeholder */}
            <div className="w-12 h-12 rounded-full bg-foreground flex items-center justify-center mb-6">
              <span className="text-background text-lg transition-transform duration-300 ease-in-out group-hover:rotate-90">✦</span>
            </div>

            <h3 className="font-serif text-xl lg:text-2xl font-normal text-foreground mb-2">
              {service.title}
            </h3>
            
            <p className="text-sm text-muted-foreground font-sans mb-4">
              {service.price}
            </p>

            <p className="text-sm text-muted-foreground font-sans font-light leading-relaxed mb-6">
              {service.description}
            </p>

            <Link
              to="/services"
              className="inline-flex items-center gap-2 px-4 py-3 text-xs uppercase tracking-[0.15em] font-sans border border-border text-foreground hover:bg-foreground hover:text-background transition-all duration-300 group/btn"
            >
              View Services
              <ArrowUpRight size={14} className="group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
            </Link>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}
