import { Link } from "react-router-dom";
import { motion, useInView, useReducedMotion, type Variants } from "framer-motion";
import { useRef, useState, useEffect, useCallback } from "react";
import { Section } from "@/components/ui/section";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";

const services = [
  {
    category: "Color Services",
    title: "Color & Blonding",
    price: "Starting at $150",
    description: "Expert color work from subtle dimension to bold transformation. Our colorists specialize in creating refined, natural-looking results tailored to your unique features.",
  },
  {
    category: "Extensions",
    title: "Drop Dead® Extensions",
    price: "Clients typically spend $1,200 - $3,500",
    description: "Drop Dead salons specialize in seamless, high-quality extensions utilizing both our proprietary hand-tied and tape-in methods for natural volume transformations.",
  },
  {
    category: "Haircuts",
    title: "Creative Cuts",
    price: "Starting at $185",
    description: "Artistry meets precision. Our stylists specialize in crafting unique shapes and styles that reflect your individuality and elevate your everyday look.",
  },
  {
    category: "Treatments",
    title: "Luxury Hair Treatments",
    price: "Starting at $95",
    description: "Restore and rejuvenate your hair with our curated selection of deep conditioning treatments, masks, and scalp therapies for optimal hair health.",
  },
];

export function ServicesPreview() {
  const sectionRef = useRef<HTMLElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });
  const prefersReducedMotion = useReducedMotion();
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [hasUserScrolled, setHasUserScrolled] = useState(false);

  // Editorial easing - slow start, smooth middle, gentle stop
  const editorialEasing: [number, number, number, number] = [0.25, 0.1, 0.25, 1];

  const scrollToCard = useCallback((index: number, smooth = true) => {
    if (!scrollContainerRef.current) return;
    
    const container = scrollContainerRef.current;
    const cards = container.querySelectorAll('[data-card]');
    const card = cards[index] as HTMLElement;
    
    if (!card) return;

    const containerRect = container.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    const scrollLeft = card.offsetLeft - (containerRect.width / 2) + (cardRect.width / 2);

    if (smooth && !prefersReducedMotion) {
      setIsAnimating(true);
      container.scrollTo({
        left: Math.max(0, scrollLeft),
        behavior: 'smooth'
      });
      // Wait for scroll to complete
      setTimeout(() => setIsAnimating(false), 800);
    } else {
      container.scrollLeft = Math.max(0, scrollLeft);
    }
    
    setCurrentIndex(index);
  }, [prefersReducedMotion]);

  // Auto-advance animation when in view
  useEffect(() => {
    if (!isInView || hasUserScrolled || prefersReducedMotion) return;

    let timeoutId: NodeJS.Timeout;
    let currentCard = 0;

    const advanceCard = () => {
      if (currentCard < services.length - 1) {
        currentCard++;
        scrollToCard(currentCard);
        // Pause 800ms before next card
        timeoutId = setTimeout(advanceCard, 1600);
      }
    };

    // Initial delay before starting
    timeoutId = setTimeout(advanceCard, 1200);

    return () => clearTimeout(timeoutId);
  }, [isInView, hasUserScrolled, prefersReducedMotion, scrollToCard]);

  // Detect user scroll
  const handleUserScroll = useCallback(() => {
    setHasUserScrolled(true);
    
    if (!scrollContainerRef.current) return;
    
    const container = scrollContainerRef.current;
    const cards = container.querySelectorAll('[data-card]');
    const containerCenter = container.scrollLeft + container.offsetWidth / 2;
    
    let closestIndex = 0;
    let closestDistance = Infinity;
    
    cards.forEach((card, index) => {
      const cardElement = card as HTMLElement;
      const cardCenter = cardElement.offsetLeft + cardElement.offsetWidth / 2;
      const distance = Math.abs(containerCenter - cardCenter);
      
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });
    
    setCurrentIndex(closestIndex);
  }, []);

  const goToPrevious = () => {
    setHasUserScrolled(true);
    const newIndex = Math.max(0, currentIndex - 1);
    scrollToCard(newIndex);
  };

  const goToNext = () => {
    setHasUserScrolled(true);
    const newIndex = Math.min(services.length - 1, currentIndex + 1);
    scrollToCard(newIndex);
  };

  // Card animation variants
  const cardVariants: Variants = {
    hidden: { 
      opacity: 0, 
      x: 100,
    },
    visible: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.8,
        delay: i * 0.15,
        ease: [0.25, 0.1, 0.25, 1] as const,
      }
    })
  };

  return (
    <Section className="pb-8 lg:pb-12 overflow-hidden" ref={sectionRef}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: editorialEasing }}
        >
          <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground font-sans">
            Explore Our Treatments ↘
          </span>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.1, ease: editorialEasing }}
          className="flex items-center gap-6"
        >
          <Link
            to="/services"
            className="text-sm uppercase tracking-[0.15em] font-sans text-foreground link-underline"
          >
            View All
          </Link>
          
          {/* Navigation Arrows */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={goToPrevious}
              disabled={currentIndex === 0 || isAnimating}
              className="w-12 h-12 rounded-full border border-border flex items-center justify-center text-foreground transition-all duration-300 hover:bg-foreground hover:text-background disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-foreground"
              aria-label="Previous service"
            >
              <ArrowLeft size={18} />
            </button>
            <button
              onClick={goToNext}
              disabled={currentIndex === services.length - 1 || isAnimating}
              className="w-12 h-12 rounded-full border border-border flex items-center justify-center text-foreground transition-all duration-300 hover:bg-foreground hover:text-background disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-foreground"
              aria-label="Next service"
            >
              <ArrowRight size={18} />
            </button>
          </div>
        </motion.div>
      </div>

      {/* Desktop: Horizontal Scroll Carousel */}
      <div className="hidden md:block -mx-6 lg:-mx-12">
        <div
          ref={scrollContainerRef}
          onScroll={handleUserScroll}
          className="flex gap-8 overflow-x-auto scrollbar-minimal px-6 lg:px-12 pb-4"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {services.map((service, index) => (
            <motion.div
              key={service.title}
              data-card
              custom={index}
              variants={cardVariants}
              initial="hidden"
              animate={isInView ? "visible" : "hidden"}
              className="group flex-shrink-0 w-[85vw] max-w-[600px] flex gap-8"
            >
              {/* Placeholder Image Area */}
              <div className="relative w-1/2 aspect-[3/4] bg-secondary/50 border border-border overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-6xl text-muted-foreground/30">✦</span>
                </div>
                {/* Subtle hover overlay */}
                <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/5 transition-colors duration-500" />
              </div>

              {/* Content */}
              <div className="w-1/2 flex flex-col justify-center py-4">
                <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-sans mb-3">
                  {service.category}
                </span>
                
                <h3 className="font-serif text-2xl lg:text-3xl font-normal text-foreground mb-2 leading-tight">
                  {service.title}
                </h3>
                
                <p className="text-sm text-muted-foreground font-sans mb-4">
                  {service.price}
                </p>

                <p className="text-sm text-muted-foreground font-sans font-light leading-relaxed mb-8">
                  {service.description}
                </p>

                <div className="flex gap-3">
                  <Link
                    to="/services"
                    className="inline-flex items-center gap-2 px-5 py-3 text-xs uppercase tracking-[0.1em] font-sans border border-border text-foreground hover:bg-foreground hover:text-background transition-all duration-300 group/btn"
                  >
                    Learn more
                    <ArrowUpRight size={14} className="opacity-0 group-hover/btn:opacity-100 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-all duration-300" />
                  </Link>
                  <Link
                    to="/booking"
                    className="inline-flex items-center gap-2 px-5 py-3 text-xs uppercase tracking-[0.1em] font-sans bg-foreground text-background hover:bg-foreground/90 transition-all duration-300"
                  >
                    Book Now
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
          {/* Spacer for last card */}
          <div className="flex-shrink-0 w-8" />
        </div>
      </div>

      {/* Mobile: Stacked Cards with Fade */}
      <div className="md:hidden space-y-12">
        {services.map((service, index) => (
          <motion.div
            key={service.title}
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ 
              duration: 0.6, 
              delay: prefersReducedMotion ? 0 : index * 0.1,
              ease: editorialEasing 
            }}
            className="group"
          >
            {/* Image placeholder */}
            <div className="relative aspect-[4/5] bg-secondary/50 border border-border mb-6 overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-6xl text-muted-foreground/30">✦</span>
              </div>
            </div>

            <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-sans block mb-2">
              {service.category}
            </span>
            
            <h3 className="font-serif text-2xl font-normal text-foreground mb-2">
              {service.title}
            </h3>
            
            <p className="text-sm text-muted-foreground font-sans mb-4">
              {service.price}
            </p>

            <p className="text-sm text-muted-foreground font-sans font-light leading-relaxed mb-6">
              {service.description}
            </p>

            <div className="flex gap-3">
              <Link
                to="/services"
                className="inline-flex items-center gap-2 px-4 py-3 text-xs uppercase tracking-[0.1em] font-sans border border-border text-foreground hover:bg-foreground hover:text-background transition-all duration-300"
              >
                Learn more
              </Link>
              <Link
                to="/booking"
                className="inline-flex items-center gap-2 px-4 py-3 text-xs uppercase tracking-[0.1em] font-sans bg-foreground text-background hover:bg-foreground/90 transition-all duration-300"
              >
                Book Now
              </Link>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Progress Indicators */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="hidden md:flex justify-center gap-2 mt-8"
      >
        {services.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setHasUserScrolled(true);
              scrollToCard(index);
            }}
            className={`h-1 transition-all duration-500 ${
              index === currentIndex 
                ? 'w-8 bg-foreground' 
                : 'w-4 bg-border hover:bg-muted-foreground'
            }`}
            aria-label={`Go to service ${index + 1}`}
          />
        ))}
      </motion.div>
    </Section>
  );
}
