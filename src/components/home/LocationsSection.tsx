import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Phone } from "lucide-react";

const locations = [
  {
    name: "West Hollywood",
    address: "8715 Santa Monica Blvd",
    city: "West Hollywood, CA 90069",
    phone: "(323) 555-0123",
    bookingUrl: "/booking?location=weho"
  },
  {
    name: "Studio City",
    address: "12345 Ventura Blvd",
    city: "Studio City, CA 91604",
    phone: "(818) 555-0456",
    bookingUrl: "/booking?location=studio-city"
  }
];

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
          <p className="text-xs uppercase tracking-[0.2em] text-foreground/50 mb-4">
            Find Us
          </p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif">
            Our <em className="italic">Locations</em>
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
              <h3 className="font-serif text-2xl md:text-3xl text-foreground mb-4">
                {location.name}
              </h3>
              <div className="space-y-1 mb-6">
                <p className="text-foreground/70">{location.address}</p>
                <p className="text-foreground/70">{location.city}</p>
              </div>
              <a
                href={`tel:${location.phone.replace(/[^0-9]/g, '')}`}
                className="inline-flex items-center gap-2 text-foreground/70 hover:text-foreground transition-colors mb-6"
              >
                <Phone className="w-4 h-4" />
                <span>{location.phone}</span>
              </a>
              <Link
                to={location.bookingUrl}
                className="inline-flex items-center gap-2 text-sm uppercase tracking-[0.15em] font-medium text-foreground hover:text-foreground/70 transition-colors group/link"
              >
                <span>Book Here</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover/link:translate-x-1" />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
