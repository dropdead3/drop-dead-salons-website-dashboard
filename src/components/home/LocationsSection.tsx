import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Phone, MapPin } from "lucide-react";
import { SectionHeader } from "@/components/ui/SectionHeader";

const locations = [
  {
    id: "north-mesa",
    name: "North Mesa",
    address: "2036 N Gilbert Rd Ste 1",
    city: "Mesa, AZ 85203",
    phone: "(480) 548-1886",
    bookingUrl: "/booking?location=north-mesa",
    stylistFilterId: "north-mesa",
  },
  {
    id: "val-vista-lakes",
    name: "Val Vista Lakes",
    address: "3641 E Baseline Rd Suite Q-103",
    city: "Gilbert, AZ 85234",
    phone: "(480) 548-1886",
    bookingUrl: "/booking?location=val-vista-lakes",
    stylistFilterId: "val-vista-lakes",
  },
];

const hours = {
  open: "Tue–Sat: 10am–6pm",
  closed: "Closed Sun & Mon"
};

function LocationCard({ location, index }: { location: typeof locations[0]; index: number }) {
  const cardRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: cardRef,
    offset: ["start end", "end start"]
  });

  // Animate based on scroll position
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);
  const y = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [60, 0, 0, -60]);
  const scale = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0.95, 1, 1, 0.95]);

  return (
    <motion.div
      ref={cardRef}
      style={{ opacity, y, scale }}
      className="group relative bg-secondary p-10 md:p-12 text-center overflow-hidden rounded-2xl transition-all duration-500 hover:shadow-xl hover:shadow-foreground/5"
    >
      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-foreground/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Location Title */}
      <h3 className="font-display text-2xl md:text-3xl text-foreground tracking-tight mb-2">
        {location.name}
      </h3>

      {/* Hours */}
      <p className="text-sm text-foreground/50 mb-6">
        {hours.open} · {hours.closed}
      </p>

      {/* Address */}
      <a
        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${location.address}, ${location.city}`)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex flex-col items-center gap-1 mb-5 text-foreground/60 hover:text-foreground transition-colors duration-300 group/maps relative z-10"
      >
        <span className="flex items-center gap-1.5">
          <MapPin className="w-4 h-4" />
          <span className="text-sm">{location.address}</span>
        </span>
        <span className="text-sm">{location.city}</span>
      </a>

      {/* Phone */}
      <a
        href={`tel:${location.phone.replace(/[^0-9]/g, '')}`}
        className="flex items-center justify-center gap-2 text-foreground/60 hover:text-foreground transition-colors duration-300 mb-8 relative z-10"
      >
        <Phone className="w-4 h-4" />
        <span className="text-sm font-medium">{location.phone}</span>
      </a>

      {/* CTAs */}
      <div className="flex flex-col items-center gap-3 relative z-10">
        <Link
          to={location.bookingUrl}
          className="inline-flex items-center justify-center bg-foreground text-background px-6 py-3.5 text-sm font-sans font-medium rounded-full hover:bg-foreground/90 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 group/link w-full overflow-hidden"
        >
          <span>Book consult</span>
          <ArrowRight className="w-0 h-4 opacity-0 group-hover/link:w-4 group-hover/link:ml-2 group-hover/link:opacity-100 transition-all duration-300" />
        </Link>
        <button
          onClick={() => {
            const stylistsSection = document.getElementById('stylists-section');
            if (stylistsSection) {
              stylistsSection.scrollIntoView({ behavior: 'smooth' });
              window.dispatchEvent(new CustomEvent('setLocationFilter', { 
                detail: { location: location.stylistFilterId } 
              }));
            }
          }}
          className="inline-flex items-center justify-center bg-background border border-border text-foreground px-6 py-3.5 text-sm font-sans font-medium rounded-full hover:bg-muted hover:border-foreground/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 group/stylists w-full overflow-hidden"
        >
          <span>Check out the stylists</span>
          <ArrowRight className="w-0 h-4 opacity-0 group-hover/stylists:w-4 group-hover/stylists:ml-2 group-hover/stylists:opacity-100 transition-all duration-300" />
        </button>
      </div>
    </motion.div>
  );
}

export function LocationsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"]
  });

  const headerOpacity = useTransform(scrollYProgress, [0, 0.15, 0.85, 1], [0, 1, 1, 0]);
  const headerY = useTransform(scrollYProgress, [0, 0.15, 0.85, 1], [40, 0, 0, -40]);

  return (
    <section 
      ref={sectionRef}
      data-theme="light"
      className="py-20 md:py-28 bg-background"
    >
      <div className="container mx-auto px-6">
        {/* Header */}
        <motion.div style={{ opacity: headerOpacity, y: headerY }}>
          <SectionHeader
            eyebrow="Find Us"
            title="Our Locations"
            align="center"
            className="mb-12 md:mb-16"
            eyebrowClassName="text-foreground/50"
          />
        </motion.div>

        {/* Location Cards Grid */}
        <div className="grid md:grid-cols-2 gap-6 md:gap-8 max-w-4xl mx-auto">
          {locations.map((location, index) => (
            <LocationCard key={location.id} location={location} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
