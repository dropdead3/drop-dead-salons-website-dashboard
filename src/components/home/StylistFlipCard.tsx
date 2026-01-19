import { useState } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { ArrowRight, Star, Info, X } from "lucide-react";
import { Link } from "react-router-dom";
import { ImageWithSkeleton } from "@/components/ui/image-skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Stylist, Location } from "@/data/stylists";
import { getLocationName } from "@/data/stylists";

// Helper to convert text to title case
const toTitleCase = (str: string) => {
  return str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
};

interface StylistFlipCardProps {
  stylist: Stylist;
  index: number;
  selectedLocation: Location;
}

export function StylistFlipCard({ stylist, index, selectedLocation }: StylistFlipCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = () => {
    if (stylist.bio) {
      setIsFlipped(!isFlipped);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className="group relative aspect-[3/4] perspective-1000"
    >
      <div
        className={cn(
          "relative w-full h-full transition-transform duration-700 transform-style-3d cursor-pointer",
          isFlipped && "rotate-y-180"
        )}
        onClick={handleFlip}
        style={{
          transformStyle: "preserve-3d",
          transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        {/* Front of card */}
        <div
          className="absolute inset-0 backface-hidden"
          style={{ backfaceVisibility: "hidden" }}
        >
          <div className="relative w-full h-full bg-muted overflow-hidden rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-500">
            <ImageWithSkeleton
              src={stylist.imageUrl}
              alt={`${stylist.name} - ${stylist.level}`}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              wrapperClassName="absolute inset-0"
            />
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-500" />
            
            <div className="absolute top-4 left-4 right-4 flex flex-wrap gap-2">
              {/* Specialty badges - EXTENSIONS first */}
              {[...stylist.specialties].sort((a, b) => {
                if (a === "EXTENSIONS") return -1;
                if (b === "EXTENSIONS") return 1;
                return 0;
              }).map((specialty, idx) => (
                <motion.span
                  key={specialty}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 + index * 0.1 }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 backdrop-blur-sm text-xs font-medium tracking-wide rounded-full ${
                    specialty === "EXTENSIONS"
                      ? "bg-oat/90 text-oat-foreground border border-oat-foreground/30 badge-shine"
                      : "bg-background/70 text-foreground"
                  }`}
                >
                  {specialty === "EXTENSIONS" && <Star className="w-3 h-3 fill-current" />}
                  {toTitleCase(specialty)}
                </motion.span>
              ))}
            </div>
            
            <div className="absolute bottom-0 left-0 right-0 p-5 text-white transform translate-y-6 transition-transform duration-500 ease-out group-hover:translate-y-0">
              <div className="flex items-center gap-1.5 mb-1">
                <p className="text-xs tracking-[0.2em] text-white/70">{stylist.level}</p>
                <TooltipProvider delayDuration={100}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button 
                        className="text-white/50 hover:text-white/90 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Info className="w-3.5 h-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[280px] p-4 bg-background text-foreground border border-border">
                      <p className="font-medium mb-2">Stylist Level System</p>
                      <ul className="text-xs space-y-1.5 text-foreground/80">
                        <li><span className="font-medium text-foreground">Level 1:</span> Rising talent building their craft</li>
                        <li><span className="font-medium text-foreground">Level 2:</span> Skilled stylist with proven expertise</li>
                        <li><span className="font-medium text-foreground">Level 3:</span> Master artist & senior specialist</li>
                        <li><span className="font-medium text-foreground">Level 4:</span> Elite specialist & industry leader</li>
                      </ul>
                      <p className="text-xs text-muted-foreground mt-2">Higher levels reflect experience, training, and demand.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <h3 className="text-xl font-display mb-1">{stylist.name}</h3>
              
              <a 
                href={`https://instagram.com/${stylist.instagram.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-white/70 hover:text-white transition-colors duration-200 block mb-4"
                onClick={(e) => e.stopPropagation()}
              >
                {stylist.instagram}
              </a>
              
              <div className="flex items-center justify-between gap-3">
                {stylist.isBooking === false ? (
                  <div className="shrink-0 inline-flex items-center gap-2 bg-white/20 text-white/70 px-5 py-2.5 text-sm font-medium rounded-full whitespace-nowrap cursor-not-allowed border border-white/40">
                    <X className="w-4 h-4 shrink-0" />
                    <span>Not Booking</span>
                  </div>
                ) : (
                  <Link
                    to="/booking"
                    className="shrink-0 inline-flex items-center gap-2 bg-white text-black px-5 py-2.5 text-sm font-medium rounded-full whitespace-nowrap hover:bg-white/90 hover:shadow-lg transition-all duration-300 group/btn active:scale-[0.98]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span>Book Consult</span>
                    <ArrowRight className="w-4 h-4 shrink-0 transition-transform duration-300 group-hover/btn:translate-x-1" />
                  </Link>
                )}
                
                {/* Location callout */}
                <p className="text-xs text-white/60 text-right leading-tight min-w-0 pr-1">
                  {stylist.locations.length > 1 
                    ? stylist.locations.map(loc => getLocationName(loc)).join(" & ")
                    : getLocationName(stylist.locations[0])
                  }
                </p>
              </div>

              {/* Tap hint - visible on hover */}
              {stylist.bio && (
                <div className="mt-4 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 delay-150 translate-y-2 group-hover:translate-y-0">
                  <span className="w-8 h-px bg-white/40" />
                  <p className="text-xs text-white/80 tracking-widest uppercase font-medium animate-pulse">
                    Tap to learn more
                  </p>
                  <span className="w-8 h-px bg-white/40" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Back of card */}
        <div
          className="absolute inset-0 backface-hidden rotate-y-180"
          style={{ 
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)"
          }}
        >
          <div className="relative w-full h-full bg-foreground overflow-hidden rounded-2xl shadow-md flex flex-col items-center justify-center p-6 text-center">
            {/* Circular headshot */}
            <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-background/20 mb-5 shadow-lg">
              <ImageWithSkeleton
                src={stylist.imageUrl}
                alt={stylist.name}
                className="w-full h-full object-cover"
                wrapperClassName="w-full h-full"
              />
            </div>

            {/* Name */}
            <h3 className="text-xl font-display text-background mb-1">{stylist.name}</h3>
            <p className="text-xs tracking-[0.2em] text-background/60 mb-4">{stylist.level}</p>

            {/* Bio */}
            <p className="text-sm text-background/80 leading-relaxed max-w-[90%]">
              {stylist.bio || "No bio available"}
            </p>

            {/* Book button */}
            <div className="mt-6">
              {stylist.isBooking !== false && (
                <Link
                  to="/booking"
                  className="inline-flex items-center gap-2 bg-background text-foreground px-5 py-2.5 text-sm font-medium rounded-full whitespace-nowrap hover:bg-background/90 hover:shadow-lg transition-all duration-300 group/btn active:scale-[0.98]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span>Book Consult</span>
                  <ArrowRight className="w-4 h-4 shrink-0 transition-transform duration-300 group-hover/btn:translate-x-1" />
                </Link>
              )}
            </div>

            {/* Tap hint */}
            <p className="text-[10px] text-background/40 mt-4 tracking-wide">
              Tap to go back
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
