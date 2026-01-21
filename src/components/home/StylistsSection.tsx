import { useState, useRef, useEffect, memo, useCallback, startTransition } from "react";
import { cn } from "@/lib/utils";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { ArrowRight, Sparkles, Info, Star, X, CheckCircle, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { ImageWithSkeleton } from "@/components/ui/image-skeleton";
import { toast } from "@/hooks/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { TogglePill } from "@/components/ui/toggle-pill";
import { StylistFlipCard } from "./StylistFlipCard";


import { stylists, locations, allSpecialties, stylistLevels, getLocationName, type Stylist, type Location } from "@/data/stylists";

// Helper to convert text to title case
const toTitleCase = (str: string) => {
  return str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
};

// Expanded Application Form Component
function ExpandedApplicationForm({ onClose }: { onClose: () => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    instagram: "",
    experience: "",
    clientBook: "",
    specialties: "",
    whyDropDead: "",
  });

  const validateForm = () => {
    const missingFields: string[] = [];
    
    if (!formData.name.trim()) missingFields.push("Full Name");
    if (!formData.email.trim()) missingFields.push("Email");
    if (!formData.phone.trim()) missingFields.push("Phone");
    if (!formData.experience) missingFields.push("Experience");
    if (!formData.clientBook) missingFields.push("Current Client Book");
    if (!formData.specialties.trim()) missingFields.push("Your Specialties");
    if (!formData.whyDropDead.trim()) missingFields.push("Why Drop Dead");
    
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email.trim() && !emailRegex.test(formData.email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return false;
    }
    
    if (missingFields.length > 0) {
      toast({
        title: "Required Fields Missing",
        description: `Please fill out: ${missingFields.join(", ")}`,
        variant: "destructive",
      });
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log("Application submitted:", formData);
    setIsSubmitting(false);
    setIsSubmitted(true);
    // Auto-close after showing success
    setTimeout(() => {
      onClose();
    }, 3000);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Success state
  if (isSubmitted) {
    return (
      <motion.div 
        className="w-full max-w-2xl mx-auto text-center py-12"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1, type: "spring", stiffness: 200 }}
          className="w-20 h-20 mx-auto mb-6 rounded-full bg-foreground/10 flex items-center justify-center"
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.4, delay: 0.3, type: "spring", stiffness: 200 }}
          >
            <CheckCircle className="w-10 h-10 text-foreground" />
          </motion.div>
        </motion.div>
        
        <motion.h3
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="text-2xl md:text-3xl font-display mb-3"
        >
          Application Received!
        </motion.h3>
        
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="text-foreground/60 text-sm max-w-sm mx-auto mb-6"
        >
          Thank you for your interest in joining Drop Dead. We'll review your application and get back to you soon.
        </motion.p>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.6 }}
          className="flex justify-center gap-1"
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-foreground/30"
              animate={{ scale: [1, 1.3, 1] }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </motion.div>
      </motion.div>
    );
  }


  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-foreground/50" />
          <p className="text-xs uppercase tracking-[0.2em] text-foreground/50">
            Join Our Team
          </p>
        </div>
        <h3 className="text-2xl md:text-3xl font-display mb-2">
          Apply to Drop Dead
        </h3>
        <p className="text-foreground/60 text-sm">
          Fill out the form below and we'll be in touch soon.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <label className="text-xs uppercase tracking-wider text-foreground/70 mb-1.5 block">Full Name *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleChange("name", e.target.value)}
            placeholder="Your name"
            className="w-full px-4 py-2.5 bg-background border border-border rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs uppercase tracking-wider text-foreground/70 mb-1.5 block">Email *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              placeholder="you@email.com"
              className="w-full px-4 py-2.5 bg-background border border-border rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-foreground/70 mb-1.5 block">Phone *</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              placeholder="(555) 555-5555"
              className="w-full px-4 py-2.5 bg-background border border-border rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs uppercase tracking-wider text-foreground/70 mb-1.5 block">Instagram</label>
            <input
              type="text"
              value={formData.instagram}
              onChange={(e) => handleChange("instagram", e.target.value)}
              placeholder="@yourusername"
              className="w-full px-4 py-2.5 bg-background border border-border rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-foreground/70 mb-1.5 block">Experience *</label>
            <Select value={formData.experience} onValueChange={(value) => handleChange("experience", value)}>
              <SelectTrigger className="w-full h-11 bg-background border border-border rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0-2">0-2 years</SelectItem>
                <SelectItem value="2-5">2-5 years</SelectItem>
                <SelectItem value="5-10">5-10 years</SelectItem>
                <SelectItem value="10+">10+ years</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <label className="text-xs uppercase tracking-wider text-foreground/70 mb-1.5 block">Current Client Book *</label>
          <Select value={formData.clientBook} onValueChange={(value) => handleChange("clientBook", value)}>
            <SelectTrigger className="w-full h-11 bg-background border border-border rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="less-than-10">Less than 10</SelectItem>
              <SelectItem value="10-20">10-20 clients</SelectItem>
              <SelectItem value="20-30">20-30 clients</SelectItem>
              <SelectItem value="30-50">30-50 clients</SelectItem>
              <SelectItem value="50+">50+ clients</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-xs uppercase tracking-wider text-foreground/70 mb-1.5 block">Your Specialties *</label>
          <textarea
            value={formData.specialties}
            onChange={(e) => handleChange("specialties", e.target.value)}
            placeholder="e.g., balayage, extensions, vivid colors..."
            rows={2}
            className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20 resize-none"
          />
        </div>

        <div>
          <label className="text-xs uppercase tracking-wider text-foreground/70 mb-1.5 block">Why Drop Dead? *</label>
          <textarea
            value={formData.whyDropDead}
            onChange={(e) => handleChange("whyDropDead", e.target.value)}
            placeholder="Tell us what excites you about joining our team..."
            rows={3}
            className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20 resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full inline-flex items-center justify-center gap-2 bg-foreground text-background rounded-full px-6 py-3 text-sm font-medium hover:bg-foreground/90 transition-colors group disabled:opacity-50"
        >
          <span>{isSubmitting ? "Submitting..." : "Submit Application"}</span>
          <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
        </button>
      </form>
    </div>
  );
}

