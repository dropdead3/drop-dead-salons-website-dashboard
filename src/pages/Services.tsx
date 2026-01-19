import { Layout } from "@/components/layout/Layout";
import { SEO } from "@/components/SEO";
import { Section } from "@/components/ui/section";
import { Link } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import { ArrowUpRight, ArrowRight, Sparkles, Clock, Star, UserPlus } from "lucide-react";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { useRef } from "react";

const services = [
  {
    category: "Blonding",
    description: "Expert lightening services from dimensional highlights to full platinum transformations.",
    items: [
      {
        name: "Transformational Blonding",
        description: "Taking hair from single color to lightening the majority. Includes K18 treatment, toner, blowout + hot tool styling.",
        duration: "4 hrs",
        note: null,
        featured: true,
      },
      {
        name: "Full Blonding",
        description: "Traditional full highlight on all sections. Includes K18 treatment, toner, blowout + hot tool styling.",
        duration: "4 hrs 30 mins",
        note: null,
        featured: true,
      },
      {
        name: "Partial Blonding",
        description: "Highlight on mohawk parting and around face. Includes K18 treatment, toner, blowout + hot tool styling.",
        duration: "3 hrs",
        note: null,
        featured: false,
      },
      {
        name: "Mini Highlight",
        description: "Face framing / money piece / hairline 'halo' foil. Includes K18 treatment, toner, blowout + hot tool styling.",
        duration: "2 hrs",
        note: null,
        featured: false,
      },
      {
        name: "Platinum Card",
        description: "All hair lighter with no drop out, or 9+ weeks regrowth retouch. Includes K18, toner + styling.",
        duration: "4 hrs 30 mins",
        note: null,
        featured: false,
      },
      {
        name: "Lightener Retouch",
        description: "Near scalp lightener for 4-8 weeks regrowth maintenance. Includes K18, toner + styling.",
        duration: "2 hrs",
        note: null,
        featured: false,
      },
    ],
  },
  {
    category: "Balayage",
    description: "Hand-painted artistry for natural, sun-kissed dimension and lived-in color.",
    items: [
      {
        name: "Transformational Balayage",
        description: "From single color to multi-dimensional lived-in color. Includes K18 treatment, toner + styling.",
        duration: "4 hrs",
        note: null,
        featured: true,
      },
      {
        name: "Full Balayage",
        description: "Hand-painted highlights throughout for maximum dimension. Includes K18, toner + styling.",
        duration: "4 hrs 30 mins",
        note: null,
        featured: true,
      },
      {
        name: "Partial Balayage",
        description: "Hand-painted highlights focused on face-framing and crown. Includes K18, toner + styling.",
        duration: "3 hrs",
        note: null,
        featured: false,
      },
    ],
  },
  {
    category: "Color Services",
    description: "From natural coverage to bold vivids, tailored color for every vision.",
    items: [
      {
        name: "Single Process Color",
        description: "Single color applied all over. Includes complimentary blowout + hot tool styling.",
        duration: "1 hr 30 mins",
        note: null,
        featured: false,
      },
      {
        name: "Natural Root Retouch",
        description: "Maintenance for 4-8 weeks color regrowth. Includes blowout + hot tool styling.",
        duration: "1 hr 30 mins",
        note: null,
        featured: false,
      },
      {
        name: "Root Smudge",
        description: "8-12 week color retouch for a more lived-in look. Includes blowout + styling.",
        duration: "1 hr 30 mins",
        note: null,
        featured: false,
      },
      {
        name: "Color Melt",
        description: "Multiple formulas melting roots to ends. Natural or vivid tones. Includes blowout + styling.",
        duration: "1 hr 30 mins",
        note: null,
        featured: false,
      },
      {
        name: "Glaze",
        description: "Single color glaze on damp hair for refresh and shine. Includes blowout + styling.",
        duration: "1 hr",
        note: null,
        featured: false,
      },
      {
        name: "Tint Back",
        description: "Returning lightened hair to a darker shade. Includes blowout + styling.",
        duration: "1 hr 30 mins",
        note: null,
        featured: false,
      },
      {
        name: "Color Correction",
        description: "Extensive service to fix poorly serviced or maintained hair. Includes blowout + styling.",
        duration: "4+ hrs",
        note: "Consultation required",
        featured: false,
      },
    ],
  },
  {
    category: "Vivid Colors",
    description: "Bold, creative color for those who dare to stand out.",
    items: [
      {
        name: "Custom Vivid Application",
        description: "Multi-tone vivid color placement. Lightening may be necessary. Includes blowout + styling.",
        duration: "3 hrs 30 mins",
        note: null,
        featured: true,
      },
      {
        name: "Max Vivid",
        description: "Single color vivid application. Lightening may be necessary. Includes blowout + styling.",
        duration: "1 hr",
        note: null,
        featured: false,
      },
      {
        name: "Specialty Vivid",
        description: "Creative vivid placement and techniques. Includes blowout + styling.",
        duration: "1 hr 30 mins",
        note: null,
        featured: false,
      },
      {
        name: "Mini Vivid",
        description: "Small vivid accent pieces. Includes blowout + styling.",
        duration: "1 hr",
        note: null,
        featured: false,
      },
      {
        name: "Split Dye / Color Blocks",
        description: "Bold split or blocked color placement. Multiple options available.",
        duration: "2-3 hrs 30 mins",
        note: null,
        featured: false,
      },
    ],
  },
  {
    category: "Extensions",
    description: "Premium extensions installed with precision for natural volume and length.",
    items: [
      {
        name: "Beaded Row Install - 3 Rows",
        description: "Full beaded row initial install. Includes cutting to blend. Hair cost separate.",
        duration: "2 hrs 30 mins",
        note: "Consultation required",
        featured: true,
      },
      {
        name: "Beaded Row Install - 2 Rows",
        description: "Two row beaded install. Includes cutting to blend. Hair cost separate.",
        duration: "2 hrs",
        note: "Consultation required",
        featured: true,
      },
      {
        name: "Beaded Row Install - 1 Row",
        description: "Single row beaded install. Includes cutting to blend. Hair cost separate.",
        duration: "1 hr 30 mins",
        note: "Consultation required",
        featured: false,
      },
      {
        name: "Beaded Row Reinstall",
        description: "Maintenance reinstall for 1-3 rows. Various options available.",
        duration: "1 hr 30 mins - 3 hrs 30 mins",
        note: "For existing clients",
        featured: false,
      },
      {
        name: "Tape-Ins: Full Head Install",
        description: "Up to 20 tape-in sandwiches. Includes cutting to blend. Hair cost separate.",
        duration: "1 hr",
        note: "Consultation required",
        featured: true,
      },
      {
        name: "Tape-Ins: Half Head / Side Fill",
        description: "10 sandwiches or up to 8 for side fill. Includes cutting to blend.",
        duration: "15-30 mins",
        note: "Consultation required",
        featured: false,
      },
      {
        name: "Tape-Ins: Reinstall",
        description: "Removal and reinstallation for 6-8 week maintenance. Includes shampoo and blow dry.",
        duration: "45 mins - 2 hrs",
        note: "For existing clients",
        featured: false,
      },
      {
        name: "Extension Wash + Blowdry",
        description: "For clients with sewn or tape-in extensions. Does not include hot tool styling.",
        duration: "1 hr",
        note: null,
        featured: false,
      },
    ],
  },
  {
    category: "Cutting & Styling",
    description: "Modern cuts and styles tailored to your features and lifestyle.",
    items: [
      {
        name: "Signature Haircut",
        description: "Our signature cut experience. Includes shampoo + blowdry.",
        duration: "1 hr",
        note: null,
        featured: true,
      },
      {
        name: "Transformation Cut",
        description: "Big change in length or style, not maintaining prior look.",
        duration: "1 hr 30 mins",
        note: "Consultation required",
        featured: true,
      },
      {
        name: "Specialty Cut",
        description: "Creative or technical cutting requiring advanced skills.",
        duration: "1 hr 30 mins",
        note: null,
        featured: false,
      },
      {
        name: "Clipper Cut",
        description: "Clippers used for most of the cut. Includes shampoo + blowdry.",
        duration: "45 mins",
        note: null,
        featured: false,
      },
      {
        name: "Buzz Cut",
        description: "One length clipper cut. Includes shampoo + blowdry.",
        duration: "15 mins",
        note: null,
        featured: false,
      },
      {
        name: "Maintenance Cut",
        description: "Dry cut bang trim, clean up around neck/ears.",
        duration: "15 mins",
        note: null,
        featured: false,
      },
      {
        name: "Undercut",
        description: "One length clipper cut underneath length.",
        duration: "15 mins",
        note: null,
        featured: false,
      },
      {
        name: "Wash + Blowdry",
        description: "Shampoo and style with blow dryer and brush. Hot tools not included.",
        duration: "30 mins",
        note: null,
        featured: false,
      },
    ],
  },
  {
    category: "Treatments & Add-Ons",
    description: "Enhance any service with our restorative treatments.",
    items: [
      {
        name: "K18 Treatment Add-On",
        description: "Can be added to any service. Includes K18 mist and leave-in cream.",
        duration: "5 mins",
        note: null,
        featured: true,
      },
      {
        name: "Hair Mask Add-On",
        description: "Deep conditioning treatment to restore and nourish.",
        duration: "15 mins",
        note: null,
        featured: false,
      },
      {
        name: "Hot Tool Style Add-On",
        description: "Style with flat iron, curling iron, etc. Add-on to other services.",
        duration: "15 mins",
        note: null,
        featured: false,
      },
      {
        name: "Glaze Add-On",
        description: "Single color glaze to be added to other chemical services.",
        duration: "30 mins",
        note: null,
        featured: false,
      },
      {
        name: "Lowlight Add-On",
        description: "Add dimension with lowlights alongside other services.",
        duration: "30 mins",
        note: null,
        featured: false,
      },
      {
        name: "Haircut Add-On",
        description: "Add a cut to any color service.",
        duration: "30 mins",
        note: null,
        featured: false,
      },
      {
        name: "Eyebrow Tint/Bleach",
        description: "Eyebrow coloring or lightening add-on.",
        duration: "15 mins",
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
        
        <div className="flex items-start justify-between gap-4 mb-3">
          <h3 className="font-display text-base lg:text-lg text-foreground leading-tight">
            {service.name}
          </h3>
          <span className="font-display text-sm text-muted-foreground shrink-0">
            {service.duration}
          </span>
        </div>
        
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
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl text-foreground leading-tight">
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
      <section ref={heroRef} className="pt-32 lg:pt-40 pb-8 lg:pb-12" data-theme="light">
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
              className="font-display text-5xl md:text-6xl lg:text-7xl text-foreground leading-[1.05] mb-8"
            >
              Services &<br />
              Experiences
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
        </div>
      </section>

      {/* New Client Notice */}
      <section className="pb-8 lg:pb-12">
        <div className="container mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.3, ease: editorialEasing }}
            className="max-w-4xl"
          >
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 md:p-8">
              <p className="inline-flex items-center gap-2 font-display text-xs tracking-[0.2em] uppercase text-primary mb-3">
                <UserPlus size={14} />
                New Clients
              </p>
              <p className="font-sans text-base md:text-lg text-foreground/80 leading-relaxed mb-4">
                All new clients must request a <span className="text-foreground font-medium">New-Client Consultation</span> to match you with the stylist most skilled for your desired service — and to understand your current look and how to best achieve your vision.
              </p>
              <a
                href="https://drop-dead-gorgeous-az.square.site"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 font-display text-xs tracking-[0.15em] uppercase text-primary hover:text-primary/80 transition-colors"
              >
                Request Consultation
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Quick Navigation Pills */}
      <section className="pb-16 lg:pb-24">
        <div className="container mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.4, ease: editorialEasing }}
            className="flex flex-wrap gap-3"
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

    </Layout>
  );
}
