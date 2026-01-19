import { Layout } from "@/components/layout/Layout";
import { SEO } from "@/components/SEO";
import { Section } from "@/components/ui/section";
import { Link } from "react-router-dom";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { ArrowRight, Sparkles, UserPlus, ChevronDown, Star } from "lucide-react";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { useRef, useState } from "react";
import { services, stylistLevels, type StylistLevel, type ServiceItem, type ServiceCategory } from "@/data/servicePricing";

const editorialEasing: [number, number, number, number] = [0.25, 0.1, 0.25, 1];

function StylistLevelSelector({ 
  selectedLevel, 
  onLevelChange 
}: { 
  selectedLevel: StylistLevel; 
  onLevelChange: (level: StylistLevel) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedItem = stylistLevels.find(l => l.id === selectedLevel);
  const selectedLabel = selectedItem?.label || 'New Talent';
  const selectedClientLabel = selectedItem?.clientLabel || 'Level 1';

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2.5 bg-card border border-border rounded-full text-sm font-sans transition-all duration-300 hover:border-foreground/30"
      >
        <span className="text-muted-foreground">Service Pricing Level:</span>
        <span className="font-medium text-foreground">{selectedClientLabel} Stylist — {selectedLabel}</span>
        <ChevronDown size={16} className={`text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)} 
            />
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute top-full left-0 mt-2 min-w-full w-max bg-card border border-border rounded-xl shadow-lg overflow-hidden z-50"
            >
              {stylistLevels.map((level) => (
                <button
                  key={level.id}
                  onClick={() => {
                    onLevelChange(level.id);
                    setIsOpen(false);
                  }}
                  className={`w-full px-4 py-3 text-left text-sm font-sans transition-colors duration-200 flex items-center justify-between ${
                    selectedLevel === level.id 
                      ? 'bg-foreground text-background' 
                      : 'hover:bg-secondary text-foreground'
                  }`}
                >
                  <span>{level.clientLabel} Stylist — {level.label}</span>
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function ServiceCard({ 
  service, 
  index, 
  selectedLevel,
  isAddOn = false
}: { 
  service: ServiceItem; 
  index: number;
  selectedLevel: StylistLevel;
  isAddOn?: boolean;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  
  const price = service.prices[selectedLevel];
  const hasPrice = price !== null;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.05, ease: editorialEasing }}
      className="group relative"
    >
      {service.isPopular && (
        <div className="absolute -top-2 left-4 z-10">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary text-primary-foreground text-[10px] font-display tracking-wider uppercase rounded-full">
            <Star size={10} className="fill-current" />
            Popular
          </span>
        </div>
      )}
      <div className={`p-5 lg:p-6 bg-card border border-border rounded-xl transition-all duration-500 hover:border-foreground/20 hover:shadow-lg hover:-translate-y-0.5 ${!hasPrice ? 'opacity-50' : ''} ${service.isPopular ? 'border-primary/30' : ''}`}>
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <h3 className="font-display text-sm lg:text-base text-foreground leading-tight tracking-wide">
                {service.name}
              </h3>
              {service.description && (
                <p className="text-xs text-muted-foreground mt-1.5 font-sans font-light leading-relaxed">
                  {service.description}
                </p>
              )}
            </div>
            <div className="flex items-center justify-center shrink-0">
              {hasPrice ? (
                <span className="font-display text-sm text-foreground">
                  {isAddOn ? price : `${price}+`}
                </span>
              ) : (
                <span className="text-xs text-muted-foreground italic">
                  —
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function CategorySection({ 
  category, 
  categoryIndex,
  selectedLevel 
}: { 
  category: ServiceCategory; 
  categoryIndex: number;
  selectedLevel: StylistLevel;
}) {
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
          <ServiceCard 
            key={service.name} 
            service={service} 
            index={index}
            selectedLevel={selectedLevel}
            isAddOn={category.isAddOn}
          />
        ))}
      </div>
    </motion.div>
  );
}

export default function Services() {
  const heroRef = useRef(null);
  const heroInView = useInView(heroRef, { once: true });
  const [selectedLevel, setSelectedLevel] = useState<StylistLevel>('new-talent');

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

      {/* Stylist Level Selector + Pricing Note - Sticky */}
      <div className="sticky top-[120px] z-30 bg-background/95 backdrop-blur-md border-b border-border/50 py-4">
        <div className="container mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.25, ease: editorialEasing }}
            className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6"
          >
            <StylistLevelSelector 
              selectedLevel={selectedLevel}
              onLevelChange={setSelectedLevel}
            />
            <p className="text-sm text-muted-foreground font-sans">
              <span className="font-medium text-foreground">Pricing varies by stylist level</span> and may adjust based on consultation and your unique needs.
            </p>
          </motion.div>
        </div>
      </div>

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
              selectedLevel={selectedLevel}
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
