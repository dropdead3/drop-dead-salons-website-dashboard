import { Layout } from "@/components/layout/Layout";
import { SEO } from "@/components/SEO";
import { Section } from "@/components/ui/section";
import { Link } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import { ArrowUpRight, ArrowRight, Sparkles, Clock, Star } from "lucide-react";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { useRef } from "react";

const services = [
  {
    category: "Color & Blonding",
    description: "From subtle dimension to bold transformations, our colorists craft personalized results.",
    items: [
      {
        name: "Custom Color",
        description: "Tailored color work designed specifically for you.",
        note: "Pricing determined by consultation",
        featured: false,
      },
      {
        name: "Blonding & Highlights",
        description: "Dimensional, lived-in blonding with expert precision.",
        note: "By consultation",
        featured: true,
      },
      {
        name: "Color Correction",
        description: "Restorative color work to achieve your vision.",
        note: "Consultation required",
        featured: false,
      },
      {
        name: "Root Smudge",
        description: "Seamless root blending for a natural grow-out.",
        note: null,
        featured: false,
      },
      {
        name: "Gray Coverage",
        description: "Natural-looking coverage tailored to your preference.",
        note: null,
        featured: false,
      },
    ],
  },
  {
    category: "Extensions",
    description: "Seamless, high-quality extensions installed with precision using our proprietary methods.",
    items: [
      {
        name: "Drop Dead® Hand-Tied Extensions",
        description: "Our signature hand-tied method for natural volume and length.",
        note: "Consultation required",
        featured: true,
      },
      {
        name: "SecreTape Tape-In Extensions",
        description: "Quick application with seamless, lightweight results.",
        note: "Consultation required",
        featured: true,
      },
      {
        name: "Keratin Tip Extensions",
        description: "Individual strand bonding for versatile styling.",
        note: "Consultation required",
        featured: false,
      },
      {
        name: "Extension Maintenance",
        description: "Keep your extensions looking flawless and fresh.",
        note: "For existing clients",
        featured: false,
      },
    ],
  },
  {
    category: "Cutting & Styling",
    description: "Modern cuts and styles tailored to your features and lifestyle.",
    items: [
      {
        name: "Precision Cut",
        description: "Modern cuts tailored to your features and lifestyle.",
        note: "Includes consultation & styling",
        featured: true,
      },
      {
        name: "Creative Cut",
        description: "Artistry meets precision for unique shapes and styles.",
        note: "Includes consultation & styling",
        featured: false,
      },
      {
        name: "Blowout & Styling",
        description: "Professional styling for any occasion.",
        note: null,
        featured: false,
      },
      {
        name: "Special Occasion Styling",
        description: "Elegant updos and styling for your special moments.",
        note: "Inquire for pricing",
        featured: false,
      },
    ],
  },
  {
    category: "Treatments & Care",
    description: "Restore, rejuvenate, and protect with our curated treatments.",
    items: [
      {
        name: "Deep Conditioning Treatment",
        description: "Intensive treatment to restore and nourish.",
        note: null,
        featured: false,
      },
      {
        name: "Bond Repair Treatment",
        description: "Strengthen and rebuild damaged hair from within.",
        note: null,
        featured: true,
      },
      {
        name: "Brazilian Blowout",
        description: "Smooth, frizz-free results lasting up to 12 weeks.",
        note: null,
        featured: false,
      },
      {
        name: "Scalp Treatment",
        description: "Therapeutic treatments for optimal scalp health.",
        note: null,
        featured: false,
      },
    ],
  },
];

const editorialEasing: [number, number, number, number] = [0.25, 0.1, 0.25, 1];

function ServiceCard({ service, index }: { service: typeof services[0]['items'][0]; index: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.05, ease: editorialEasing }}
      className="group relative"
    >
      <div className="p-6 lg:p-8 bg-card border border-border rounded-2xl transition-all duration-500 hover:border-foreground/20 hover:shadow-lg hover:-translate-y-1">
        {service.featured && (
          <div className="absolute -top-3 right-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-display uppercase tracking-wider bg-foreground text-background rounded-full">
              <Star size={10} className="fill-current" />
              Popular
            </span>
          </div>
        )}
        
        <h3 className="font-serif text-xl lg:text-2xl font-normal text-foreground mb-3 leading-tight">
          {service.name}
        </h3>
        
        <p className="text-muted-foreground font-sans font-light leading-relaxed mb-4">
          {service.description}
        </p>
        
        {service.note && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground/70 font-sans">
            <Clock size={14} />
            <span>{service.note}</span>
          </div>
        )}
        
        {/* Hover arrow */}
        <div className="absolute bottom-6 right-6 lg:bottom-8 lg:right-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <ArrowUpRight size={20} className="text-foreground" />
        </div>
      </div>
    </motion.div>
  );
}

