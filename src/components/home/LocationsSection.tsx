import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Phone, Info, MapPin } from "lucide-react";
import { SectionHeader } from "@/components/ui/SectionHeader";

const locations = [
  {
    name: "North Mesa",
    address: "2036 N Gilbert Rd Ste 1",
    city: "Mesa, AZ 85203",
    phone: "(480) 548-1886",
    bookingUrl: "/booking?location=north-mesa",
    stylistFilterId: "north-mesa",
  },
  {
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

export function LocationsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  return (
    <section 
      ref={sectionRef}
      className="py-20 md:py-28 bg-background"
    >
      <div className="container mx-auto px-6">
        {/* Header */}
        <SectionHeader
          eyebrow="Find Us"
          title="Our Locations"
          align="center"
          className="mb-16"
          eyebrowClassName="text-foreground/50"
          animate
          isInView={isInView}
        />

        {/* Location Cards - Side by Side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-5xl mx-auto">
          {locations.map((location, index) => (
              <motion.div
                key={location.name}
                initial={{ opacity: 0, y: 30, filter: "blur(4px)" }}
                animate={isInView ? { opacity: 1, y: 0, filter: "blur(0px)" } : { opacity: 0, y: 30, filter: "blur(4px)" }}
                transition={{ 
                  duration: 0.7, 
                  ease: [0.25, 0.1, 0.25, 1], 
                  delay: 0.2 + index * 0.15 
                }}
                className="group relative bg-secondary p-10 md:p-12 text-center overflow-hidden rounded-2xl transition-all duration-500 hover:shadow-xl hover:shadow-foreground/5 hover:-translate-y-1"
              >

                {/* Top accent line */}
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-foreground/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                {/* Location Title with Info Icon */}
                <div className="flex items-center justify-center gap-2 mb-6 relative z-10">
                  <h3 className="font-display text-2xl md:text-3xl text-foreground whitespace-nowrap tracking-tight">
                    {location.name}
                  </h3>
                  {/* Info Icon with Hours Tooltip */}
                  <div className="relative group/info">
                    <Info className="w-5 h-5 text-foreground/30 hover:text-foreground/70 transition-colors cursor-pointer" />
                    <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 opacity-0 invisible group-hover/info:opacity-100 group-hover/info:visible transition-all duration-200 z-20">
                      <div className="bg-foreground text-background text-xs px-4 py-3 whitespace-nowrap shadow-lg">
                        <p className="font-medium mb-1">{hours.open}</p>
                        <p className="text-background/70">{hours.closed}</p>
                      </div>
                    </div>
                  </div>
                </div>

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
                    className="inline-flex items-center justify-center bg-foreground text-background px-6 py-3.5 text-sm font-sans font-medium rounded-lg hover:bg-foreground/90 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 group/link w-full overflow-hidden"
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
                    className="inline-flex items-center justify-center bg-background border border-border text-foreground px-6 py-3.5 text-sm font-sans font-medium rounded-lg hover:bg-muted hover:border-foreground/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 group/stylists w-full overflow-hidden"
                  >
                    <span>Check out the stylists</span>
                    <ArrowRight className="w-0 h-4 opacity-0 group-hover/stylists:w-4 group-hover/stylists:ml-2 group-hover/stylists:opacity-100 transition-all duration-300" />
                  </button>
                </div>
              </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
