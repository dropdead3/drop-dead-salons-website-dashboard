import { useState } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { useRef } from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { ImageWithSkeleton } from "@/components/ui/image-skeleton";

type Location = "val-vista-lakes" | "north-mesa";

interface Stylist {
  id: string;
  name: string;
  instagram: string;
  level: string;
  specialties: string[];
  imageUrl: string;
  location: Location;
}

const stylists: Stylist[] = [
  {
    id: "1",
    name: "Kristi D.",
    instagram: "@dropdeadkristi",
    level: "LEVEL III STYLIST",
    specialties: ["BLONDING", "VIVIDS", "EXTENSIONS"],
    imageUrl: "https://images.unsplash.com/photo-1595959183082-7b570b7e1daf?w=600&h=800&fit=crop",
    location: "val-vista-lakes"
  },
  {
    id: "2",
    name: "Sarina L.",
    instagram: "@hairdidbysarina_",
    level: "LEVEL II STYLIST",
    specialties: ["EXTENSIONS", "BLONDING", "VIVIDS"],
    imageUrl: "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=600&h=800&fit=crop",
    location: "val-vista-lakes"
  },
  {
    id: "3",
    name: "Hayleigh H.",
    instagram: "@lucky7studios_",
    level: "LEVEL II STYLIST",
    specialties: ["BLONDING", "VIVIDS", "EXTENSIONS"],
    imageUrl: "https://images.unsplash.com/photo-1492106087820-71f1a00d2b11?w=600&h=800&fit=crop",
    location: "val-vista-lakes"
  },
  {
    id: "4",
    name: "Gavin E.",
    instagram: "@hairbygavinn",
    level: "LEVEL II STYLIST",
    specialties: ["AIRTOUCH", "COLOR BLOCKING", "CREATIVE COLOR"],
    imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=800&fit=crop",
    location: "val-vista-lakes"
  },
  {
    id: "5",
    name: "Maya R.",
    instagram: "@mayahairartist",
    level: "LEVEL III STYLIST",
    specialties: ["LAYERED CUTS", "CREATIVE COLOR", "COLOR BLOCKING"],
    imageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&h=800&fit=crop",
    location: "north-mesa"
  },
  {
    id: "6",
    name: "Jordan T.",
    instagram: "@jordantcuts",
    level: "LEVEL I STYLIST",
    specialties: ["BLONDING", "VIVIDS", "CUSTOM CUTS"],
    imageUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&h=800&fit=crop",
    location: "north-mesa"
  }
];

const locations = [
  { id: "val-vista-lakes" as Location, name: "Val Vista Lakes" },
  { id: "north-mesa" as Location, name: "North Mesa" }
];

const StylistCard = ({ stylist, index }: { stylist: Stylist; index: number }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="group relative aspect-[3/4] bg-muted overflow-hidden flex-shrink-0 w-[280px] md:w-[300px]"
    >
      {/* Background Image with Skeleton */}
      <ImageWithSkeleton
        src={stylist.imageUrl}
        alt={`${stylist.name} - ${stylist.level}`}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        wrapperClassName="absolute inset-0"
      />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      
      {/* Specialty Tags */}
      <div className="absolute top-4 left-4 right-4 flex flex-wrap gap-2">
        {stylist.specialties.map((specialty, idx) => (
          <span
            key={idx}
            className="px-3 py-1.5 bg-background/90 backdrop-blur-sm text-foreground text-xs font-medium tracking-wide"
          >
            {specialty}
          </span>
        ))}
      </div>
      
      {/* Stylist Info */}
      <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
        <p className="text-xs tracking-[0.2em] text-white/70 mb-1">{stylist.level}</p>
        <h3 className="text-xl font-serif mb-1">{stylist.name}</h3>
        <p className="text-sm text-white/70 mb-4">{stylist.instagram}</p>
        
        <Link
          to="/booking"
          className="inline-flex items-center gap-2 bg-white text-black px-5 py-2.5 text-sm font-medium hover:bg-white/90 transition-colors duration-300 group/btn"
        >
          <span>Book a service</span>
          <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
        </Link>
      </div>
    </motion.div>
  );
};

export function StylistsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });
  const [selectedLocation, setSelectedLocation] = useState<Location>("val-vista-lakes");

  const filteredStylists = stylists.filter(
    (s) => s.location === selectedLocation
  );

  return (
    <section ref={sectionRef} className="py-20 lg:py-32 bg-secondary overflow-hidden">
      <div className="container mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif mb-4">
            Meet our <em className="not-italic italic">stylists</em>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
            Our talented team of artists are ready to help you achieve your hair goals. 
            Each stylist brings their own unique expertise and creative vision.
          </p>
          
          {/* Location Toggle */}
          <p className="text-xs tracking-[0.2em] text-muted-foreground mb-4">
            VIEW STYLISTS BY LOCATION
          </p>
          
          <div className="inline-flex border border-border bg-background">
            {locations.map((location) => (
              <button
                key={location.id}
                onClick={() => setSelectedLocation(location.id)}
                className={`px-6 md:px-8 py-3 md:py-4 text-sm md:text-base font-medium transition-all duration-300 ${
                  selectedLocation === location.id
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-muted"
                }`}
              >
                {location.name}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Title with count */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8"
        >
          <p className="text-base font-medium">
            Drop Dead Salon Stylists
            <span className="ml-2 text-muted-foreground">({filteredStylists.length})</span>
          </p>
        </motion.div>
      </div>

      {/* Scrolling Cards */}
      <div className="relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedLocation}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex gap-4 overflow-x-auto pb-4"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              paddingLeft: 'max(1.5rem, calc((100vw - 1280px) / 2 + 1.5rem))',
              paddingRight: '1.5rem'
            }}
          >
            {filteredStylists.map((stylist, index) => (
              <StylistCard key={stylist.id} stylist={stylist} index={index} />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* View All Link */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="container mx-auto px-6 mt-10 text-center"
      >
        <Link
          to="/stylists"
          className="inline-flex items-center gap-2 text-sm font-medium group"
        >
          <span className="link-underline">View all stylists</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </motion.div>
    </section>
  );
}
