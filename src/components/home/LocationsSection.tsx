import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Phone, Info, MapPin } from "lucide-react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import mapNorthMesa from "@/assets/map-north-mesa.jpg";
import mapValVista from "@/assets/map-val-vista.jpg";

const locations = [
  {
    name: "North Mesa",
    address: "2036 N Gilbert Rd Ste 1",
    city: "Mesa, AZ 85203",
    phone: "(480) 548-1886",
    bookingUrl: "/booking?location=north-mesa",
    mapImage: mapNorthMesa,
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=2036+N+Gilbert+Rd+Ste+1,+Mesa,+AZ+85203"
  },
  {
    name: "Val Vista Lakes",
    address: "3641 E Baseline Rd Suite Q-103",
    city: "Gilbert, AZ 85234",
    phone: "(480) 548-1886",
    bookingUrl: "/booking?location=val-vista-lakes",
    mapImage: mapValVista,
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=3641+E+Baseline+Rd+Suite+Q-103,+Gilbert,+AZ+85234"
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {locations.map((location, index) => (
            <motion.div
              key={location.name}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ 
                duration: 0.6, 
                ease: [0.25, 0.1, 0.25, 1], 
                delay: 0.2 + index * 0.15 
              }}
              className="group relative bg-secondary hover:bg-secondary/80 transition-colors duration-300 overflow-hidden"
            >
              {/* Custom Styled Map Image */}
              <a 
                href={location.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full h-40 md:h-48 bg-muted relative overflow-hidden group/map"
              >
                <img
                  src={location.mapImage}
                  alt={`Map of ${location.name}`}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover/map:scale-105"
                />
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-foreground/0 group-hover/map:bg-foreground/5 transition-colors duration-300 flex items-center justify-center">
                  <span className="opacity-0 group-hover/map:opacity-100 transition-opacity duration-300 text-xs font-medium text-foreground bg-background/90 px-3 py-1.5">
                    Open in Maps
                  </span>
                </div>
              </a>

              <div className="p-8 md:p-10 text-center">
                {/* Location Title with Info Icon */}
                <div className="flex items-center justify-center gap-2 mb-4">
                  <h3 className="font-display text-2xl md:text-3xl text-foreground">
                    {location.name}
                  </h3>
                  {/* Info Icon with Hours Tooltip */}
                  <div className="relative group/info">
                    <Info className="w-5 h-5 text-foreground/40 hover:text-foreground/70 transition-colors cursor-pointer" />
                    <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 opacity-0 invisible group-hover/info:opacity-100 group-hover/info:visible transition-all duration-200 z-10">
                      <div className="bg-foreground text-background text-xs px-4 py-3 whitespace-nowrap shadow-lg">
                        <p className="font-medium mb-1">{hours.open}</p>
                        <p className="text-background/70">{hours.closed}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${location.address}, ${location.city}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex flex-col items-center gap-1 mb-6 text-foreground/70 hover:text-foreground transition-colors group/maps"
                >
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />
                    <span>{location.address}</span>
                  </span>
                  <span>{location.city}</span>
                </a>
                <a
                  href={`tel:${location.phone.replace(/[^0-9]/g, '')}`}
                  className="flex items-center justify-center gap-2 text-foreground/70 hover:text-foreground transition-colors mb-6"
                >
                  <Phone className="w-4 h-4" />
                  <span>{location.phone}</span>
                </a>
                <div>
                  <Link
                    to={location.bookingUrl}
                    className="inline-flex items-center gap-2 text-sm font-sans font-medium text-foreground hover:text-foreground/70 transition-colors group/link"
                  >
                    <span>Book consult</span>
                    <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover/link:translate-x-1" />
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
