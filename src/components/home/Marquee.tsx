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
    <div className="w-full bg-foreground py-4 overflow-hidden">
      <div className="marquee-container">
        {/* First set */}
        <div className="marquee-content gap-0">
          {marqueeItems.map((item, index) => (
            <span
              key={index}
              className="px-8 text-sm uppercase tracking-[0.25em] font-sans font-light text-background whitespace-nowrap"
            >
              {item}
            </span>
          ))}
        </div>
        {/* Duplicate set for seamless loop */}
        <div className="marquee-content gap-0" aria-hidden="true">
          {marqueeItems.map((item, index) => (
            <span
              key={`dup-${index}`}
              className="px-8 text-sm uppercase tracking-[0.25em] font-sans font-light text-background whitespace-nowrap"
            >
              {item}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
