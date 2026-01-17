import { Layout } from "@/components/layout/Layout";
import { Section, SectionHeader } from "@/components/ui/section";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

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
      {/* Hero */}
      <section className="pt-32 lg:pt-40 pb-16 lg:pb-20">
        <div className="container mx-auto px-6 lg:px-12 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="font-serif text-4xl md:text-5xl lg:text-6xl font-medium tracking-tight text-foreground"
          >
            Services & Experiences
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-6 text-lg text-muted-foreground font-sans font-light max-w-xl mx-auto"
          >
            Every appointment begins with intention and ends with transformation.
          </motion.p>
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
              <h2 className="font-serif text-2xl md:text-3xl font-medium text-foreground mb-8 pb-4 border-b border-border">
                {category.category}
              </h2>

              <div className="space-y-8">
                {category.items.map((service) => (
                  <div
                    key={service.name}
                    className="group grid grid-cols-1 md:grid-cols-[1fr,2fr] gap-4 md:gap-8 items-start"
                  >
                    <h3 className="font-serif text-lg font-medium text-foreground">
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
      <Section className="bg-secondary py-12 lg:py-16">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-sm text-muted-foreground font-sans leading-relaxed">
            Appointments are reserved specifically for you.
            <br />
            Please review our booking and cancellation policies prior to scheduling.
          </p>
        </div>
      </Section>

      {/* CTA */}
      <Section>
        <div className="text-center">
          <h2 className="font-serif text-2xl md:text-3xl font-medium text-foreground mb-8">
            Ready to Begin?
          </h2>
          <Link
            to="/booking"
            className="inline-flex items-center gap-3 px-10 py-4 text-sm uppercase tracking-[0.2em] font-sans font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Book a Consultation
            <ArrowRight size={16} />
          </Link>
        </div>
      </Section>
    </Layout>
  );
}
