import { useState, useRef } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { ArrowRight, Sparkles, ChevronDown, Info } from "lucide-react";
import { Link } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ImageWithSkeleton } from "@/components/ui/image-skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
    specialties: ["BLONDING", "CREATIVE COLOR", "EXTENSIONS"],
    imageUrl: "https://images.unsplash.com/photo-1595959183082-7b570b7e1daf?w=600&h=800&fit=crop",
    location: "val-vista-lakes"
  },
  {
    id: "2",
    name: "Sarina L.",
    instagram: "@hairdidbysarina_",
    level: "LEVEL II STYLIST",
    specialties: ["EXTENSIONS", "BLONDING", "CREATIVE COLOR"],
    imageUrl: "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=600&h=800&fit=crop",
    location: "val-vista-lakes"
  },
  {
    id: "3",
    name: "Hayleigh H.",
    instagram: "@lucky7studios_",
    level: "LEVEL II STYLIST",
    specialties: ["BLONDING", "CREATIVE COLOR", "EXTENSIONS"],
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
    specialties: ["BLONDING", "CREATIVE COLOR", "CUSTOM CUTS"],
    imageUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&h=800&fit=crop",
    location: "north-mesa"
  }
];

const locations = [
  { id: "val-vista-lakes" as Location, name: "Val Vista Lakes" },
  { id: "north-mesa" as Location, name: "North Mesa" }
];

// Extract all unique specialties
const allSpecialties = Array.from(
  new Set(stylists.flatMap((s) => s.specialties))
).sort();

// Stylist levels with price indicators
const stylistLevels = [
  { id: "LEVEL I STYLIST", name: "Level I", price: "$", description: "Rising talent" },
  { id: "LEVEL II STYLIST", name: "Level II", price: "$$", description: "Skilled stylist" },
  { id: "LEVEL III STYLIST", name: "Level III", price: "$$$", description: "Master artist" },
];

const applicationSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  email: z.string().trim().email("Invalid email address").max(255, "Email must be less than 255 characters"),
  phone: z.string().trim().min(10, "Please enter a valid phone number").max(20, "Phone number is too long"),
  instagram: z.string().trim().max(50, "Instagram handle is too long").optional(),
  experience: z.string().min(1, "Please select your experience level"),
  specialties: z.string().trim().min(1, "Please tell us about your specialties").max(500, "Specialties must be less than 500 characters"),
  message: z.string().trim().max(1000, "Message must be less than 1000 characters").optional(),
});

type ApplicationFormData = z.infer<typeof applicationSchema>;

