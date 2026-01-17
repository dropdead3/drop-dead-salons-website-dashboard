import { useState, useRef, useCallback } from "react";
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
  const containerRef = useRef<HTMLDivElement>(null);

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
      <motion.div
        className="absolute top-0 bottom-0 w-0.5 bg-foreground z-10"
        style={{ left: `${sliderPosition}%` }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Slider Handle */}
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-foreground flex items-center justify-center cursor-ew-resize shadow-lg"
          onMouseDown={handleMouseDown}
          onTouchStart={handleMouseDown}
          animate={!hasInteracted ? {
            x: [0, -8, 8, -8, 8, 0],
            scale: [1, 1.05, 1.05, 1.05, 1.05, 1],
          } : {}}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            repeatDelay: 2,
            ease: "easeInOut",
          }}
        >
          <div className="flex items-center gap-1.5">
            <motion.svg 
              width="6" height="10" viewBox="0 0 6 10" fill="none" className="text-background"
              animate={!hasInteracted ? { x: [-2, 0] } : {}}
              transition={{ duration: 0.75, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
            >
              <path d="M5 1L1 5L5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </motion.svg>
            <motion.svg 
              width="6" height="10" viewBox="0 0 6 10" fill="none" className="text-background"
              animate={!hasInteracted ? { x: [2, 0] } : {}}
              transition={{ duration: 0.75, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
            >
              <path d="M1 1L5 5L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </motion.svg>
          </div>
        </motion.div>
      </motion.div>

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
          className="text-[10px] uppercase tracking-[0.15em] font-sans text-foreground/60"
          initial={{ opacity: 1 }}
          animate={{ opacity: isDragging ? 0 : 1 }}
          transition={{ duration: 0.2 }}
        >
          Drag to Compare
        </motion.span>
      </div>
    </div>
  );
}
