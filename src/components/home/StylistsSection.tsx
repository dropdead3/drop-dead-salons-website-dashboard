import { useState, useRef, useEffect } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { ArrowRight, Sparkles, ChevronDown, Info, Star } from "lucide-react";
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
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Eyebrow } from "@/components/ui/Eyebrow";

import { stylists, locations, allSpecialties, stylistLevels, type Stylist, type Location } from "@/data/stylists";

const applicationSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  email: z.string().trim().email("Invalid email address").max(255, "Email must be less than 255 characters"),
  phone: z.string().trim().min(10, "Please enter a valid phone number").max(20, "Phone number is too long"),
  instagram: z.string().trim().max(50, "Instagram handle is too long").optional(),
  experience: z.string().min(1, "Please select your experience level"),
  clientBook: z.string().min(1, "Please select your current client book size"),
  specialties: z.string().trim().min(1, "Please tell us about your specialties").max(500, "Specialties must be less than 500 characters"),
  whyDropDead: z.string().trim().min(1, "Please tell us why you want to work at Drop Dead").max(500, "Response must be less than 500 characters"),
  message: z.string().trim().max(1000, "Message must be less than 1000 characters").optional(),
});

type ApplicationFormData = z.infer<typeof applicationSchema>;

// Helper to convert text to title case
const toTitleCase = (str: string) => {
  return str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
};

const StylistCard = ({ stylist, index }: { stylist: Stylist; index: number }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      whileHover={{ y: -4 }}
      className="group relative aspect-[3/4] bg-muted overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-500"
    >
      <ImageWithSkeleton
        src={stylist.imageUrl}
        alt={`${stylist.name} - ${stylist.level}`}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        wrapperClassName="absolute inset-0"
      />
      
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-500" />
      
      <div className="absolute top-4 left-4 right-4 flex flex-wrap gap-2">
        {/* Sort specialties with EXTENSIONS first */}
        {[...stylist.specialties].sort((a, b) => {
          if (a === "EXTENSIONS") return -1;
          if (b === "EXTENSIONS") return 1;
          return 0;
        }).map((specialty, idx) => (
          <motion.span
            key={idx}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 + index * 0.1 }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 backdrop-blur-sm text-xs font-medium tracking-wide ${
              specialty === "EXTENSIONS"
                ? "bg-oat/85 text-oat-foreground"
                : "bg-background/70 text-foreground"
            }`}
          >
            {specialty === "EXTENSIONS" && <Star className="w-3 h-3 fill-current" />}
            {specialty}
          </motion.span>
        ))}
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
                  <li><span className="font-medium text-foreground">Level I:</span> Rising talent building their craft</li>
                  <li><span className="font-medium text-foreground">Level II:</span> Skilled stylist with proven expertise</li>
                  <li><span className="font-medium text-foreground">Level III:</span> Master artist & senior specialist</li>
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
        
        <Link
          to="/booking"
          className="inline-flex items-center gap-2 bg-white text-black px-5 py-2.5 text-sm font-medium hover:bg-white/90 hover:shadow-lg transition-all duration-300 group/btn active:scale-[0.98]"
        >
          <span>Book Consult</span>
          <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
        </Link>
      </div>
    </motion.div>
  );
};

export function StylistsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });
  const [selectedLocation, setSelectedLocation] = useState<Location>("north-mesa");
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [isFormExpanded, setIsFormExpanded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Listen for location filter events from LocationsSection
  useEffect(() => {
    const handleLocationFilter = (e: CustomEvent<{ location: Location }>) => {
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
      clientBook: "",
      specialties: "",
      whyDropDead: "",
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
    <section ref={sectionRef} id="stylists-section" className="py-20 lg:py-32 bg-secondary overflow-hidden">
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
          
          <div className="inline-flex items-center border border-border bg-background">
            {locations.map((location) => (
              <button
                key={location.id}
                onClick={() => setSelectedLocation(location.id)}
                className={`flex items-center gap-2 px-4 md:px-6 py-3 md:py-4 text-sm md:text-base font-medium transition-all duration-300 ${
                  selectedLocation === location.id
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-muted"
                }`}
              >
                <span>{location.name}</span>
                <TooltipProvider delayDuration={100}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span 
                        className={`transition-colors ${
                          selectedLocation === location.id
                            ? "text-primary-foreground/70 hover:text-primary-foreground"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Info className="w-3.5 h-3.5" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="p-3 bg-background text-foreground border border-border">
                      <p className="text-xs font-medium mb-1">{location.name}</p>
                      <p className="text-xs text-muted-foreground">{location.address}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </button>
            ))}
          </div>

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
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  animate={{
                    backgroundColor: selectedSpecialty === null ? "hsl(var(--foreground))" : "hsl(var(--background))",
                    color: selectedSpecialty === null ? "hsl(var(--background))" : "hsl(var(--foreground))",
                  }}
                  transition={{ duration: 0.2 }}
                  className="px-4 py-2 text-xs font-medium border border-border"
                >
                  All
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
                    className="px-4 py-2 text-xs font-medium border border-border"
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
                        <li><span className="font-medium text-foreground">Level I ($):</span> Rising talent building their craft</li>
                        <li><span className="font-medium text-foreground">Level II ($$):</span> Skilled stylist with proven expertise</li>
                        <li><span className="font-medium text-foreground">Level III ($$$):</span> Master artist & senior specialist</li>
                      </ul>
                      <p className="text-xs text-muted-foreground mt-2">Higher levels reflect experience, training, and demand.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
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
                  className="px-4 py-2 text-xs font-medium border border-border"
                >
                  All Levels
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
                    className="px-4 py-2 text-xs font-medium border border-border"
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
        </div>

      </div>

      {/* Stylists Grid */}
      <div className="container mx-auto px-6 mt-12">
        <AnimatePresence mode="wait">
          {filteredStylists.length > 0 ? (
            <motion.div
              key={`${selectedLocation}-${selectedSpecialty}-${selectedLevel}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
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
          <h3 className="text-2xl md:text-3xl font-display mb-3">
            Work at Drop Dead
          </h3>
          <p className="text-foreground/60 text-sm max-w-md mx-auto mb-5">
            Passionate stylist looking for your next opportunity? We'd love to hear from you.
          </p>
          
          <button
            onClick={() => setIsFormExpanded(!isFormExpanded)}
            className="inline-flex items-center gap-2 text-sm font-sans font-medium text-foreground hover:text-foreground/70 transition-colors group"
          >
            <span>{isFormExpanded ? "Close" : "Apply now"}</span>
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
                        name="clientBook"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs uppercase tracking-wider">Do you currently have a book of clients? *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="less-than-10">Less than 10</SelectItem>
                                <SelectItem value="10-20">Yes - 10-20 clients</SelectItem>
                                <SelectItem value="20-30">Yes - 20-30 clients</SelectItem>
                                <SelectItem value="30-50">Yes - 30-50 clients</SelectItem>
                                <SelectItem value="50+">Yes - 50+ clients</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

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
                        name="whyDropDead"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs uppercase tracking-wider">What's the biggest reason you want to work at Drop Dead? *</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Tell us what excites you about joining our team..." 
                                {...field} 
                                className="resize-none"
                                rows={3}
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
