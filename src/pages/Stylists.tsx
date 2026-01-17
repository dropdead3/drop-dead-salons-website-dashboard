import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEO } from "@/components/SEO";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

type Location = "val-vista-lakes" | "north-mesa";
type StylistType = "salon" | "independent";

interface Stylist {
  id: string;
  name: string;
  instagram: string;
  level: string;
  specialties: string[];
  imageUrl: string;
  location: Location;
  type: StylistType;
}

const stylists: Stylist[] = [
  {
    id: "1",
    name: "Kristi D.",
    instagram: "@dropdeadkristi",
    level: "LEVEL III STYLIST",
    specialties: ["BLONDING", "VIVIDS", "EXTENSIONS"],
    imageUrl: "https://images.unsplash.com/photo-1595959183082-7b570b7e1daf?w=600&h=800&fit=crop",
    location: "val-vista-lakes",
    type: "salon"
  },
  {
    id: "2",
    name: "Sarina L.",
    instagram: "@hairdidbysarina_",
    level: "LEVEL II STYLIST",
    specialties: ["EXTENSIONS", "BLONDING", "VIVIDS"],
    imageUrl: "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=600&h=800&fit=crop",
    location: "val-vista-lakes",
    type: "salon"
  },
  {
    id: "3",
    name: "Hayleigh H.",
    instagram: "@lucky7studios_",
    level: "LEVEL II STYLIST",
    specialties: ["BLONDING", "VIVIDS", "EXTENSIONS"],
    imageUrl: "https://images.unsplash.com/photo-1492106087820-71f1a00d2b11?w=600&h=800&fit=crop",
    location: "val-vista-lakes",
    type: "salon"
  },
  {
    id: "4",
    name: "Gavin E.",
    instagram: "@hairbygavinn",
    level: "LEVEL II STYLIST",
    specialties: ["AIRTOUCH", "COLOR BLOCKING", "CREATIVE COLOR"],
    imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=800&fit=crop",
    location: "val-vista-lakes",
    type: "salon"
  },
  {
    id: "5",
    name: "Maya R.",
    instagram: "@mayahairartist",
    level: "LEVEL III STYLIST",
    specialties: ["LAYERED CUTS", "CREATIVE COLOR", "COLOR BLOCKING"],
    imageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&h=800&fit=crop",
    location: "north-mesa",
    type: "salon"
  },
  {
    id: "6",
    name: "Jordan T.",
    instagram: "@jordantcuts",
    level: "LEVEL I STYLIST",
    specialties: ["BLONDING", "VIVIDS", "CUSTOM CUTS"],
    imageUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&h=800&fit=crop",
    location: "north-mesa",
    type: "salon"
  },
  {
    id: "7",
    name: "Alex M.",
    instagram: "@alexmhair",
    level: "INDEPENDENT",
    specialties: ["BLONDES", "BALAYAGE", "LIVED IN COLOR"],
    imageUrl: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&h=800&fit=crop",
    location: "val-vista-lakes",
    type: "independent"
  },
  {
    id: "8",
    name: "Sam K.",
    instagram: "@samkstylist",
    level: "INDEPENDENT",
    specialties: ["VIVIDS", "EXTENSIONS", "LAYERED CUTS"],
    imageUrl: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=600&h=800&fit=crop",
    location: "north-mesa",
    type: "independent"
  }
];

const locations = [
  { id: "val-vista-lakes" as Location, name: "Val Vista Lakes" },
  { id: "north-mesa" as Location, name: "North Mesa" }
];

const StylistCard = ({ stylist }: { stylist: Stylist }) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="group relative aspect-[3/4] bg-muted overflow-hidden"
    >
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
        style={{ backgroundImage: `url(${stylist.imageUrl})` }}
      />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      
      {/* Specialty Tags */}
      <div className="absolute top-4 left-4 right-4 flex flex-wrap gap-2">
        {stylist.specialties.map((specialty, index) => (
          <span
            key={index}
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

const Stylists = () => {
  const [selectedLocation, setSelectedLocation] = useState<Location>("val-vista-lakes");
  const [selectedType, setSelectedType] = useState<StylistType>("salon");

  const filteredStylists = stylists.filter(
    (s) => s.location === selectedLocation && s.type === selectedType
  );

  const salonCount = stylists.filter(
    (s) => s.location === selectedLocation && s.type === "salon"
  ).length;

  const independentCount = stylists.filter(
    (s) => s.location === selectedLocation && s.type === "independent"
  ).length;

  return (
    <Layout>
      <SEO
        title="Our Stylists | Drop Dead Salon"
        description="Meet our talented team of hair stylists. From color specialists to extension experts, find the perfect stylist for your hair goals."
      />

      <section className="pt-32 pb-20 md:pt-40 md:pb-28">
        <div className="container mx-auto px-6">
          {/* Location Toggle */}
          <div className="text-center mb-12">
            <p className="text-xs tracking-[0.2em] text-muted-foreground mb-6">
              VIEW STYLISTS BY LOCATION
            </p>
            
            <div className="inline-flex border border-border bg-background">
              {locations.map((location) => (
                <button
                  key={location.id}
                  onClick={() => setSelectedLocation(location.id)}
                  className={`px-8 py-4 text-base font-medium transition-all duration-300 ${
                    selectedLocation === location.id
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-muted"
                  }`}
                >
                  {location.name}
                </button>
              ))}
            </div>
          </div>

          {/* Stylist Type Tabs */}
          <div className="flex gap-8 mb-10 border-b border-border">
            <button
              onClick={() => setSelectedType("salon")}
              className={`pb-4 text-base font-medium transition-all duration-300 relative ${
                selectedType === "salon"
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Drop Dead Salon Stylists
              <span className="ml-2 text-sm text-muted-foreground">({salonCount})</span>
              {selectedType === "salon" && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground"
                />
              )}
            </button>
            <button
              onClick={() => setSelectedType("independent")}
              className={`pb-4 text-base font-medium transition-all duration-300 relative ${
                selectedType === "independent"
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Independent Stylists
              <span className="ml-2 text-sm text-muted-foreground">({independentCount})</span>
              {selectedType === "independent" && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground"
                />
              )}
            </button>
          </div>

          {/* Stylist Grid */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`${selectedLocation}-${selectedType}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            >
              {filteredStylists.length > 0 ? (
                filteredStylists.map((stylist) => (
                  <StylistCard key={stylist.id} stylist={stylist} />
                ))
              ) : (
                <div className="col-span-full text-center py-20">
                  <p className="text-muted-foreground text-lg">
                    No stylists found for this selection.
                  </p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>
    </Layout>
  );
};

export default Stylists;
