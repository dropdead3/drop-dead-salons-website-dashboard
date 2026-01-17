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
    <div className="w-full bg-foreground text-background py-4 overflow-hidden">
      <div className="animate-marquee whitespace-nowrap flex">
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
  );
}
