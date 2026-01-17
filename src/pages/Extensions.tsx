import { motion, useInView } from "framer-motion";
import { useRef, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Star, Award, MapPin, ArrowRight, Search, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { SEO } from "@/components/SEO";
import { Section } from "@/components/ui/section";
import { BeforeAfterSlider } from "@/components/home/BeforeAfterSlider";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// Transformation gallery data
const transformations = [
  {
    id: 1,
    beforeImage: "https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=600&h=750&fit=crop",
    afterImage: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&h=750&fit=crop",
    title: "Volume & Length",
    description: "Added 18 inches of seamless extensions for dramatic length and volume"
  },
  {
    id: 2,
    beforeImage: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&h=750&fit=crop",
    afterImage: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&h=750&fit=crop",
    title: "Natural Blending",
    description: "Subtle extensions for thickness without added length"
  },
  {
    id: 3,
    beforeImage: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&h=750&fit=crop",
    afterImage: "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=600&h=750&fit=crop",
    title: "Color & Extensions",
    description: "Custom color matching with dimensional highlights"
  },
  {
    id: 4,
    beforeImage: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=600&h=750&fit=crop",
    afterImage: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&h=750&fit=crop",
    title: "Full Transformation",
    description: "Complete length transformation with balayage"
  }
];

// Extension-specific FAQs
const extensionFaqs = [
  {
    question: "How long do hair extensions last?",
    answer: "With proper care and regular maintenance appointments every 6-8 weeks, our extensions typically last 6-12 months. The longevity depends on your hair type, lifestyle, and how well you follow our care instructions."
  },
  {
    question: "Will extensions damage my natural hair?",
    answer: "When installed and maintained properly by our certified stylists, the Drop Dead Method is designed to be completely damage-free. Our hidden beaded row technique distributes weight evenly and doesn't use heat, glue, or harsh chemicals."
  },
  {
    question: "How long does the installation process take?",
    answer: "A full extension installation typically takes 2-3 hours. This includes custom color matching, sectioning, and precise placement to ensure the most natural-looking results."
  },
  {
    question: "Can I color my extensions?",
    answer: "Yes! Our premium human hair extensions can be colored, but we recommend having this done at the salon by one of our stylists to ensure the best results and maintain the integrity of the hair."
  },
  {
    question: "What maintenance is required?",
    answer: "We recommend maintenance appointments every 6-8 weeks to move up the rows as your natural hair grows. Daily care includes gentle brushing with a loop brush, using sulfate-free products, and braiding hair before bed."
  },
  {
    question: "Do I need a consultation before getting extensions?",
    answer: "Yes, a consultation is required for all new extension clients. This allows us to assess your hair health, discuss your goals, color match, and create a customized plan for your perfect look."
  },
  {
    question: "What is the Drop Dead Method?",
    answer: "The Drop Dead Method is our proprietary hidden beaded row technique. It's the most versatile and comfortable extension method available, featuring invisible rows that lay completely flat against your scalp with zero tension or damage."
  },
  {
    question: "How much do extensions cost?",
    answer: "Extension pricing varies based on the amount of hair needed, desired length, and your specific goals. After your consultation, we'll provide a detailed quote. Investment typically ranges from $800-$2500 for a full install."
  }
];

// Drop Dead Method features
const methodFeatures = [
  {
    icon: Star,
    title: "Hidden & Seamless",
    description: "Invisible beaded rows that lay completely flat against your scalp"
  },
  {
    icon: Award,
    title: "Maximum Comfort",
    description: "No tension, no damage—designed for all-day wearability"
  },
  {
    icon: MapPin,
    title: "Nationwide Education",
    description: "We train salons across the country who proudly showcase our method"
  }
];

export default function Extensions() {
  const heroRef = useRef(null);
  const galleryRef = useRef(null);
  const methodRef = useRef(null);
  const faqRef = useRef(null);
  
  const heroInView = useInView(heroRef, { once: true, margin: "-100px" });
  const galleryInView = useInView(galleryRef, { once: true, margin: "-100px" });
  const methodInView = useInView(methodRef, { once: true, margin: "-100px" });
  const faqInView = useInView(faqRef, { once: true, margin: "-100px" });
  
  const [currentSlide, setCurrentSlide] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredFaqs = useMemo(() => {
    if (!searchQuery.trim()) return extensionFaqs;
    const query = searchQuery.toLowerCase();
    return extensionFaqs.filter(
      faq => 
        faq.question.toLowerCase().includes(query) ||
        faq.answer.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-oat/50 text-foreground px-0.5 rounded-sm">
          {part}
        </mark>
      ) : part
    );
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % transformations.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + transformations.length) % transformations.length);
  };

  return (
    <Layout>
      <SEO 
        title="Hair Extensions - The Drop Dead Method"
        description="Experience the most comfortable and seamless hair extension method. Hidden beaded rows, zero damage, and stunning transformations. Book your extension consultation today."
      />

      {/* Hero Section */}
      <section ref={heroRef} className="pt-32 lg:pt-40 pb-16 lg:pb-20">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="max-w-3xl">
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              animate={heroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6 }}
              className="text-xs uppercase tracking-[0.3em] text-muted-foreground font-sans block mb-6"
            >
              Hair Extensions
            </motion.span>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={heroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-serif text-4xl md:text-5xl lg:text-6xl font-normal tracking-tight text-foreground leading-[1.1]"
            >
              The Drop Dead
              <br />
              <span className="italic font-light">Method</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={heroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-8 text-base md:text-lg text-muted-foreground font-sans font-light max-w-lg"
            >
              The most versatile and comfortable hidden beaded row method available. 
              Flawless, natural-looking extensions that move and feel like your own hair.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={heroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-8 flex flex-wrap gap-4"
            >
              <Link
                to="/booking"
                className="group inline-flex items-center gap-3 bg-foreground text-background px-6 py-3.5 text-sm font-medium tracking-wide hover:bg-foreground/90 transition-all duration-300"
              >
                <span>BOOK EXTENSION CONSULT</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Transformation Gallery Section */}
      <Section sectionRef={galleryRef} className="bg-secondary/30">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={galleryInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground font-sans block mb-4">
            Transformations
          </span>
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-normal tracking-tight text-foreground">
            Real <span className="italic font-light">Results</span>
          </h2>
        </motion.div>

        <div className="relative max-w-4xl mx-auto">
          {/* Main Slider */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={galleryInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <BeforeAfterSlider
              beforeImage={transformations[currentSlide].beforeImage}
              afterImage={transformations[currentSlide].afterImage}
              beforeLabel="Before"
              afterLabel="After"
              className="aspect-[4/5] md:aspect-[3/4]"
              hideDefaultVideoButton={true}
            />
            
            {/* Slide Info Overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6 z-20">
              <h3 className="text-white font-serif text-xl md:text-2xl mb-2">
                {transformations[currentSlide].title}
              </h3>
              <p className="text-white/80 text-sm">
                {transformations[currentSlide].description}
              </p>
            </div>
          </motion.div>

          {/* Navigation Arrows */}
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-background/90 backdrop-blur-sm flex items-center justify-center hover:bg-background transition-colors duration-200 z-30"
            aria-label="Previous transformation"
          >
            <ChevronLeft className="w-6 h-6 text-foreground" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-background/90 backdrop-blur-sm flex items-center justify-center hover:bg-background transition-colors duration-200 z-30"
            aria-label="Next transformation"
          >
            <ChevronRight className="w-6 h-6 text-foreground" />
          </button>

          {/* Dots Indicator */}
          <div className="flex justify-center gap-2 mt-6">
            {transformations.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentSlide 
                    ? 'bg-foreground w-8' 
                    : 'bg-foreground/30 hover:bg-foreground/50'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </Section>

      {/* Drop Dead Method Section */}
      <Section sectionRef={methodRef} className="bg-foreground text-background overflow-hidden">
        <div className="relative">
          {/* Background accent */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={methodInView ? { opacity: 0.03, scale: 1 } : {}}
            transition={{ duration: 1.2 }}
            className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-oat blur-3xl pointer-events-none"
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center relative">
            {/* Left side - Content */}
            <div className="space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={methodInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6 }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-oat/20 border border-oat/30"
              >
                <Star className="w-4 h-4 fill-oat text-oat" />
                <span className="text-sm font-medium tracking-wide text-oat">OUR SIGNATURE</span>
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 30 }}
                animate={methodInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, delay: 0.1 }}
                className="font-serif text-3xl md:text-4xl lg:text-5xl font-normal tracking-tight leading-[1.1]"
              >
                Why The Drop Dead
                <br />
                <span className="italic font-light text-oat">Method?</span>
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={methodInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-lg font-sans font-light leading-relaxed text-background/80 max-w-xl"
              >
                Our proprietary technique delivers flawless, natural-looking extensions 
                that are completely undetectable. No tension, no damage—just gorgeous hair 
                that looks and feels like your own.
              </motion.p>

              <div className="space-y-5">
                {methodFeatures.map((feature, index) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, x: -30 }}
                    animate={methodInView ? { opacity: 1, x: 0 } : {}}
                    transition={{ 
                      duration: 0.6, 
                      delay: 0.3 + index * 0.15,
                      ease: [0.25, 0.1, 0.25, 1]
                    }}
                    className="flex items-start gap-4 group"
                  >
                    <div className="flex-shrink-0 w-12 h-12 bg-oat/20 flex items-center justify-center transition-colors duration-300 group-hover:bg-oat/30">
                      <feature.icon className="w-5 h-5 text-oat" />
                    </div>
                    <div>
                      <h3 className="font-medium text-background mb-1">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-background/60">
                        {feature.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={methodInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, delay: 0.7 }}
                className="space-y-4 pt-4"
              >
                <div className="flex flex-wrap gap-4">
                  <Link
                    to="/booking"
                    className="group inline-flex items-center gap-3 bg-oat text-oat-foreground px-6 py-3.5 text-sm font-medium tracking-wide hover:bg-oat/90 transition-all duration-300"
                  >
                    <span>BOOK EXTENSION CONSULT</span>
                    <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                </div>
                <Link
                  to="/education"
                  className="group inline-flex items-center gap-2 text-sm text-background/70 hover:text-background transition-colors duration-300"
                >
                  <span>Are you a stylist wanting to learn our method?</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </motion.div>
            </div>

            {/* Right side - Visual */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={methodInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 1, delay: 0.3 }}
              className="relative"
            >
              <div className="aspect-[4/5] relative overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&h=750&fit=crop"
                  alt="Beautiful extension result"
                  className="w-full h-full object-cover"
                />
                
                {/* Floating badge */}
                <div className="absolute bottom-6 left-6 right-6 bg-background/95 backdrop-blur-sm p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <Award className="w-5 h-5 text-foreground" />
                    <span className="text-xs tracking-[0.2em] text-muted-foreground uppercase">Nationally Recognized</span>
                  </div>
                  <p className="text-sm text-foreground leading-relaxed">
                    Salons across the country travel to learn and proudly showcase the Drop Dead Method.
                  </p>
                </div>
              </div>

              {/* Decorative elements */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={methodInView ? { opacity: 0.6, x: 0 } : {}}
                transition={{ duration: 1, delay: 0.5 }}
                className="absolute -top-4 -right-4 w-24 h-24 border border-oat/40"
              />
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={methodInView ? { opacity: 0.6, x: 0 } : {}}
                transition={{ duration: 1, delay: 0.6 }}
                className="absolute -bottom-4 -left-4 w-32 h-32 border border-oat/40"
              />
            </motion.div>
          </div>
        </div>
      </Section>

      {/* FAQ Section */}
      <Section sectionRef={faqRef}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          {/* Left Column - Intro */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={faqInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
            className="lg:sticky lg:top-32 lg:self-start"
          >
            <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground font-sans block mb-4">
              Questions
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif mb-6">
              Extension<br />
              <em className="not-italic italic">FAQ</em>
            </h2>
            
            <div className="space-y-4 text-foreground/80 mb-8">
              <p>
                Everything you need to know about hair extensions and the Drop Dead Method. 
                Have more questions? Book a consultation and we'll answer them all.
              </p>
            </div>

            <Link
              to="/booking"
              className="group inline-flex items-center gap-3 bg-foreground text-background px-6 py-3.5 text-sm font-medium tracking-wide hover:bg-foreground/90 transition-all duration-300"
            >
              <span>BOOK A CONSULTATION</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </motion.div>

          {/* Right Column - Search & Accordion */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={faqInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1], delay: 0.2 }}
          >
            {/* Search Input */}
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search extension questions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-12 py-4 bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/30 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Results count */}
            {searchQuery && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-muted-foreground mb-4"
              >
                {filteredFaqs.length} {filteredFaqs.length === 1 ? 'result' : 'results'} found
              </motion.p>
            )}

            {/* FAQ Accordion */}
            <Accordion type="single" collapsible className="space-y-3">
              {filteredFaqs.length > 0 ? (
                filteredFaqs.map((faq, index) => (
                  <motion.div
                    key={faq.question}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                  >
                    <AccordionItem
                      value={`item-${index}`}
                      className="bg-background border border-border px-6 data-[state=open]:border-foreground/20 transition-all duration-300 hover:bg-secondary hover:border-foreground/20"
                    >
                      <AccordionTrigger className="text-left text-base md:text-lg font-medium py-5 hover:no-underline">
                        {highlightText(faq.question, searchQuery)}
                      </AccordionTrigger>
                      <AccordionContent className="text-foreground/80 pb-5 leading-relaxed">
                        {highlightText(faq.answer, searchQuery)}
                      </AccordionContent>
                    </AccordionItem>
                  </motion.div>
                ))
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12 text-muted-foreground"
                >
                  <p className="text-lg mb-2">No matching questions found</p>
                  <p className="text-sm">Try adjusting your search terms</p>
                </motion.div>
              )}
            </Accordion>
          </motion.div>
        </div>
      </Section>
    </Layout>
  );
}