// Join Team Card with dynamic column spanning and expanding form animation
function JoinTeamCardComponent({ 
  stylistCount, 
  isExpanded,
  onToggleExpand
}: { 
  stylistCount: number; 
  isExpanded: boolean;
  onToggleExpand: () => void;
}) {
  // Calculate remaining spots for xl (4 cols)
  const remainderXl = stylistCount % 4;
  const spanXl = remainderXl === 0 ? 4 : 4 - remainderXl;
  
  // For lg (3 cols)
  const remainderLg = stylistCount % 3;
  const spanLg = remainderLg === 0 ? 3 : 3 - remainderLg;
  
  // For sm (2 cols)
  const remainderSm = stylistCount % 2;
  const spanSm = remainderSm === 0 ? 2 : 2 - remainderSm;

  // Use predefined classes based on calculated spans
  const getSpanClass = () => {
    const xlClass = spanXl === 4 ? 'xl:col-span-4' : spanXl === 3 ? 'xl:col-span-3' : spanXl === 2 ? 'xl:col-span-2' : 'xl:col-span-1';
    const lgClass = spanLg === 3 ? 'lg:col-span-3' : spanLg === 2 ? 'lg:col-span-2' : 'lg:col-span-1';
    const smClass = spanSm === 2 ? 'sm:col-span-2' : 'sm:col-span-1';
    
    return `col-span-1 ${smClass} ${lgClass} ${xlClass}`;
  };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setTimeout(() => {
      onToggleExpand();
    }, 0);
  };

  return (
    <motion.div
      layout
      className={`${getSpanClass()} relative bg-muted/50 border border-foreground/15 rounded-2xl flex flex-col items-center justify-center p-8`}
      animate={{
        minHeight: isExpanded ? "auto" : 300,
      }}
      transition={{ 
        duration: 0.8, 
        ease: [0.4, 0, 0.2, 1],
        layout: { duration: 0.8, ease: [0.4, 0, 0.2, 1] }
      }}
    >
      <AnimatePresence mode="wait">
        {!isExpanded ? (
          <motion.div 
            key="card-content"
            className="text-center"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92, y: 10 }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          >
            <div className="flex items-center justify-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-foreground/50" />
              <p className="text-xs uppercase tracking-[0.2em] text-foreground/50">
                Join Our Team
              </p>
            </div>
            <h3 className="text-2xl md:text-3xl font-display mb-3">
              Work at Drop Dead
            </h3>
            <p className="text-foreground/60 text-sm max-w-sm mx-auto mb-5">
              Passionate stylist looking for your next opportunity? We'd love to hear from you.
            </p>
            
            <button
              type="button"
              onClick={handleClick}
              className="inline-flex items-center gap-2 text-sm font-sans font-medium text-foreground hover:text-foreground/70 transition-colors group"
            >
              <span>Apply now</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
            </button>
          </motion.div>
        ) : (
          <motion.div 
            key="form-content"
            className="w-full"
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.6, delay: 0.15, ease: [0.4, 0, 0.2, 1] }}
          >
            <ExpandedApplicationForm onClose={onToggleExpand} />
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Close button when expanded */}
      <AnimatePresence>
        {isExpanded && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.4, delay: 0.25 }}
            type="button"
            onClick={handleClick}
            className="absolute right-4 top-4 rounded-full p-2 bg-foreground/5 hover:bg-foreground/10 transition-colors"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

