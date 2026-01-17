import { useState, useRef, useCallback, useEffect } from "react";
import { motion } from "framer-motion";

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

  // Auto-animate slider to demonstrate functionality
  useEffect(() => {
    if (hasInteracted || !isAnimating) return;

    let startTime: number | null = null;
    const duration = 2000; // 2 seconds per cycle
    const minPos = 25;
    const maxPos = 75;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = (elapsed % duration) / duration;
      
      // Ease in-out sine wave animation
      const eased = (Math.sin(progress * Math.PI * 2 - Math.PI / 2) + 1) / 2;
      const newPosition = minPos + eased * (maxPos - minPos);
      
      setSliderPosition(newPosition);
      animationRef.current = requestAnimationFrame(animate);
    };

    // Start animation after a short delay
    const timeout = setTimeout(() => {
      animationRef.current = requestAnimationFrame(animate);
    }, 500);

    return () => {
      clearTimeout(timeout);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [hasInteracted, isAnimating]);

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
          animate={!hasInteracted ? { scale: [1, 1.08, 1] } : {}}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "easeInOut",
          }}
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
