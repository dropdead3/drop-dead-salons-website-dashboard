import { Star, Instagram, MapPin, X, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

// Helper to convert text to title case
const toTitleCase = (str: string) => {
  return str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
};

interface StylistCardPreviewProps {
  name: string;
  displayName?: string;
  level: string;
  photoUrl?: string;
  instagram?: string;
  tiktok?: string;
  highlightedServices: string[];
  specialties: string[];
  bio?: string;
  isBooking?: boolean;
  locations?: { id: string; name: string }[];
}

export function StylistCardPreview({
  name,
  displayName,
  level,
  photoUrl,
  instagram,
  tiktok,
  highlightedServices,
  specialties,
  bio,
  isBooking = true,
  locations = [],
}: StylistCardPreviewProps) {
  // Get display items - highlighted services or fallback to specialties
  const displayItems = (highlightedServices && highlightedServices.length > 0)
    ? highlightedServices.slice(0, 3)
    : [...specialties].sort((a, b) => {
        if (a.toUpperCase() === "EXTENSIONS") return -1;
        if (b.toUpperCase() === "EXTENSIONS") return 1;
        return 0;
      }).slice(0, 3);

  const showName = displayName || name || "Your Name";

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="font-medium">Live Preview</span>
        <span className="text-xs">(updates as you type)</span>
      </div>
      
      <div className="flex gap-4">
        {/* Front of card */}
        <div className="relative aspect-[3/4] w-48 bg-muted overflow-hidden rounded-2xl shadow-md group">
          {/* Photo or placeholder */}
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={showName}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-muted to-muted-foreground/20 flex items-center justify-center">
              <span className="text-4xl font-display text-muted-foreground/30">
                {showName.charAt(0)}
              </span>
            </div>
          )}
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-80" />
          
          {/* Specialty badges */}
          <div className="absolute top-3 left-3 right-3 flex flex-wrap gap-1.5">
            {displayItems.length > 0 ? displayItems.map((item) => {
              const isExtensions = item.toUpperCase() === "EXTENSIONS";
              return (
                <span
                  key={item}
                  className={cn(
                    "inline-flex items-center gap-1 px-2 py-1 backdrop-blur-sm text-[10px] font-medium tracking-wide rounded-full",
                    isExtensions
                      ? "bg-oat/90 text-oat-foreground border border-oat-foreground/30 badge-shine"
                      : "bg-background/70 text-foreground border border-border/30"
                  )}
                >
                  {isExtensions && <Star className="w-2.5 h-2.5 fill-current" />}
                  {toTitleCase(item)}
                </span>
              );
            }) : (
              <span className="inline-flex items-center px-2 py-1 bg-background/70 text-foreground/50 border border-border/30 text-[10px] rounded-full">
                No specialties
              </span>
            )}
          </div>
          
          {/* Bottom content */}
          <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
            <p className="text-[10px] tracking-[0.15em] text-white/70 mb-0.5">
              {level || "LEVEL"}
            </p>
            <h3 className="text-sm font-display mb-1">{showName}</h3>
            
            {/* Social Links */}
            <div className="flex items-center gap-2 mb-2">
              {instagram ? (
                <span className="flex items-center gap-1 text-[10px] text-white/70">
                  <Instagram className="w-3 h-3" />
                  <span className="hidden sm:inline truncate max-w-[60px]">{instagram}</span>
                </span>
              ) : null}
              {tiktok ? (
                <span className="flex items-center gap-1 text-[10px] text-white/70">
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
                  </svg>
                  <span className="hidden sm:inline truncate max-w-[60px]">{tiktok}</span>
                </span>
              ) : null}
            </div>
            
            {/* Book button */}
            {isBooking === false ? (
              <div className="inline-flex items-center gap-1 bg-white/20 text-white/70 px-3 py-1.5 text-[10px] font-medium rounded-full cursor-not-allowed border border-white/40">
                <X className="w-3 h-3" />
                <span>Not Booking</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1 bg-white text-black px-3 py-1.5 text-[10px] font-medium rounded-full">
                <span>Book Consult</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            )}
          </div>
        </div>

        {/* Back of card (flip side preview) */}
        <div className="relative aspect-[3/4] w-48 bg-foreground overflow-hidden rounded-2xl shadow-md flex flex-col items-center justify-center p-4 text-center">
          <h3 className="text-base font-display text-background mb-0.5">{showName}</h3>
          <p className="text-[10px] tracking-[0.15em] text-background/60 mb-3">
            {level || "LEVEL"}
          </p>
          
          {/* Bio */}
          <p className="text-[10px] text-background/80 leading-relaxed mb-3 line-clamp-4">
            {bio || <span className="italic text-background/50">Add a bio to tell clients about yourself...</span>}
          </p>
          
          {/* Social Links */}
          <div className="flex items-center justify-center gap-3 mb-2 text-[10px]">
            {instagram && (
              <span className="inline-flex items-center gap-1 text-background/70">
                <Instagram className="w-3 h-3" />
                <span>{instagram}</span>
              </span>
            )}
            {tiktok && (
              <span className="inline-flex items-center gap-1 text-background/70">
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
                </svg>
                <span>{tiktok}</span>
              </span>
            )}
          </div>
          
          {/* Location */}
          {locations.length > 0 && (
            <div className="inline-flex items-center gap-1 text-[10px] text-background/50 mb-3">
              <MapPin className="w-3 h-3" />
              <span>
                {locations.map(l => l.name).join(" & ")}
              </span>
            </div>
          )}
          
          {/* Book button on back */}
          {isBooking !== false && (
            <div className="inline-flex items-center gap-1 bg-background text-foreground px-3 py-1.5 text-[10px] font-medium rounded-full">
              <span>Book Consult</span>
              <ArrowRight className="w-3 h-3" />
            </div>
          )}
        </div>
      </div>
      
      <p className="text-xs text-muted-foreground">
        Front side (left) • Back side when tapped (right)
      </p>
    </div>
  );
}
