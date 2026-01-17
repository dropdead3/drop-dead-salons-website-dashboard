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
    <div className="relative w-full overflow-hidden">
      {/* Cream slanted overlay on top */}
      <div 
        className="absolute -top-4 left-0 right-0 h-20 bg-background -rotate-2 origin-top-left -mx-8 scale-x-125 z-10"
      />
      
      {/* Black section background */}
      <div className="w-full bg-foreground pt-14 pb-10">
        {/* Slanted marquee bar */}
        <div className="-rotate-2 -mx-8 scale-x-125">
          <div className="bg-foreground py-4">
            <div className="animate-marquee whitespace-nowrap flex">
              {/* Duplicate items for seamless loop */}
              {[...marqueeItems, ...marqueeItems].map((item, index) => (
                <span
                  key={index}
                  className="mx-8 text-sm uppercase tracking-[0.25em] font-sans font-light text-background"
                >
                  {item}
                </span>
              ))}
              {[...marqueeItems, ...marqueeItems].map((item, index) => (
                <span
                  key={`dup-${index}`}
                  className="mx-8 text-sm uppercase tracking-[0.25em] font-sans font-light text-background"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
