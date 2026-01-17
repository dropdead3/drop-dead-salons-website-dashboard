import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { MapPin, Clock, Phone, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const locations = [
  {
    id: "val-vista-lakes",
    name: "Val Vista Lakes",
    address: "1855 S Val Vista Dr, Suite 107",
    city: "Gilbert, AZ 85295",
    phone: "(480) 555-0123",
    hours: "Tue-Sat: 9am - 7pm",
    image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&h=600&fit=crop",
  },
  {
    id: "north-mesa",
    name: "North Mesa",
    address: "2034 N Power Rd, Suite 101",
    city: "Mesa, AZ 85215",
    phone: "(480) 555-0456",
    hours: "Tue-Sat: 9am - 7pm",
    image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&h=600&fit=crop",
  },
];

export function LocationsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  return (
    <section ref={sectionRef} className="py-20 lg:py-32 bg-foreground text-background">
      <div className="container mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-xs uppercase tracking-[0.3em] text-background/60 font-sans block mb-4">
            Two Locations to Serve You
          </span>
          <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl font-normal">
            Choose Your <em className="italic font-light">Location</em>
          </h2>
        </motion.div>

        {/* Location Cards */}
        <div className="grid md:grid-cols-2 gap-6 lg:gap-8 max-w-5xl mx-auto">
          {locations.map((location, index) => (
            <motion.div
              key={location.id}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              className="group relative bg-background text-foreground overflow-hidden"
            >
              {/* Image */}
              <div className="relative h-48 md:h-56 overflow-hidden">
                <div 
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                  style={{ backgroundImage: `url(${location.image})` }}
                />
                <div className="absolute inset-0 bg-foreground/20" />
              </div>

              {/* Content */}
              <div className="p-6 md:p-8">
                <h3 className="font-serif text-2xl md:text-3xl mb-6">
                  {location.name}
                </h3>

                <div className="space-y-4 mb-8">
                  {/* Address */}
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm">{location.address}</p>
                      <p className="text-sm">{location.city}</p>
                    </div>
                  </div>

                  {/* Hours */}
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    <p className="text-sm">{location.hours}</p>
                  </div>

                  {/* Phone */}
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    <a 
                      href={`tel:${location.phone.replace(/[^0-9]/g, '')}`}
                      className="text-sm hover:underline underline-offset-4"
                    >
                      {location.phone}
                    </a>
                  </div>
                </div>

                {/* CTAs */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    to="/booking"
                    className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium bg-foreground text-background hover:bg-foreground/90 transition-colors group/btn"
                  >
                    Book at This Location
                    <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                  </Link>
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(`${location.address}, ${location.city}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium border border-border hover:bg-muted transition-colors"
                  >
                    Get Directions
                  </a>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
