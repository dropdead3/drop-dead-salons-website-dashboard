import { useState, useRef, useCallback, useEffect } from "react";
import { motion, useInView } from "framer-motion";

interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
  beforeLabel?: string;
  afterLabel?: string;
  className?: string;
}

export function BeforeAfterSlider({ 
  beforeImage,
  afterImage,
  beforeLabel = "Before", 
  afterLabel = "After",
  className = ""
}: BeforeAfterSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isAnimating, setIsAnimating] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  
  // Only trigger animation when in view
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });

  // Auto-animate slider once to demonstrate functionality, then settle to middle
  useEffect(() => {
    if (hasInteracted || !isInView) return;

    const keyframes = [
      { position: 50, duration: 0 },      // Start at middle
      { position: 25, duration: 800 },    // Slide left
      { position: 75, duration: 1200 },   // Slide right
      { position: 50, duration: 1000 },   // Settle back to middle
    ];

    let currentIndex = 0;
    let startTime: number | null = null;
    let startPosition = 50;

    const animate = (timestamp: number) => {
      if (hasInteracted) return;
      
      if (currentIndex >= keyframes.length - 1) {
        setSliderPosition(50);
        setIsAnimating(false);
        return;
      }

      if (!startTime) {
        startTime = timestamp;
        startPosition = keyframes[currentIndex].position;
      }

      const targetFrame = keyframes[currentIndex + 1];
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / targetFrame.duration, 1);
      
      // Ease out cubic for smooth deceleration
      const eased = 1 - Math.pow(1 - progress, 3);
      const newPosition = startPosition + (targetFrame.position - startPosition) * eased;
      
      setSliderPosition(newPosition);

      if (progress >= 1) {
        currentIndex++;
        startTime = null;
        startPosition = targetFrame.position;
      }

      if (currentIndex < keyframes.length - 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
      }
    };

    // Start animation after a short delay
    const timeout = setTimeout(() => {
      animationRef.current = requestAnimationFrame(animate);
    }, 800);

    return () => {
      clearTimeout(timeout);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [hasInteracted, isInView]);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  }, []);

  const handleMouseDown = () => {
    setIsDragging(true);
    setHasInteracted(true);
    setIsAnimating(false);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  };
  const handleMouseUp = () => setIsDragging(false);
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    handleMove(e.touches[0].clientX);
  };

  return (
    <div
      ref={containerRef}
      className={`relative aspect-[3/4] overflow-hidden cursor-ew-resize select-none ${className}`}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleMouseUp}
    >
      {/* After Image (Background) */}
      <div className="absolute inset-0">
        <img 
          src={afterImage} 
          alt="After transformation" 
          className="w-full h-full object-cover"
        />
      </div>

      {/* Before Image (Clipped) */}
      <div 
        className="absolute inset-0"
        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
      >
        <img 
          src={beforeImage} 
          alt="Before transformation" 
          className="w-full h-full object-cover"
        />
      </div>

      {/* Slider Line */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-white/90 z-10 shadow-sm"
        style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
      >
        {/* Slider Handle */}
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white flex items-center justify-center cursor-ew-resize shadow-lg border border-black/10"
          onMouseDown={handleMouseDown}
          onTouchStart={handleMouseDown}
        >
          <div className="flex items-center gap-1.5">
            <svg width="6" height="10" viewBox="0 0 6 10" fill="none" className="text-foreground">
              <path d="M5 1L1 5L5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <svg width="6" height="10" viewBox="0 0 6 10" fill="none" className="text-foreground">
              <path d="M1 1L5 5L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </motion.div>
      </div>

      {/* Labels */}
      <div className="absolute bottom-4 left-4 z-20">
        <span 
          className="text-[10px] uppercase tracking-[0.15em] font-sans px-2 py-1 bg-background/90 text-foreground"
          style={{ opacity: sliderPosition > 20 ? 1 : 0, transition: 'opacity 0.2s' }}
        >
          {beforeLabel}
        </span>
      </div>
      <div className="absolute bottom-4 right-4 z-20">
        <span 
          className="text-[10px] uppercase tracking-[0.15em] font-sans px-2 py-1 bg-background/90 text-foreground"
          style={{ opacity: sliderPosition < 80 ? 1 : 0, transition: 'opacity 0.2s' }}
        >
          {afterLabel}
        </span>
      </div>

      {/* Drag hint */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
        <motion.span 
          className="text-[10px] uppercase tracking-[0.15em] font-sans px-2 py-1 bg-black/50 text-white/90 backdrop-blur-sm"
          initial={{ opacity: 1 }}
          animate={{ opacity: hasInteracted ? 0 : 1 }}
          transition={{ duration: 0.3 }}
        >
          Drag to Compare
        </motion.span>
      </div>
    </div>
  );
}
