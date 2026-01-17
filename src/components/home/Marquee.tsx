const marqueeItems = [
  "Color & Blonding",
  "Extensions",
  "Cutting & Styling",
  "Treatments",
  "Balayage",
  "Vivid Color",
  "Bridal",
  "Editorial",
];

export function Marquee() {
  return (
    <div className="relative w-full">
      {/* Cream slanted overlay - creates the diagonal cut effect */}
      <div 
        className="absolute top-0 left-0 right-0 h-20 bg-background z-10"
        style={{ 
          clipPath: 'polygon(0 0, 100% 0, 100% 30%, 0 100%)',
        }}
      />
      
      {/* Black background with marquee */}
      <div className="w-full bg-foreground pt-12 pb-4">
        <div className="animate-marquee whitespace-nowrap flex text-background">
          {/* Duplicate items for seamless loop */}
          {[...marqueeItems, ...marqueeItems].map((item, index) => (
            <span
              key={index}
              className="mx-8 text-sm uppercase tracking-[0.25em] font-sans font-light"
            >
              {item}
            </span>
          ))}
          {[...marqueeItems, ...marqueeItems].map((item, index) => (
            <span
              key={`dup-${index}`}
              className="mx-8 text-sm uppercase tracking-[0.25em] font-sans font-light"
            >
              {item}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
