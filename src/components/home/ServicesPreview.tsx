import { Link } from "react-router-dom";
import { motion, useInView, useReducedMotion, type Variants } from "framer-motion";
import { useRef, useState, useEffect, useCallback } from "react";
import { Section } from "@/components/ui/section";
import { ArrowLeft, ArrowRight, ArrowUpRight, Pause } from "lucide-react";

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

// Create extended array for infinite scroll (duplicate cards)
const extendedServices = [...services, ...services, ...services];
const CLONE_COUNT = services.length;

export function ServicesPreview() {
  const sectionRef = useRef<HTMLElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const mobileScrollRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });
  const prefersReducedMotion = useReducedMotion();
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [swipeStartX, setSwipeStartX] = useState(0);
  const isAutoScrolling = useRef(false);
  const hasInitialized = useRef(false);
  const extendedIndex = useRef(CLONE_COUNT); // Track position in extended array

  // Editorial easing - slow start, smooth middle, gentle stop
  const editorialEasing: [number, number, number, number] = [0.25, 0.1, 0.25, 1];

  // Initialize scroll position to middle set (so we can scroll left or right infinitely)
  useEffect(() => {
    if (!scrollContainerRef.current || hasInitialized.current) return;
    
    const container = scrollContainerRef.current;
    const cards = container.querySelectorAll('[data-card]');
    // Start at the first card of the middle set
    const middleStartIndex = CLONE_COUNT;
    const card = cards[middleStartIndex] as HTMLElement;
    
    if (card) {
      const containerRect = container.getBoundingClientRect();
      const cardRect = card.getBoundingClientRect();
      const scrollLeftPos = card.offsetLeft - (containerRect.width / 2) + (cardRect.width / 2);
      container.scrollLeft = Math.max(0, scrollLeftPos);
      hasInitialized.current = true;
      extendedIndex.current = CLONE_COUNT;
    }
  }, [isInView]);

  const scrollToExtendedIndex = useCallback((targetExtIndex: number, smooth = true) => {
    if (!scrollContainerRef.current) return;
    
    const container = scrollContainerRef.current;
    const cards = container.querySelectorAll('[data-card]');
    const card = cards[targetExtIndex] as HTMLElement;
    
    if (!card) return;

    const containerRect = container.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    const scrollLeftPos = card.offsetLeft - (containerRect.width / 2) + (cardRect.width / 2);

    isAutoScrolling.current = true;
    
    if (smooth && !prefersReducedMotion) {
      setIsAnimating(true);
      container.scrollTo({
        left: Math.max(0, scrollLeftPos),
        behavior: 'smooth'
      });
      // Wait for scroll to complete, then check if we need to reset position
      setTimeout(() => {
        setIsAnimating(false);
        isAutoScrolling.current = false;
        
        // If we've scrolled past the middle set, silently reset to middle
        if (targetExtIndex >= CLONE_COUNT * 2) {
          const resetIndex = CLONE_COUNT + (targetExtIndex % services.length);
          const resetCard = cards[resetIndex] as HTMLElement;
          if (resetCard) {
            const resetScrollPos = resetCard.offsetLeft - (containerRect.width / 2) + (resetCard.offsetWidth / 2);
            container.scrollLeft = resetScrollPos;
            extendedIndex.current = resetIndex;
          }
        }
      }, 800);
    } else {
      container.scrollLeft = Math.max(0, scrollLeftPos);
      isAutoScrolling.current = false;
    }
    
    extendedIndex.current = targetExtIndex;
    setCurrentIndex(targetExtIndex % services.length);
  }, [prefersReducedMotion]);

  // Keep scrollToCard for manual navigation (arrows)
  const scrollToCard = useCallback((realIndex: number, smooth = true) => {
    const targetExtIndex = CLONE_COUNT + realIndex;
    extendedIndex.current = targetExtIndex;
    scrollToExtendedIndex(targetExtIndex, smooth);
  }, [scrollToExtendedIndex]);

  // Auto-advance animation when in view - every 3 seconds, loops continuously
  useEffect(() => {
    if (!isInView || isPaused || prefersReducedMotion) return;

    const intervalId = setInterval(() => {
      const nextExtIndex = extendedIndex.current + 1;
      scrollToExtendedIndex(nextExtIndex);
    }, 3000);

    return () => clearInterval(intervalId);
  }, [isInView, isPaused, prefersReducedMotion, scrollToExtendedIndex]);

  // Detect user scroll and handle infinite loop reset
  const handleUserScroll = useCallback(() => {
    // Don't pause here - let mouse enter/leave handle pausing
    // This prevents race conditions with auto-scroll
    
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
    
    // Convert extended index to real index
    const realIndex = closestIndex % services.length;
    setCurrentIndex(realIndex);
    
    // If scrolled into the first or last set, silently jump to middle set
    if (!isAutoScrolling.current && closestIndex < CLONE_COUNT) {
      // Scrolled into first clone set - jump to middle
      const middleIndex = CLONE_COUNT + realIndex;
      const card = cards[middleIndex] as HTMLElement;
      if (card) {
        const containerRect = container.getBoundingClientRect();
        const cardRect = card.getBoundingClientRect();
        const scrollLeftPos = card.offsetLeft - (containerRect.width / 2) + (cardRect.width / 2);
        requestAnimationFrame(() => {
          container.scrollLeft = scrollLeftPos;
        });
      }
    } else if (!isAutoScrolling.current && closestIndex >= CLONE_COUNT * 2) {
      // Scrolled into last clone set - jump to middle
      const middleIndex = CLONE_COUNT + realIndex;
      const card = cards[middleIndex] as HTMLElement;
      if (card) {
        const containerRect = container.getBoundingClientRect();
        const cardRect = card.getBoundingClientRect();
        const scrollLeftPos = card.offsetLeft - (containerRect.width / 2) + (cardRect.width / 2);
        requestAnimationFrame(() => {
          container.scrollLeft = scrollLeftPos;
        });
      }
    }
  }, []);

  const goToPrevious = () => {
    setIsPaused(true);
    // Wrap to last item if at beginning
    const newIndex = currentIndex === 0 ? services.length - 1 : currentIndex - 1;
    scrollToCard(newIndex);
  };

  const goToNext = () => {
    setIsPaused(true);
    // Wrap to first item if at end
    const newIndex = currentIndex === services.length - 1 ? 0 : currentIndex + 1;
    scrollToCard(newIndex);
  };

  // Drag to scroll handlers (mouse)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
    setScrollLeft(scrollContainerRef.current.scrollLeft);
    setIsPaused(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX) * 1.5; // Scroll speed multiplier
    scrollContainerRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    // Resume auto-scroll when mouse leaves
    setIsPaused(false);
  };

  const handleMouseEnter = () => {
    // Pause auto-scroll when mouse enters
    setIsPaused(true);
  };

  // Touch/swipe handlers (mobile) - for desktop carousel
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!scrollContainerRef.current) return;
    setIsDragging(true);
    setStartX(e.touches[0].pageX - scrollContainerRef.current.offsetLeft);
    setScrollLeft(scrollContainerRef.current.scrollLeft);
    setIsPaused(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !scrollContainerRef.current) return;
    const x = e.touches[0].pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    scrollContainerRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Mobile infinite swipe handlers
  const handleMobileSwipeStart = (e: React.TouchEvent) => {
    setSwipeStartX(e.touches[0].clientX);
    setIsPaused(true);
  };

  const handleMobileSwipeEnd = (e: React.TouchEvent) => {
    const swipeEndX = e.changedTouches[0].clientX;
    const swipeDiff = swipeStartX - swipeEndX;
    const swipeThreshold = 50; // Minimum swipe distance

    if (Math.abs(swipeDiff) > swipeThreshold) {
      if (swipeDiff > 0) {
        // Swiped left - go to next
        const newIndex = currentIndex === services.length - 1 ? 0 : currentIndex + 1;
        setCurrentIndex(newIndex);
        scrollToMobileCard(newIndex);
      } else {
        // Swiped right - go to previous
        const newIndex = currentIndex === 0 ? services.length - 1 : currentIndex - 1;
        setCurrentIndex(newIndex);
        scrollToMobileCard(newIndex);
      }
    }
  };

  const scrollToMobileCard = useCallback((index: number) => {
    if (!mobileScrollRef.current) return;
    const container = mobileScrollRef.current;
    const cards = container.querySelectorAll('[data-mobile-card]');
    const card = cards[index] as HTMLElement;
    
    if (!card) return;
    
    const containerWidth = container.offsetWidth;
    const cardWidth = card.offsetWidth;
    const scrollLeftPos = card.offsetLeft - (containerWidth / 2) + (cardWidth / 2);
    
    container.scrollTo({
      left: Math.max(0, scrollLeftPos),
      behavior: prefersReducedMotion ? 'auto' : 'smooth'
    });
  }, [prefersReducedMotion]);

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
    <Section className="pb-8 lg:pb-12 overflow-hidden" sectionRef={sectionRef}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: editorialEasing }}
        >
          <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground font-sans">
            Explore Our Services ↘
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
              disabled={isAnimating}
              className="w-12 h-12 rounded-full border border-border flex items-center justify-center text-foreground transition-all duration-300 hover:bg-foreground hover:text-background disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-foreground"
              aria-label="Previous service"
            >
              <ArrowLeft size={18} />
            </button>
            <button
              onClick={goToNext}
              disabled={isAnimating}
              className="w-12 h-12 rounded-full border border-border flex items-center justify-center text-foreground transition-all duration-300 hover:bg-foreground hover:text-background disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-foreground"
              aria-label="Next service"
            >
              <ArrowRight size={18} />
            </button>
          </div>
        </motion.div>
      </div>

      {/* Desktop: Horizontal Scroll Carousel */}
      <div 
        className="hidden md:block -mx-6 lg:-mx-12 relative"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Pause indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: isPaused ? 1 : 0 }}
          transition={{ duration: 0.2 }}
          className="absolute top-4 right-12 z-10 flex items-center gap-2 px-3 py-1.5 bg-background/80 backdrop-blur-sm border border-border rounded-full pointer-events-none"
        >
          <Pause size={12} className="text-muted-foreground" />
          <span className="text-xs text-muted-foreground font-sans uppercase tracking-wider">Paused</span>
        </motion.div>
        <div
          ref={scrollContainerRef}
          onScroll={handleUserScroll}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className={`flex gap-16 overflow-x-auto scrollbar-minimal px-6 lg:px-12 pb-4 scroll-smooth ${isDragging ? 'cursor-grabbing select-none' : 'cursor-grab'}`}
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', scrollBehavior: 'smooth' }}
        >
          {extendedServices.map((service, index) => (
            <motion.div
              key={`${service.title}-${index}`}
              data-card
              custom={index % services.length}
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
                    to="/booking"
                    className="inline-flex items-center px-6 py-3 text-xs uppercase tracking-[0.1em] font-sans bg-foreground text-background hover:bg-foreground/90 transition-all duration-300 whitespace-nowrap"
                  >
                    Book Consult
                  </Link>
                  <Link
                    to="/services"
                    className="inline-flex items-center px-6 py-3 text-xs uppercase tracking-[0.1em] font-sans border border-border text-foreground hover:bg-foreground hover:text-background transition-all duration-300 whitespace-nowrap"
                  >
                    Learn More
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Mobile: Horizontal Swipeable Carousel with Infinite Loop */}
      <div className="md:hidden -mx-6">
        <div
          ref={mobileScrollRef}
          onTouchStart={handleMobileSwipeStart}
          onTouchEnd={handleMobileSwipeEnd}
          className="flex gap-4 overflow-x-auto px-6 pb-4 snap-x snap-mandatory scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
        >
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
              className="group flex-shrink-0 w-[85vw] snap-center"
              data-mobile-card
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
                  to="/booking"
                  className="inline-flex items-center px-5 py-3 text-xs uppercase tracking-[0.1em] font-sans bg-foreground text-background hover:bg-foreground/90 transition-all duration-300 whitespace-nowrap"
                >
                  Book Consult
                </Link>
                <Link
                  to="/services"
                  className="inline-flex items-center px-5 py-3 text-xs uppercase tracking-[0.1em] font-sans border border-border text-foreground hover:bg-foreground hover:text-background transition-all duration-300 whitespace-nowrap"
                >
                  Learn More
                </Link>
              </div>
            </motion.div>
          ))}
          {/* Spacer for last card */}
          <div className="flex-shrink-0 w-4" />
        </div>
      </div>

      {/* Progress Indicators */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="flex justify-center items-center gap-4 mt-8"
      >
        <div className="flex items-center gap-2">
          {services.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setIsPaused(true);
                scrollToCard(index);
              }}
              className={`h-1 transition-all duration-500 ${
                index === currentIndex 
                  ? 'w-8 bg-foreground' 
                  : 'w-2 bg-foreground/30 hover:bg-foreground/50'
              }`}
              aria-label={`Go to service ${index + 1}`}
            />
          ))}
        </div>
        <span className="text-sm text-muted-foreground">
          {currentIndex + 1} / {services.length}
        </span>
      </motion.div>
    </Section>
  );
}
