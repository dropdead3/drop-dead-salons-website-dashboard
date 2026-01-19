import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Phone, MapPin } from "lucide-react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ImageWithSkeleton } from "@/components/ui/image-skeleton";

// Placeholder gallery images - replace with actual salon photos
const locationGalleries: Record<string, string[]> = {
  "north-mesa": [
    "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80",
    "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&q=80",
    "https://images.unsplash.com/photo-1633681926022-84c23e8cb2d6?w=800&q=80",
    "https://images.unsplash.com/photo-1600948836101-f9ffda59d250?w=800&q=80",
  ],
  "val-vista-lakes": [
    "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=800&q=80",
    "https://images.unsplash.com/photo-1559599101-f09722fb4948?w=800&q=80",
    "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=800&q=80",
    "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=800&q=80",
  ],
};

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

function LocationCard({ location, index }: { location: typeof locations[0]; index: number }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  
  const galleryImages = locationGalleries[location.id] || [];
  
  const { scrollYProgress } = useScroll({
    target: cardRef,
    offset: ["start end", "end start"]
  });

  // Stagger the animation start based on index
  const staggerOffset = index * 0.08;
  
  // Animate based on scroll position with staggered timing
  const opacity = useTransform(
    scrollYProgress, 
    [0 + staggerOffset, 0.2 + staggerOffset, 0.75, 0.95], 
    [0, 1, 1, 0]
  );
  const y = useTransform(
    scrollYProgress, 
    [0 + staggerOffset, 0.2 + staggerOffset, 0.75, 0.95], 
    [80, 0, 0, -60]
  );
  const scale = useTransform(
    scrollYProgress, 
    [0 + staggerOffset, 0.2 + staggerOffset, 0.75, 0.95], 
    [0.92, 1, 1, 0.95]
  );

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  return (
    <motion.div
      ref={cardRef}
      style={{ opacity, y, scale }}
      className="group relative h-[420px] md:h-[460px] cursor-pointer perspective-1000"
      onClick={handleFlip}
    >
      <div
        className="relative w-full h-full transition-transform duration-700 ease-out"
        style={{
          transformStyle: "preserve-3d",
          transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)"
        }}
      >
        {/* FRONT OF CARD */}
        <div
          className="absolute inset-0 backface-hidden"
          style={{ backfaceVisibility: "hidden" }}
        >
          <div className="relative w-full h-full bg-secondary p-10 md:p-12 text-center overflow-hidden rounded-2xl transition-all duration-500 flex flex-col">

            {/* Location Title */}
            <h3 className="font-display text-2xl md:text-3xl text-foreground tracking-tight mb-2 whitespace-nowrap">
              {location.name}
            </h3>

            {/* Hours */}
            <p className="text-sm text-foreground/50 mb-6">
              {hours.open} · {hours.closed}
            </p>

            {/* Address */}
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${location.address}, ${location.city}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex flex-col items-center gap-1 mb-5 text-foreground/60 hover:text-foreground transition-colors duration-300 group/maps relative z-10"
            >
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">{location.address}</span>
              </span>
              <span className="text-sm">{location.city}</span>
            </a>

            {/* Phone */}
            <a
              href={`tel:${location.phone.replace(/[^0-9]/g, '')}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center justify-center gap-2 text-foreground/60 hover:text-foreground transition-colors duration-300 mb-8 relative z-10"
            >
              <Phone className="w-4 h-4" />
              <span className="text-sm font-medium">{location.phone}</span>
            </a>

            {/* CTAs and Tap hint container */}
            <div className="relative z-10 mt-auto">
              {/* Tap hint - positioned below buttons, revealed on hover */}
              <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 delay-100">
                <p className="text-sm text-foreground/60 tracking-wide font-aeonik animate-pulse">
                  Tap here to see inside
                </p>
              </div>
              
              {/* CTAs - move up on hover to reveal hint */}
              <div className="flex flex-col items-center gap-3 transform transition-transform duration-300 group-hover:-translate-y-8">
                <Link
                  to={location.bookingUrl}
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center justify-center bg-foreground text-background px-6 py-3.5 text-sm font-sans font-medium rounded-full hover:bg-foreground/90 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 group/link w-full overflow-hidden"
                >
                  <span>Book consult</span>
                  <ArrowRight className="w-0 h-4 opacity-0 group-hover/link:w-4 group-hover/link:ml-2 group-hover/link:opacity-100 transition-all duration-300" />
                </Link>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const stylistsSection = document.getElementById('stylists-section');
                    if (stylistsSection) {
                      stylistsSection.scrollIntoView({ behavior: 'smooth' });
                      window.dispatchEvent(new CustomEvent('setLocationFilter', { 
                        detail: { location: location.stylistFilterId } 
                      }));
                    }
                  }}
                  className="inline-flex items-center justify-center bg-background border border-border text-foreground px-6 py-3.5 text-sm font-sans font-medium rounded-full hover:bg-muted hover:border-foreground/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 group/stylists w-full overflow-hidden"
                >
                  <span>Check out the stylists</span>
                  <ArrowRight className="w-0 h-4 opacity-0 group-hover/stylists:w-4 group-hover/stylists:ml-2 group-hover/stylists:opacity-100 transition-all duration-300" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* BACK OF CARD */}
        <div
          className="absolute inset-0 backface-hidden rotate-y-180"
          style={{ 
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)"
          }}
        >
          <div className="relative w-full h-full bg-secondary overflow-hidden rounded-2xl flex flex-col p-3">
            {/* Asymmetric Bento Box Gallery */}
            <div className="flex-1 grid grid-cols-3 grid-rows-2 gap-2 overflow-hidden rounded-xl">
              {/* Large featured image - spans 2 columns */}
              <div className="relative overflow-hidden rounded-lg col-span-2 row-span-1 group/img">
                <ImageWithSkeleton
                  src={galleryImages[0]}
                  alt={`${location.name} salon interior 1`}
                  className="w-full h-full object-cover transition-all duration-500 group-hover/img:scale-105 group-hover/img:brightness-110"
                  wrapperClassName="w-full h-full"
                />
              </div>
              {/* Top right small image */}
              <div className="relative overflow-hidden rounded-lg group/img">
                <ImageWithSkeleton
                  src={galleryImages[1]}
                  alt={`${location.name} salon interior 2`}
                  className="w-full h-full object-cover transition-all duration-500 group-hover/img:scale-105 group-hover/img:brightness-110"
                  wrapperClassName="w-full h-full"
                />
              </div>
              {/* Bottom left small image */}
              <div className="relative overflow-hidden rounded-lg group/img">
                <ImageWithSkeleton
                  src={galleryImages[2]}
                  alt={`${location.name} salon interior 3`}
                  className="w-full h-full object-cover transition-all duration-500 group-hover/img:scale-105 group-hover/img:brightness-110"
                  wrapperClassName="w-full h-full"
                />
              </div>
              {/* Large bottom right image - spans 2 columns */}
              <div className="relative overflow-hidden rounded-lg col-span-2 row-span-1 group/img">
                <ImageWithSkeleton
                  src={galleryImages[3]}
                  alt={`${location.name} salon interior 4`}
                  className="w-full h-full object-cover transition-all duration-500 group-hover/img:scale-105 group-hover/img:brightness-110"
                  wrapperClassName="w-full h-full"
                />
              </div>
            </div>

            {/* Location name, book button, and tap hint */}
            <div className="pt-4 pb-2 text-center flex flex-col items-center gap-2">
              <h3 className="font-display text-xl text-foreground">{location.name}</h3>
              <Link
                to={location.bookingUrl}
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center justify-center bg-foreground text-background px-5 py-2 text-sm font-sans font-medium rounded-full hover:bg-foreground/90 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
              >
                Book new-client consultation
              </Link>
              <p className="text-[10px] text-foreground/50 tracking-wide font-aeonik">
                Tap to go back
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function LocationsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"]
  });

  const headerOpacity = useTransform(scrollYProgress, [0, 0.15, 0.85, 1], [0, 1, 1, 0]);
  const headerY = useTransform(scrollYProgress, [0, 0.15, 0.85, 1], [40, 0, 0, -40]);

  return (
    <section 
      ref={sectionRef}
      data-theme="light"
      className="py-20 md:py-28 bg-background"
    >
      <div className="container mx-auto px-6">
        {/* Header */}
        <motion.div style={{ opacity: headerOpacity, y: headerY }}>
          <SectionHeader
            eyebrow="Find Us"
            title="Our Locations"
            align="center"
            className="mb-12 md:mb-16"
            eyebrowClassName="text-foreground/50"
          />
        </motion.div>

        {/* Location Cards Grid */}
        <div className="grid md:grid-cols-2 gap-6 md:gap-8 max-w-5xl mx-auto">
          {locations.map((location, index) => (
            <LocationCard key={location.id} location={location} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