function CategorySection({ category, categoryIndex }: { category: typeof services[0]; categoryIndex: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : {}}
      transition={{ duration: 0.6, ease: editorialEasing }}
      className="scroll-mt-32"
      id={category.category.toLowerCase().replace(/\s+/g, '-').replace(/&/g, 'and')}
    >
      {/* Category Header */}
      <div className="mb-10 lg:mb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.1, ease: editorialEasing }}
          className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 pb-6 border-b border-border"
        >
          <div>
            <Eyebrow className="text-muted-foreground mb-3">
              0{categoryIndex + 1}
            </Eyebrow>
            <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-normal text-foreground leading-tight">
              {category.category}
            </h2>
          </div>
          <p className="text-muted-foreground font-sans font-light max-w-md lg:text-right">
            {category.description}
          </p>
        </motion.div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
        {category.items.map((service, index) => (
          <ServiceCard key={service.name} service={service} index={index} />
        ))}
      </div>
    </motion.div>
  );
}

export default function Services() {
  const heroRef = useRef(null);
  const heroInView = useInView(heroRef, { once: true });

  return (
    <Layout>
      <SEO 
        title="Hair Services - Color, Extensions, Cutting & Treatments"
        description="Explore our luxury hair services including custom color, blonding, extensions, precision cuts, and restorative treatments. Book your transformation today."
      />
      
      {/* Hero */}
      <section ref={heroRef} className="pt-32 lg:pt-40 pb-16 lg:pb-24" data-theme="light">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={heroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, ease: editorialEasing }}
            >
              <Eyebrow className="text-muted-foreground mb-6">
                Our Services
              </Eyebrow>
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={heroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.1, ease: editorialEasing }}
              className="font-serif text-5xl md:text-6xl lg:text-7xl font-normal tracking-tight text-foreground leading-[1.05] mb-8"
            >
              Services &<br />
              <span className="font-light italic">Experiences</span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={heroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2, ease: editorialEasing }}
              className="text-lg md:text-xl text-muted-foreground font-sans font-light max-w-2xl leading-relaxed"
            >
              Every appointment begins with intention and ends with transformation. 
              Explore our full menu of services designed to elevate your look.
            </motion.p>
          </div>

          {/* Quick Navigation Pills */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.3, ease: editorialEasing }}
            className="mt-12 flex flex-wrap gap-3"
          >
            {services.map((category, index) => (
              <a
                key={category.category}
                href={`#${category.category.toLowerCase().replace(/\s+/g, '-').replace(/&/g, 'and')}`}
                className="group inline-flex items-center gap-2 px-5 py-3 text-sm font-sans text-foreground bg-card border border-border rounded-full transition-all duration-300 hover:bg-foreground hover:text-background hover:border-foreground hover:scale-105"
              >
                <span className="text-xs text-muted-foreground group-hover:text-background/70 font-display">0{index + 1}</span>
                {category.category}
              </a>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Services List */}
      <Section className="pt-0 pb-24 lg:pb-32" theme="light">
        <div className="space-y-24 lg:space-y-32">
          {services.map((category, categoryIndex) => (
            <CategorySection 
              key={category.category} 
              category={category} 
              categoryIndex={categoryIndex} 
            />
          ))}
        </div>
      </Section>

      {/* Policy Note */}
      <Section className="bg-secondary py-16 lg:py-20" theme="light">
        <div className="max-w-3xl mx-auto text-center">
          <Sparkles size={32} className="mx-auto mb-6 text-foreground/30" />
          <p className="text-lg font-sans font-light leading-relaxed text-foreground/80 mb-6">
            Appointments are reserved specifically for you. Please review our booking and cancellation policies prior to scheduling.
          </p>
          <Link
            to="/policies"
            className="inline-flex items-center gap-2 text-sm font-sans font-medium text-foreground link-underline"
          >
            View our policies
            <ArrowRight size={14} />
          </Link>
        </div>
      </Section>

      {/* CTA */}
      <Section className="py-24 lg:py-32" theme="light">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, ease: editorialEasing }}
          >
            <Eyebrow className="text-muted-foreground mb-6">
              Start Your Journey
            </Eyebrow>
            
            <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl font-normal text-foreground mb-6 leading-tight">
              Ready to <span className="font-light italic">Begin?</span>
            </h2>
            
            <p className="text-lg text-muted-foreground font-sans font-light mb-10 max-w-xl mx-auto">
              Book your consultation and let's discuss your vision. New clients are required to complete a consultation before booking services.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/booking"
                className="inline-flex items-center gap-3 px-8 py-4 text-sm font-sans font-medium bg-foreground text-background rounded-full transition-all duration-300 hover:bg-foreground/90 hover:scale-105 hover:shadow-lg active:scale-[0.98]"
              >
                Book a Consultation
                <ArrowUpRight size={16} />
              </Link>
              <Link
                to="/extensions"
                className="inline-flex items-center gap-2 px-8 py-4 text-sm font-sans font-medium border border-border text-foreground rounded-full transition-all duration-300 hover:border-foreground hover:scale-105 active:scale-[0.98]"
              >
                Explore Extensions
                <ArrowRight size={16} />
              </Link>
            </div>
          </motion.div>
        </div>
      </Section>
    </Layout>
  );
}
