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
    <div className="relative w-full overflow-hidden bg-foreground">
      {/* Cream slanted overlay - uses same rotation as marquee */}
      <div 
        className="absolute -top-8 left-0 right-0 h-24 bg-background -rotate-2 origin-top-right -mx-4 scale-x-110 z-10"
      />
      
      {/* Black background with slanted marquee - same rotation */}
      <div className="w-full pt-16 pb-8">
        <div 
          className="-rotate-2 -mx-4 scale-x-110 py-4"
        >
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
    </div>
  );
}
