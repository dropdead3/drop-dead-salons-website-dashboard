import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Link } from "react-router-dom";
import { Check, ArrowRight, MapPin } from "lucide-react";

const benefits = [
  "Complimentary Drinks & Snacks",
  "Fun & Friendly Staff",
  "No Judgement, All Are Welcome"
];

const locations = [
  {
    name: "West Hollywood",
    address: "8715 Santa Monica Blvd",
    city: "West Hollywood, CA 90069",
    bookingUrl: "/booking?location=weho"
  },
  {
    name: "Studio City",
    address: "12345 Ventura Blvd",
    city: "Studio City, CA 91604",
    bookingUrl: "/booking?location=studio-city"
  }
];

export const NewClientSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  return (
    <section 
      ref={sectionRef}
      className="py-20 md:py-28 bg-secondary"
    >
      <div className="container mx-auto px-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-10 lg:gap-16">
          {/* Content */}
          <div className="flex-1 max-w-2xl">
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
              className="text-3xl md:text-4xl lg:text-5xl font-serif mb-6"
            >
              New clients can <em className="not-italic font-serif italic">get started here...</em>
            </motion.h2>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1], delay: 0.1 }}
              className="text-foreground/80 text-base md:text-lg leading-relaxed mb-8"
            >
              Let's get you matched to a stylist right for you. We just need a some details from you. 
              You may be required to come in for a consultation to best understand your needs and 
              perhaps even perform a strand test for any lightening or custom color services.
            </motion.p>

            {/* Benefits */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1], delay: 0.2 }}
              className="flex flex-wrap gap-3 mb-10"
            >
              {benefits.map((benefit, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 bg-background border border-border px-4 py-2.5 text-sm"
                >
                  <Check className="w-4 h-4 text-foreground" strokeWidth={2} />
                  <span className="text-foreground">{benefit}</span>
                </div>
              ))}
            </motion.div>

            {/* CTA Button */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1], delay: 0.3 }}
            >
              <Link
                to="/new-client"
                className="inline-flex items-center gap-3 bg-primary text-primary-foreground px-8 py-4 text-base font-medium hover:bg-primary/90 transition-colors duration-300 group"
              >
                <span>Let's Get Started</span>
                <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </motion.div>
          </div>

          {/* Location Cards */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1], delay: 0.25 }}
            className="flex-shrink-0 w-full lg:w-auto"
          >
            <p className="text-xs uppercase tracking-[0.15em] text-foreground/60 mb-4">
              Visit us at one of our locations
            </p>
            <div className="flex flex-col sm:flex-row lg:flex-col gap-4">
              {locations.map((location, index) => (
                <motion.div
                  key={location.name}
                  initial={{ opacity: 0, x: 20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
                  transition={{ 
                    duration: 0.6, 
                    ease: [0.25, 0.1, 0.25, 1], 
                    delay: 0.35 + index * 0.1 
                  }}
                  className="bg-background border border-border p-6 min-w-[280px]"
                >
                  <div className="flex items-start gap-3 mb-4">
                    <MapPin className="w-5 h-5 text-foreground/70 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-foreground mb-1">{location.name}</h3>
                      <p className="text-sm text-foreground/70">{location.address}</p>
                      <p className="text-sm text-foreground/70">{location.city}</p>
                    </div>
                  </div>
                  <Link
                    to={location.bookingUrl}
                    className="inline-flex items-center gap-2 text-sm font-medium text-foreground hover:text-foreground/70 transition-colors group"
                  >
                    <span>Book at this location</span>
                    <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
