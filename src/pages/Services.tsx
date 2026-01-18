import { Layout } from "@/components/layout/Layout";
import { SEO } from "@/components/SEO";
import { Section } from "@/components/ui/section";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

const services = [
  {
    category: "Color & Blonding",
    items: [
      {
        name: "Custom Color",
        description: "Tailored color work designed specifically for you.",
        note: "Pricing determined by consultation.",
      },
      {
        name: "Blonding & Highlights",
        description: "Dimensional, lived-in blonding with expert precision.",
        note: "By consultation.",
      },
      {
        name: "Color Correction",
        description: "Restorative color work to achieve your vision.",
        note: "Consultation required.",
      },
    ],
  },
  {
    category: "Extensions",
    items: [
      {
        name: "Luxury Extensions",
        description: "Seamless, high-quality extensions installed with precision.",
        note: "Consultation required.",
      },
      {
        name: "Extension Maintenance",
        description: "Keep your extensions looking flawless and fresh.",
        note: "For existing clients.",
      },
    ],
  },
  {
    category: "Cutting & Styling",
    items: [
      {
        name: "Precision Cut",
        description: "Modern cuts tailored to your features and lifestyle.",
        note: "Includes consultation & styling.",
      },
      {
        name: "Blowout & Styling",
        description: "Professional styling for any occasion.",
        note: null,
      },
    ],
  },
  {
    category: "Treatments & Care",
    items: [
      {
        name: "Deep Conditioning",
        description: "Intensive treatment to restore and nourish.",
        note: null,
      },
      {
        name: "Bond Repair",
        description: "Strengthen and rebuild damaged hair.",
        note: null,
      },
    ],
  },
];

export default function Services() {
  return (
    <Layout>
      <SEO 
        title="Hair Services - Color, Extensions, Cutting & Treatments"
        description="Explore our luxury hair services including custom color, blonding, extensions, precision cuts, and restorative treatments. Book your transformation today."
      />
      {/* Hero */}
      <section className="pt-32 lg:pt-40 pb-16 lg:pb-20">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="max-w-3xl">
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-xs uppercase tracking-[0.3em] text-muted-foreground font-sans block mb-6"
            >
              Our Services
            </motion.span>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-serif text-4xl md:text-5xl lg:text-6xl font-normal tracking-tight text-foreground leading-[1.1]"
            >
              Services &
              <br />
              <span className="italic font-light">Experiences</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-8 text-base md:text-lg text-muted-foreground font-sans font-light max-w-lg"
            >
              Every appointment begins with intention and ends with transformation.
            </motion.p>
          </div>
        </div>
      </section>

      {/* Services List */}
      <Section className="pt-0">
        <div className="max-w-4xl mx-auto space-y-16 lg:space-y-24">
          {services.map((category, categoryIndex) => (
            <motion.div
              key={category.category}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: categoryIndex * 0.1 }}
            >
              <h2 className="font-serif text-2xl md:text-3xl font-normal text-foreground mb-8 pb-4 border-b border-border">
                {category.category}
              </h2>

              <div className="space-y-8">
                {category.items.map((service) => (
                  <div
                    key={service.name}
                    className="group grid grid-cols-1 md:grid-cols-[1fr,2fr] gap-4 md:gap-8 items-start"
                  >
                    <h3 className="font-serif text-lg font-normal text-foreground">
                      {service.name}
                    </h3>
                    <div>
                      <p className="text-muted-foreground font-sans font-light leading-relaxed">
                        {service.description}
                      </p>
                      {service.note && (
                        <p className="mt-2 text-sm text-muted-foreground/70 font-sans italic">
                          {service.note}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* Policy Note */}
      <Section className="bg-foreground text-background py-16 lg:py-20">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-sm font-sans font-light leading-relaxed text-background/80">
            Appointments are reserved specifically for you.
            <br />
            Please review our booking and cancellation policies prior to scheduling.
          </p>
        </div>
      </Section>

      {/* CTA */}
      <Section>
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-normal text-foreground mb-4">
            Ready to <span className="italic font-light">Begin?</span>
          </h2>
          <p className="text-muted-foreground font-sans font-light mb-8">
            Book your consultation and let's discuss your vision.
          </p>
          <Link
            to="/booking"
            className="inline-flex items-center gap-2 px-8 py-4 text-sm font-sans font-normal border border-foreground text-foreground hover:bg-foreground hover:text-background transition-all duration-300"
          >
            Book a consultation
            <ArrowUpRight size={14} />
          </Link>
        </div>
      </Section>
    </Layout>
  );
}
