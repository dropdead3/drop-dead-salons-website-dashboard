import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Phone, Info, MapPin } from "lucide-react";

const locations = [
  {
    name: "North Mesa",
    address: "2036 N Gilbert Rd Ste 1",
    city: "Mesa, AZ 85203",
    phone: "(480) 548-1886",
    bookingUrl: "/booking?location=north-mesa"
  },
  {
    name: "Val Vista Lakes",
    address: "3641 E Baseline Rd Suite Q-103",
    city: "Gilbert, AZ 85234",
    phone: "(480) 548-1886",
    bookingUrl: "/booking?location=val-vista-lakes"
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
          className="text-center mb-16"
        >
          <p className="text-xs uppercase tracking-[0.2em] text-foreground/50 font-display mb-4">
            Find Us
          </p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display">
            Our Locations
          </h2>
        </motion.div>

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
              className="group relative bg-secondary hover:bg-secondary/80 transition-colors duration-300 p-8 md:p-10 text-center"
            >
              {/* Info Icon with Hours Tooltip */}
              <div className="absolute top-4 right-4">
                <div className="relative group/info">
                  <Info className="w-5 h-5 text-foreground/40 hover:text-foreground/70 transition-colors cursor-pointer" />
                  <div className="absolute right-0 top-full mt-2 opacity-0 invisible group-hover/info:opacity-100 group-hover/info:visible transition-all duration-200 z-10">
                    <div className="bg-foreground text-background text-xs px-4 py-3 whitespace-nowrap shadow-lg">
                      <p className="font-medium mb-1">{hours.open}</p>
                      <p className="text-background/70">{hours.closed}</p>
                    </div>
                  </div>
                </div>
              </div>

              <h3 className="font-display text-2xl md:text-3xl text-foreground mb-4">
                {location.name}
              </h3>
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
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