const StylistCard = ({ stylist, index }: { stylist: Stylist; index: number }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="group relative aspect-[3/4] bg-muted overflow-hidden flex-shrink-0 w-[280px] md:w-[300px]"
    >
      <ImageWithSkeleton
        src={stylist.imageUrl}
        alt={`${stylist.name} - ${stylist.level}`}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        wrapperClassName="absolute inset-0"
      />
      
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      
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
      
      <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
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
                  <li><span className="font-medium text-foreground">Level I:</span> Rising talent building their craft</li>
                  <li><span className="font-medium text-foreground">Level II:</span> Skilled stylist with proven expertise</li>
                  <li><span className="font-medium text-foreground">Level III:</span> Master artist & senior specialist</li>
                </ul>
                <p className="text-xs text-muted-foreground mt-2">Higher levels reflect experience, training, and demand.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
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
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [isFormExpanded, setIsFormExpanded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredStylists = stylists.filter((s) => {
    const matchesLocation = s.location === selectedLocation;
    const matchesSpecialty = !selectedSpecialty || s.specialties.includes(selectedSpecialty);
    const matchesLevel = !selectedLevel || s.level === selectedLevel;
    return matchesLocation && matchesSpecialty && matchesLevel;
  });

  const form = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      instagram: "",
      experience: "",
      specialties: "",
      message: "",
    },
  });

  const onSubmit = async (data: ApplicationFormData) => {
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log("Application submitted:", data);
    toast.success("Application submitted! We'll be in touch soon.");
    form.reset();
    setIsSubmitting(false);
    setIsFormExpanded(false);
  };

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

          {/* Filters */}
          <div className="mt-8 flex flex-col gap-8 items-center">
            {/* Specialty Filter */}
            <div>
              <p className="text-xs tracking-[0.2em] text-muted-foreground mb-4">
                VIEW BY SPECIALTY
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <motion.button
                  onClick={() => setSelectedSpecialty(null)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  animate={{
                    backgroundColor: selectedSpecialty === null ? "hsl(var(--foreground))" : "hsl(var(--background))",
                    color: selectedSpecialty === null ? "hsl(var(--background))" : "hsl(var(--foreground))",
                  }}
                  transition={{ duration: 0.2 }}
                  className="px-4 py-2 text-xs tracking-wide font-medium border border-border"
                >
                  ALL
                </motion.button>
                {allSpecialties.map((specialty) => (
                  <motion.button
                    key={specialty}
                    onClick={() => setSelectedSpecialty(specialty)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    animate={{
                      backgroundColor: selectedSpecialty === specialty ? "hsl(var(--foreground))" : "hsl(var(--background))",
                      color: selectedSpecialty === specialty ? "hsl(var(--background))" : "hsl(var(--foreground))",
                    }}
                    transition={{ duration: 0.2 }}
                    className="px-4 py-2 text-xs tracking-wide font-medium border border-border"
                  >
                    {specialty}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Level/Price Filter */}
            <div>
              <p className="text-xs tracking-[0.2em] text-muted-foreground mb-4">
                VIEW BY LEVEL & PRICE
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <motion.button
                  onClick={() => setSelectedLevel(null)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  animate={{
                    backgroundColor: selectedLevel === null ? "hsl(var(--foreground))" : "hsl(var(--background))",
                    color: selectedLevel === null ? "hsl(var(--background))" : "hsl(var(--foreground))",
                  }}
                  transition={{ duration: 0.2 }}
                  className="px-4 py-2 text-xs tracking-wide font-medium border border-border"
                >
                  ALL LEVELS
                </motion.button>
                {stylistLevels.map((level) => (
                  <motion.button
                    key={level.id}
                    onClick={() => setSelectedLevel(level.id)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    animate={{
                      backgroundColor: selectedLevel === level.id ? "hsl(var(--foreground))" : "hsl(var(--background))",
                      color: selectedLevel === level.id ? "hsl(var(--background))" : "hsl(var(--foreground))",
                    }}
                    transition={{ duration: 0.2 }}
                    className="px-4 py-2 text-xs tracking-wide font-medium border border-border"
                  >
                    <span>{level.name}</span>
                    <span className="ml-2 opacity-60">{level.price}</span>
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
          {filteredStylists.length > 0 ? (
            <motion.div
              key={`${selectedLocation}-${selectedSpecialty}-${selectedLevel}`}
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
          ) : (
            <motion.div
              key="no-results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="text-center py-16 px-6"
            >
              <p className="text-lg text-muted-foreground">
                No stylists match your selected filters
              </p>
            </motion.div>
          )}
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

      {/* Join Our Team - Collapsible */}
      <div className="container mx-auto px-6 mt-16 pt-12 border-t border-border/50">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-center"
        >
          <div className="flex items-center justify-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-foreground/50" />
            <p className="text-xs uppercase tracking-[0.2em] text-foreground/50">
              Join Our Team
            </p>
          </div>
          <h3 className="text-2xl md:text-3xl font-serif mb-3">
            Work at <em className="italic">Drop Dead</em>
          </h3>
          <p className="text-foreground/60 text-sm max-w-md mx-auto mb-5">
            Passionate stylist looking for your next opportunity? We'd love to hear from you.
          </p>
          
          <button
            onClick={() => setIsFormExpanded(!isFormExpanded)}
            className="inline-flex items-center gap-2 text-sm uppercase tracking-[0.15em] font-medium text-foreground hover:text-foreground/70 transition-colors group"
          >
            <span>{isFormExpanded ? "Close" : "Apply Now"}</span>
            <ChevronDown 
              className={`w-4 h-4 transition-transform duration-300 ${isFormExpanded ? "rotate-180" : ""}`} 
            />
          </button>
        </motion.div>

        {/* Collapsible Form */}
        <AnimatePresence>
          {isFormExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
              className="overflow-hidden"
            >
              <div className="pt-8 max-w-2xl mx-auto">
                <div className="bg-background p-6 md:p-8">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs uppercase tracking-wider">Full Name *</FormLabel>
                            <FormControl>
                              <Input placeholder="Your name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs uppercase tracking-wider">Email *</FormLabel>
                              <FormControl>
                                <Input type="email" placeholder="you@email.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs uppercase tracking-wider">Phone *</FormLabel>
                              <FormControl>
                                <Input type="tel" placeholder="(555) 555-5555" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="instagram"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs uppercase tracking-wider">Instagram</FormLabel>
                              <FormControl>
                                <Input placeholder="@yourusername" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="experience"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs uppercase tracking-wider">Experience *</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="0-2">0-2 years</SelectItem>
                                  <SelectItem value="2-5">2-5 years</SelectItem>
                                  <SelectItem value="5-10">5-10 years</SelectItem>
                                  <SelectItem value="10+">10+ years</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="specialties"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs uppercase tracking-wider">Your Specialties *</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="e.g., balayage, extensions, vivid colors..." 
                                {...field} 
                                className="resize-none"
                                rows={2}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="message"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs uppercase tracking-wider">Message (optional)</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Anything else you'd like us to know?" 
                                {...field} 
                                className="resize-none"
                                rows={2}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="w-full group"
                      >
                        <span>{isSubmitting ? "Submitting..." : "Submit Application"}</span>
                        <ArrowRight className="w-4 h-4 ml-2 transition-transform duration-300 group-hover:translate-x-1" />
                      </Button>
                    </form>
                  </Form>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