const JoinTeamCard = memo(JoinTeamCardComponent);

const StylistCard = ({ stylist, index, selectedLocation }: { stylist: Stylist; index: number; selectedLocation: Location }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      whileHover={{ y: -4 }}
      className="group relative aspect-[3/4] bg-muted overflow-hidden rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-500"
    >
      <ImageWithSkeleton
        src={stylist.imageUrl}
        alt={`${stylist.name} - ${stylist.level}`}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        wrapperClassName="absolute inset-0"
      />
      
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-500" />
      
      <div className="absolute top-4 left-4 right-4 flex flex-wrap gap-2">
        {/* Display highlighted_services if available, otherwise fall back to specialties */}
        {(() => {
          const displayItems = (stylist.highlighted_services && stylist.highlighted_services.length > 0)
            ? stylist.highlighted_services.slice(0, 3)
            : [...stylist.specialties].sort((a, b) => {
                if (a === "EXTENSIONS") return -1;
                if (b === "EXTENSIONS") return 1;
                return 0;
              });
          
          return displayItems.map((item, idx) => (
            <motion.span
              key={item}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 + index * 0.1 }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 backdrop-blur-sm text-xs font-medium tracking-wide rounded-full ${
                item === "EXTENSIONS" || stylist.specialties.includes("EXTENSIONS")
                  ? "bg-oat/90 text-oat-foreground border border-oat-foreground/30 badge-shine"
                  : "bg-background/70 text-foreground"
              }`}
            >
              {item === "EXTENSIONS" && <Star className="w-3 h-3 fill-current" />}
              {toTitleCase(item)}
            </motion.span>
          ));
        })()}
      </div>
      
      <div className="absolute bottom-0 left-0 right-0 p-5 text-white transform transition-transform duration-500 group-hover:translate-y-[-4px]">
        <div className="flex items-center gap-1.5 mb-1">
          <p className="text-xs tracking-[0.2em] text-white/70">{stylist.level}</p>
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="text-white/50 hover:text-white/90 transition-colors">
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
      </div>
    </motion.div>
  );
};

export function StylistsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });
  const [selectedLocation, setSelectedLocation] = useState<Location | "all">("all");
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [randomSeed] = useState(() => Math.random()); // Fixed seed for consistent randomization during session
  
  const [isFormExpanded, setIsFormExpanded] = useState(false);

  // Listen for location filter events from LocationsSection
  useEffect(() => {
    const handleLocationFilter = (e: CustomEvent<{ location: Location | "all" }>) => {
      setSelectedLocation(e.detail.location);
      // Reset other filters when switching location
      setSelectedSpecialty(null);
      setSelectedLevel(null);
    };

    window.addEventListener('setLocationFilter', handleLocationFilter as EventListener);
    return () => {
      window.removeEventListener('setLocationFilter', handleLocationFilter as EventListener);
    };
  }, []);

  // Seeded random shuffle function for consistent ordering
  const shuffleArray = <T,>(array: T[], seed: number): T[] => {
    const shuffled = [...array];
    let currentSeed = seed;
    for (let i = shuffled.length - 1; i > 0; i--) {
      currentSeed = (currentSeed * 9301 + 49297) % 233280;
      const j = Math.floor((currentSeed / 233280) * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const levelOrder: Record<string, number> = {
    "LEVEL 4 STYLIST": 1,
    "LEVEL 3 STYLIST": 2,
    "LEVEL 2 STYLIST": 3,
    "LEVEL 1 STYLIST": 4
  };

  const filteredStylists = shuffleArray(
    stylists
      .filter((s) => {
        const matchesLocation = selectedLocation === "all" || s.locations.includes(selectedLocation);
        const matchesSpecialty = !selectedSpecialty || s.specialties.includes(selectedSpecialty);
        const matchesLevel = !selectedLevel || s.level === selectedLevel;
        return matchesLocation && matchesSpecialty && matchesLevel;
      }),
    randomSeed
  );

  const handleToggleFormExpand = useCallback(() => {
    startTransition(() => {
      setIsFormExpanded(prev => !prev);
    });
  }, []);

  return (
    <section ref={sectionRef} id="stylists-section" data-theme="light" className="relative py-20 lg:py-32 bg-secondary overflow-visible pb-0">
      {/* Gradient transition from previous section */}
      <div 
        className="absolute top-0 left-0 right-0 h-24 sm:h-32 md:h-40 -translate-y-full pointer-events-none"
        style={{ 
          background: 'linear-gradient(180deg, hsl(var(--background)) 0%, hsl(var(--secondary)) 100%)' 
        }}
      />
      {/* Gradient fade at bottom of section */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-40 sm:h-52 md:h-64 pointer-events-none z-10"
        style={{ 
          background: 'linear-gradient(180deg, transparent 0%, hsl(var(--secondary)) 100%)' 
        }}
      />
      <div className="container mx-auto px-6">
        {/* Header */}
        <SectionHeader
          title="Meet our stylists"
          description="Our talented team of artists are ready to help you achieve your hair goals. Each stylist brings their own unique expertise and creative vision."
          align="center"
          className="mb-8"
          animate
          isInView={isInView}
        />

        <div className="text-center">
          <Eyebrow className="text-muted-foreground mb-4">
            VIEW STYLISTS BY LOCATION
          </Eyebrow>
          
          <TogglePill
            options={[
              { value: "all", label: "All", icon: <Info className="w-3.5 h-3.5" />, tooltip: "View all stylists from both locations" },
              ...locations.map(loc => ({
                value: loc.id,
                label: loc.name,
                icon: <Info className="w-3.5 h-3.5" />,
                tooltip: `${loc.address}\n${loc.hours}`,
              }))
            ]}
            value={selectedLocation}
            onChange={(val) => setSelectedLocation(val as Location | "all")}
            size="lg"
            variant="solid"
          />

          {/* Filters */}
          <div className="mt-8 flex flex-col gap-8 items-center">
            {/* Specialty Filter */}
            <div>
              <Eyebrow className="text-muted-foreground mb-4">
                VIEW BY SPECIALTY
              </Eyebrow>
              <div className="flex flex-wrap justify-center gap-2">
                <motion.button
                  onClick={() => setSelectedSpecialty(null)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  animate={{
                    backgroundColor: selectedSpecialty === null ? "hsl(var(--foreground))" : "hsl(var(--background))",
                    color: selectedSpecialty === null ? "hsl(var(--background))" : "hsl(var(--foreground))",
                  }}
                  transition={{ duration: 0.2 }}
                  className="px-5 py-2.5 text-sm font-medium border border-border rounded-full"
                >
                  All
                </motion.button>
                {allSpecialties.map((specialty) => (
                  <motion.button
                    key={specialty}
                    onClick={() => setSelectedSpecialty(specialty)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    animate={{
                      backgroundColor: selectedSpecialty === specialty ? "hsl(var(--foreground))" : "hsl(var(--background))",
                      color: selectedSpecialty === specialty ? "hsl(var(--background))" : "hsl(var(--foreground))",
                    }}
                    transition={{ duration: 0.2 }}
                    className="px-5 py-2.5 text-sm font-medium border border-border rounded-full"
                  >
                    {toTitleCase(specialty)}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Level/Price Filter */}
            <div>
              <div className="flex items-center justify-center gap-2 mb-4">
                <Eyebrow className="text-muted-foreground">
                  VIEW BY LEVEL & PRICE
                </Eyebrow>
                <TooltipProvider delayDuration={100}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="text-muted-foreground hover:text-foreground transition-colors">
                        <Info className="w-3.5 h-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[280px] p-4 bg-background text-foreground border border-border">
                      <p className="font-medium mb-2">Stylist Level System</p>
                      <ul className="text-xs space-y-1.5 text-foreground/80">
                        <li><span className="font-medium text-foreground">Level 1 ($):</span> Rising talent building their craft</li>
                        <li><span className="font-medium text-foreground">Level 2 ($$):</span> Skilled stylist with proven expertise</li>
                        <li><span className="font-medium text-foreground">Level 3 ($$$):</span> Master artist & senior specialist</li>
                        <li><span className="font-medium text-foreground">Level 4 ($$$$):</span> Elite specialist & industry leader</li>
                      </ul>
                      <p className="text-xs text-muted-foreground mt-2">Higher levels reflect experience, training, and demand.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                <motion.button
                  onClick={() => setSelectedLevel(null)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  animate={{
                    backgroundColor: selectedLevel === null ? "hsl(var(--foreground))" : "hsl(var(--background))",
                    color: selectedLevel === null ? "hsl(var(--background))" : "hsl(var(--foreground))",
                  }}
                  transition={{ duration: 0.2 }}
                  className="px-5 py-2.5 text-sm font-medium border border-border rounded-full"
                >
                  All Levels
                </motion.button>
                {stylistLevels.map((level) => (
                  <motion.button
                    key={level.id}
                    onClick={() => setSelectedLevel(level.id)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    animate={{
                      backgroundColor: selectedLevel === level.id ? "hsl(var(--foreground))" : "hsl(var(--background))",
                      color: selectedLevel === level.id ? "hsl(var(--background))" : "hsl(var(--foreground))",
                    }}
                    transition={{ duration: 0.2 }}
                    className="px-5 py-2.5 text-sm font-medium border border-border rounded-full"
                  >
                    <span>{level.name}</span>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Clear Filters Button */}
            <AnimatePresence>
              {(selectedSpecialty || selectedLevel) && (
                <motion.button
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => {
                    setSelectedSpecialty(null);
                    setSelectedLevel(null);
                  }}
                  className="text-xs tracking-wide text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors"
                >
                  Clear filters
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>

      </div>

      {/* Specialty Notice */}
      <div className="container mx-auto px-6 mt-8">
        <p className="text-center text-sm text-muted-foreground max-w-2xl mx-auto">
          <span className="italic">Note:</span> Specialty badges indicate each stylist's preferred focus areas, not a comprehensive list. All our stylists provide excellent services across nearly every service type.
        </p>
      </div>

      {/* Stylists Grid */}
      <div className="container mx-auto px-6 mt-8">
        {filteredStylists.length > 0 ? (
          <motion.div
            key={`${selectedLocation}-${selectedSpecialty}-${selectedLevel}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {filteredStylists.map((stylist, index) => (
              <StylistFlipCard key={stylist.id} stylist={stylist} index={index} selectedLocation={selectedLocation} />
            ))}
            
            {/* Join Our Team Card - dynamically spans remaining columns */}
            <JoinTeamCard 
              stylistCount={filteredStylists.length} 
              isExpanded={isFormExpanded}
              onToggleExpand={handleToggleFormExpand}
            />
          </motion.div>
        ) : (
          <motion.div
            key="no-results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="text-center py-16 px-6"
          >
            <p className="text-lg text-muted-foreground">
              No stylists match your selected filters
            </p>
          </motion.div>
        )}
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
