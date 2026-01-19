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
    category: "Color & Blonding",
    description: "From subtle dimension to bold transformations, our colorists craft personalized results.",
    items: [
      {
        name: "Root Color",
        description: "Fresh, seamless root coverage for a polished look.",
        price: "$70+",
        note: null,
        featured: false,
      },
      {
        name: "Full Color",
        description: "All-over color tailored to your desired shade.",
        price: "$90+",
        note: null,
        featured: false,
      },
      {
        name: "Balayage",
        description: "Hand-painted highlights for natural, sun-kissed dimension.",
        price: "$160+",
        note: null,
        featured: true,
      },
      {
        name: "Partial Highlight",
        description: "Dimensional highlights focused on face-framing sections.",
        price: "$90+",
        note: null,
        featured: false,
      },
      {
        name: "Full Highlight",
        description: "All-over highlights for maximum brightness and dimension.",
        price: "$150+",
        note: null,
        featured: true,
      },
      {
        name: "Toner / Glaze",
        description: "Refresh and enhance your color with glossy, vibrant tones.",
        price: "$30+",
        note: null,
        featured: false,
      },
      {
        name: "Color Correction",
        description: "Restorative color work to achieve your vision.",
        price: "By consultation",
        note: "Consultation required",
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
        price: "By consultation",
        note: "Consultation required",
        featured: true,
      },
      {
        name: "SecreTape Tape-In Extensions",
        description: "Quick application with seamless, lightweight results.",
        price: "By consultation",
        note: "Consultation required",
        featured: true,
      },
      {
        name: "Keratin Tip Extensions",
        description: "Individual strand bonding for versatile styling.",
        price: "By consultation",
        note: "Consultation required",
        featured: false,
      },
      {
        name: "Extension Maintenance",
        description: "Keep your extensions looking flawless and fresh.",
        price: "By consultation",
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
        name: "Women's Haircut",
        description: "Precision cut including wash, scalp massage, and blow-dry.",
        price: "$55+",
        note: null,
        featured: true,
      },
      {
        name: "Men's Haircut",
        description: "Classic or modern cuts tailored to your style.",
        price: "$25+",
        note: null,
        featured: false,
      },
      {
        name: "Children's Haircut",
        description: "Gentle, patient service for our youngest guests.",
        price: "$20+",
        note: null,
        featured: false,
      },
      {
        name: "Wash & Blow Dry",
        description: "Professional styling for any occasion.",
        price: "$30+",
        note: null,
        featured: false,
      },
      {
        name: "Updo",
        description: "Elegant styling for your special moments.",
        price: "$85+",
        note: null,
        featured: false,
      },
      {
        name: "Makeup Application",
        description: "Professional makeup for any occasion.",
        price: "$85+",
        note: null,
        featured: false,
      },
    ],
  },
  {
    category: "Treatments & Care",
    description: "Restore, rejuvenate, and protect with our curated treatments.",
    items: [
      {
        name: "Deep Conditioning",
        description: "Intensive treatment to restore and nourish.",
        price: "$30+",
        note: null,
        featured: false,
      },
      {
        name: "Brazilian Blowout",
        description: "Smooth, frizz-free results lasting up to 12 weeks.",
        price: "$300+",
        note: null,
        featured: true,
      },
      {
        name: "GK Keratin Treatment",
        description: "Long-lasting smoothing and shine treatment.",
        price: "$300+",
        note: null,
        featured: true,
      },
      {
        name: "Perm",
        description: "Classic waves and curls with modern techniques.",
        price: "$95+",
        note: null,
        featured: false,
      },
    ],
  },
  {
    category: "Waxing & More",
    description: "Quick, precise grooming services for a polished finish.",
    items: [
      {
        name: "Eyebrow Wax",
        description: "Perfectly shaped brows to frame your face.",
        price: "$10",
        note: null,
        featured: false,
      },
      {
        name: "Lip Wax",
        description: "Quick and gentle upper lip hair removal.",
        price: "$8",
        note: null,
        featured: false,
      },
      {
        name: "Chin Wax",
        description: "Smooth, clean finish for the chin area.",
        price: "$8",
        note: null,
        featured: false,
      },
      {
        name: "Brow Tint",
        description: "Add definition and depth to your brows.",
        price: "$20",
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
          <span className="font-display text-sm text-foreground shrink-0">
            {service.price}
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
