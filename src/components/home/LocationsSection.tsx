import { motion, useInView, AnimatePresence } from "framer-motion";
import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Phone, MapPin, Info } from "lucide-react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { TogglePill } from "@/components/ui/toggle-pill";

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

export function LocationsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });
  const [selectedLocation, setSelectedLocation] = useState(locations[0].id);

  const currentLocation = locations.find(loc => loc.id === selectedLocation) || locations[0];

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
          className="mb-10"
          eyebrowClassName="text-foreground/50"
          animate
          isInView={isInView}
        />

        {/* Location Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex justify-center mb-12"
        >
          <TogglePill
            options={locations.map(loc => ({
              value: loc.id,
              label: loc.name,
              icon: <Info className="w-3.5 h-3.5" />,
            }))}
            value={selectedLocation}
            onChange={setSelectedLocation}
            size="default"
            variant="solid"
          />
        </motion.div>

        {/* Single Location Card */}
        <div className="max-w-lg mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentLocation.id}
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.98 }}
              transition={{ 
                duration: 0.3, 
                ease: [0.25, 0.1, 0.25, 1]
              }}
              className="group relative bg-secondary p-10 md:p-12 text-center overflow-hidden rounded-2xl transition-all duration-500 hover:shadow-xl hover:shadow-foreground/5"
            >
              {/* Top accent line */}
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-foreground/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              {/* Location Title */}
              <h3 className="font-display text-2xl md:text-3xl text-foreground tracking-tight mb-2">
                {currentLocation.name}
              </h3>

              {/* Hours */}
              <p className="text-sm text-foreground/50 mb-6">
                {hours.open} · {hours.closed}
              </p>

              {/* Address */}
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${currentLocation.address}, ${currentLocation.city}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex flex-col items-center gap-1 mb-5 text-foreground/60 hover:text-foreground transition-colors duration-300 group/maps relative z-10"
              >
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">{currentLocation.address}</span>
                </span>
                <span className="text-sm">{currentLocation.city}</span>
              </a>

              {/* Phone */}
              <a
                href={`tel:${currentLocation.phone.replace(/[^0-9]/g, '')}`}
                className="flex items-center justify-center gap-2 text-foreground/60 hover:text-foreground transition-colors duration-300 mb-8 relative z-10"
              >
                <Phone className="w-4 h-4" />
                <span className="text-sm font-medium">{currentLocation.phone}</span>
              </a>

              {/* CTAs */}
              <div className="flex flex-col items-center gap-3 relative z-10">
                <Link
                  to={currentLocation.bookingUrl}
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
                        detail: { location: currentLocation.stylistFilterId } 
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
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
